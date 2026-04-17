from __future__ import annotations

from collections import deque
from datetime import datetime, timezone
from threading import Lock
from typing import Any


class DebugService:
    def __init__(self, capacity: int = 300) -> None:
        self._capacity = capacity
        self._entries: deque[dict[str, Any]] = deque(maxlen=capacity)
        self._lock = Lock()

    def log(self, event: str, details: dict[str, Any] | None = None) -> None:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event": event,
            "details": details or {},
        }
        with self._lock:
            self._entries.appendleft(payload)

    def list_entries(self) -> list[dict[str, Any]]:
        with self._lock:
            return list(self._entries)
