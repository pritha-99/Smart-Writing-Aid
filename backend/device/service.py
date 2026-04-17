from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from threading import Event, Lock, Thread
from time import sleep
from typing import Any

from backend.config import RECONNECT_SECONDS
from backend.debug.service import DebugService
from backend.events import EventBus

try:
    import serial
except Exception:
    serial = None


class DeviceService:
    def __init__(
        self,
        event_bus: EventBus,
        debug_service: DebugService,
        serial_port: str,
        baudrate: int,
    ) -> None:
        self._event_bus = event_bus
        self._debug_service = debug_service
        self._serial_port = serial_port
        self._baudrate = baudrate

        self._loop: asyncio.AbstractEventLoop | None = None
        self._stop_event = Event()
        self._thread: Thread | None = None
        self._serial_conn = None

        self._connected = False
        self._last_signal_at: datetime | None = None
        self._last_error = ""
        self._lock = Lock()

    def start(self) -> None:
        self._loop = asyncio.get_running_loop()
        if serial is None:
            self._debug_service.log("device_error", {"reason": "pyserial unavailable"})
            return
        if not self._serial_port:
            self._debug_service.log("device_info", {"reason": "SMART_PEN_SERIAL_PORT not configured"})
            return

        self._thread = Thread(target=self._read_loop, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=1)
        if self._serial_conn:
            try:
                self._serial_conn.close()
            except Exception:
                pass

    def status(self) -> dict[str, Any]:
        with self._lock:
            return {
                "connected": self._connected,
                "serial_port": self._serial_port,
                "baudrate": self._baudrate,
                "last_signal_at": self._last_signal_at.isoformat() if self._last_signal_at else None,
                "last_error": self._last_error or None,
            }

    async def mark_disconnected(self, reason: str) -> None:
        with self._lock:
            changed = self._connected
            self._connected = False
            self._last_error = reason
        if changed:
            await self._event_bus.emit("on_disconnect", {"reason": reason})
            self._debug_service.log("device_disconnected", {"reason": reason})

    async def ingest_signal(self, signal: str) -> None:
        normalized = signal.strip()
        signal_upper = normalized.upper()
        with self._lock:
            self._last_signal_at = datetime.now(timezone.utc)
            self._last_error = ""
        if signal_upper == "PAUSE":
            await self._event_bus.emit("on_pause_signal", {"signal": signal_upper})
        elif signal_upper == "PLAY":
            await self._event_bus.emit("on_play_signal", {"signal": signal_upper})
        elif signal_upper == "SHOT":
            await self._event_bus.emit("on_screenshot_signal", {"signal": signal_upper})
        elif signal_upper.startswith("PRESSURE:"):
            raw_value = normalized.split(":", 1)[1].strip()
            try:
                pressure_value = float(raw_value)
            except ValueError:
                self._debug_service.log("device_invalid_pressure", {"signal": normalized})
                return
            await self._event_bus.emit(
                "on_pressure_signal",
                {"signal": signal_upper, "pressure": pressure_value},
            )
        else:
            self._debug_service.log("device_unknown_signal", {"signal": signal_upper})

    def _read_loop(self) -> None:
        assert self._loop is not None

        while not self._stop_event.is_set():
            if self._serial_conn is None:
                self._connect_serial()
                if self._serial_conn is None:
                    sleep(RECONNECT_SECONDS)
                    continue

            try:
                raw = self._serial_conn.readline().decode(errors="ignore").strip()
                if not raw:
                    continue
                self._debug_service.log("device_raw", {"message": raw})
                asyncio.run_coroutine_threadsafe(self.ingest_signal(raw), self._loop)
            except Exception as exc:
                self._handle_disconnect(str(exc))
                sleep(RECONNECT_SECONDS)

    def _connect_serial(self) -> None:
        try:
            self._serial_conn = serial.Serial(self._serial_port, self._baudrate, timeout=1)
            with self._lock:
                self._connected = True
                self._last_error = ""
            asyncio.run_coroutine_threadsafe(self._event_bus.emit("on_connect", {}), self._loop)
            self._debug_service.log("device_connected", {"port": self._serial_port})
        except Exception as exc:
            self._serial_conn = None
            with self._lock:
                self._connected = False
                self._last_error = str(exc)
            self._debug_service.log("device_connect_error", {"error": str(exc)})

    def _handle_disconnect(self, reason: str) -> None:
        try:
            if self._serial_conn:
                self._serial_conn.close()
        except Exception:
            pass
        self._serial_conn = None
        with self._lock:
            was_connected = self._connected
            self._connected = False
            self._last_error = reason
        if was_connected:
            asyncio.run_coroutine_threadsafe(self._event_bus.emit("on_disconnect", {"reason": reason}), self._loop)
            self._debug_service.log("device_disconnected", {"reason": reason})
