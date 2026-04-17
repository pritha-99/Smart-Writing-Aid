from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from backend.device.service import DeviceService


class DeviceHealthMonitor:
    def __init__(self, device_service: DeviceService, timeout_seconds: int = 12) -> None:
        self._device_service = device_service
        self._timeout_seconds = timeout_seconds
        self._task: asyncio.Task | None = None
        self._running = False

    def start(self) -> None:
        self._running = True
        self._task = asyncio.create_task(self._loop())

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    async def _loop(self) -> None:
        while self._running:
            status = self._device_service.status()
            if status["connected"] and status["last_signal_at"]:
                last_signal = datetime.fromisoformat(status["last_signal_at"])
                elapsed = (datetime.now(timezone.utc) - last_signal).total_seconds()
                if elapsed > self._timeout_seconds:
                    await self._device_service.mark_disconnected(
                        f"No signal for {self._timeout_seconds}s"
                    )
            await asyncio.sleep(1)
