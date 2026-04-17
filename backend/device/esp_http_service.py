from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from threading import Event, Thread
from threading import Lock
from time import monotonic
from time import sleep
from typing import Any

import requests

from backend.debug.service import DebugService
from backend.device.service import DeviceService


class EspHttpService:
    def __init__(
        self,
        device_service: DeviceService,
        debug_service: DebugService,
        url: str,
        timeout_seconds: float,
        poll_interval_seconds: float,
        shot_rearm_seconds: float,
    ) -> None:
        self._device_service = device_service
        self._debug_service = debug_service
        self._url = url
        self._timeout_seconds = timeout_seconds
        self._poll_interval_seconds = poll_interval_seconds
        self._shot_rearm_seconds = max(0.1, shot_rearm_seconds)

        self._loop: asyncio.AbstractEventLoop | None = None
        self._thread: Thread | None = None
        self._stop_event = Event()
        self._lock = Lock()

        self._last_state: str | None = None
        self._last_shot = False
        self._last_shot_at = 0.0
        self._last_poll_at: datetime | None = None
        self._last_signal: str | None = None
        self._last_error = ""

    def status(self) -> dict[str, Any]:
        with self._lock:
            return {
                "enabled": bool(self._url),
                "running": self._thread is not None and self._thread.is_alive(),
                "url": self._url,
                "timeout_seconds": self._timeout_seconds,
                "poll_interval_seconds": self._poll_interval_seconds,
                "shot_rearm_seconds": self._shot_rearm_seconds,
                "last_poll_at": self._last_poll_at.isoformat() if self._last_poll_at else None,
                "last_signal": self._last_signal,
                "last_error": self._last_error or None,
            }

    def start(self) -> None:
        if not self._url:
            self._debug_service.log("esp_info", {"reason": "SMART_PEN_ESP_URL not configured"})
            return

        self._loop = asyncio.get_running_loop()
        self._thread = Thread(target=self._poll_loop, daemon=True)
        self._thread.start()
        self._debug_service.log("esp_started", {"url": self._url})

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=1)

    def _poll_loop(self) -> None:
        assert self._loop is not None

        while not self._stop_event.is_set():
            try:
                response = requests.get(self._url, timeout=self._timeout_seconds)
                with self._lock:
                    self._last_poll_at = datetime.now(timezone.utc)
                    self._last_error = ""
                data = response.text.strip().upper()
                signal = self._normalize_signal(data)
                if signal:
                    with self._lock:
                        self._last_signal = signal
                    asyncio.run_coroutine_threadsafe(
                        self._device_service.ingest_signal(signal),
                        self._loop,
                    )
            except requests.exceptions.RequestException as exc:
                with self._lock:
                    self._last_error = str(exc)
                self._debug_service.log("esp_connection_error", {"error": str(exc)})
            except Exception as exc:
                with self._lock:
                    self._last_error = str(exc)
                self._debug_service.log("esp_error", {"error": str(exc)})

            sleep(self._poll_interval_seconds)

    def _normalize_signal(self, data: str) -> str | None:
        # Suppress repeated PLAY/PAUSE signals while state is unchanged.
        if data == "PAUSE":
            if self._last_state == "PAUSE":
                return None
            self._last_state = "PAUSE"
            return "PAUSE"

        if data == "PLAY":
            if self._last_state == "PLAY":
                return None
            self._last_state = "PLAY"
            return "PLAY"

        # Fire SHOT only once while the source keeps sending SHOT.
        if data == "SHOT":
            now = monotonic()
            if self._last_shot and (now - self._last_shot_at) < self._shot_rearm_seconds:
                return None
            self._last_shot = True
            self._last_shot_at = now
            return "SHOT"

        self._last_shot = False
        return None
