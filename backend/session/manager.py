from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from threading import Lock
from time import monotonic
from typing import Any
from uuid import uuid4

from backend.analytics.engine import AnalyticsEngine
from backend.storage.json_store import JsonCollection


@dataclass
class ActiveSession:
    id: str
    subject: str
    start_time: datetime
    mode: str
    mode_started_at: float
    writing_time: float
    watching_time: float


class SessionManager:
    def __init__(self, sessions_store: JsonCollection, analytics_engine: AnalyticsEngine) -> None:
        self._sessions_store = sessions_store
        self._analytics_engine = analytics_engine
        self._active: ActiveSession | None = None
        self._lock = Lock()

    def start_session(self, subject: str) -> dict[str, Any]:
        with self._lock:
            if self._active is not None:
                raise ValueError("A session is already running")

            now = datetime.now(timezone.utc)
            self._active = ActiveSession(
                id=str(uuid4()),
                subject=subject,
                start_time=now,
                mode="watching",
                mode_started_at=monotonic(),
                writing_time=0.0,
                watching_time=0.0,
            )
            return self._active_snapshot_unlocked()

    def stop_session(self) -> dict[str, Any]:
        with self._lock:
            if self._active is None:
                raise ValueError("No active session")

            self._accumulate_current_mode_unlocked()
            end_time = datetime.now(timezone.utc)
            total = self._active.writing_time + self._active.watching_time
            focus_score = self._analytics_engine.focus_score(self._active.writing_time, total)

            session = {
                "id": self._active.id,
                "subject": self._active.subject,
                "start_time": self._active.start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "writing_time": round(self._active.writing_time, 2),
                "watching_time": round(self._active.watching_time, 2),
                "focus_score": focus_score,
                "total_time": round(total, 2),
            }
            self._sessions_store.append(session)
            self._active = None
            return session

    def on_pause_signal(self) -> None:
        self._switch_mode("writing")

    def on_play_signal(self) -> None:
        self._switch_mode("watching")

    def _switch_mode(self, target_mode: str) -> None:
        with self._lock:
            if self._active is None or self._active.mode == target_mode:
                return
            self._accumulate_current_mode_unlocked()
            self._active.mode = target_mode
            self._active.mode_started_at = monotonic()

    def _accumulate_current_mode_unlocked(self) -> None:
        assert self._active is not None
        elapsed = max(0.0, monotonic() - self._active.mode_started_at)
        if self._active.mode == "writing":
            self._active.writing_time += elapsed
        else:
            self._active.watching_time += elapsed
        self._active.mode_started_at = monotonic()

    def list_sessions(self) -> list[dict[str, Any]]:
        sessions = self._sessions_store.read_all()
        return sorted(sessions, key=lambda item: item.get("start_time", ""), reverse=True)

    def get_active_session(self) -> dict[str, Any] | None:
        with self._lock:
            if self._active is None:
                return None
            return self._active_snapshot_unlocked()

    def _active_snapshot_unlocked(self) -> dict[str, Any]:
        assert self._active is not None
        now_elapsed = max(0.0, monotonic() - self._active.mode_started_at)
        writing = self._active.writing_time + (now_elapsed if self._active.mode == "writing" else 0.0)
        watching = self._active.watching_time + (now_elapsed if self._active.mode == "watching" else 0.0)
        total = writing + watching
        return {
            "id": self._active.id,
            "subject": self._active.subject,
            "start_time": self._active.start_time.isoformat(),
            "mode": self._active.mode,
            "writing_time": round(writing, 2),
            "watching_time": round(watching, 2),
            "focus_score": self._analytics_engine.focus_score(writing, total),
        }
