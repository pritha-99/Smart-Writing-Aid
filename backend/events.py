from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import Any, Awaitable, Callable

Callback = Callable[[dict[str, Any]], Awaitable[None] | None]


class EventBus:
    def __init__(self) -> None:
        self._subscribers: dict[str, list[Callback]] = defaultdict(list)

    def subscribe(self, event_name: str, callback: Callback) -> None:
        self._subscribers[event_name].append(callback)

    async def emit(self, event_name: str, payload: dict[str, Any] | None = None) -> None:
        payload = payload or {}
        callbacks = self._subscribers.get(event_name, [])
        for callback in callbacks:
            result = callback(payload)
            if asyncio.iscoroutine(result):
                await result
