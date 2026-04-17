from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
from time import monotonic
from typing import Any

from backend.storage.json_store import JsonCollection


@dataclass
class AutoCalibrationState:
    running: bool
    phase: str
    phase_started_at: float
    phase_duration_seconds: int
    baseline_samples: list[float]
    writing_samples: list[float]
    result: dict[str, Any] | None
    error: str | None


class CalibrationService:
    def __init__(self, calibration_store: JsonCollection) -> None:
        self._calibration_store = calibration_store
        self._state = AutoCalibrationState(
            running=False,
            phase="idle",
            phase_started_at=0.0,
            phase_duration_seconds=0,
            baseline_samples=[],
            writing_samples=[],
            result=None,
            error=None,
        )
        self._lock = asyncio.Lock()

    def calibrate(
        self,
        baseline_pressure: float,
        writing_pressure: float,
        source: str = "manual",
    ) -> dict[str, Any]:
        threshold = round((baseline_pressure + writing_pressure) / 2.0, 2)
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "baseline_pressure": baseline_pressure,
            "writing_pressure": writing_pressure,
            "recommended_threshold": threshold,
            "source": source,
        }
        history = self._calibration_store.read_all()
        history.append(payload)
        self._calibration_store.overwrite(history)
        return payload

    async def start_auto_calibration(
        self,
        baseline_seconds: int = 10,
        writing_seconds: int = 10,
    ) -> dict[str, Any]:
        async with self._lock:
            if self._state.running:
                raise ValueError("Auto calibration is already running")
            if self._has_completed_setup_calibration():
                raise ValueError("Auto calibration already completed during setup")

            self._state.running = True
            self._state.phase = "baseline"
            self._state.phase_started_at = monotonic()
            self._state.phase_duration_seconds = baseline_seconds
            self._state.baseline_samples = []
            self._state.writing_samples = []
            self._state.result = None
            self._state.error = None

        asyncio.create_task(self._run_auto_calibration(baseline_seconds, writing_seconds))
        return self.status()

    async def register_pressure_sample(self, pressure: float) -> None:
        async with self._lock:
            if not self._state.running:
                return
            if self._state.phase == "baseline":
                self._state.baseline_samples.append(pressure)
            elif self._state.phase == "writing":
                self._state.writing_samples.append(pressure)

    def status(self) -> dict[str, Any]:
        latest = self.latest()
        latest_setup = self.latest_setup()
        phase_remaining = 0.0
        if self._state.running and self._state.phase_duration_seconds > 0:
            elapsed = max(0.0, monotonic() - self._state.phase_started_at)
            phase_remaining = max(0.0, self._state.phase_duration_seconds - elapsed)

        return {
            "running": self._state.running,
            "phase": self._state.phase,
            "phase_remaining_seconds": round(phase_remaining, 1),
            "baseline_sample_count": len(self._state.baseline_samples),
            "writing_sample_count": len(self._state.writing_samples),
            "setup_completed": latest_setup is not None,
            "result": self._state.result,
            "latest": latest,
            "latest_setup": latest_setup,
            "error": self._state.error,
        }

    def latest(self) -> dict[str, Any] | None:
        history = self._calibration_store.read_all()
        if not history:
            return None
        return history[-1]

    def latest_setup(self) -> dict[str, Any] | None:
        history = self._calibration_store.read_all()
        for entry in reversed(history):
            if entry.get("source") == "auto_setup":
                return entry
        return None

    def _has_completed_setup_calibration(self) -> bool:
        return self.latest_setup() is not None

    async def _run_auto_calibration(self, baseline_seconds: int, writing_seconds: int) -> None:
        try:
            await asyncio.sleep(baseline_seconds)

            async with self._lock:
                self._state.phase = "writing"
                self._state.phase_started_at = monotonic()
                self._state.phase_duration_seconds = writing_seconds

            await asyncio.sleep(writing_seconds)

            async with self._lock:
                baseline_samples = self._state.baseline_samples[:]
                writing_samples = self._state.writing_samples[:]

            if not baseline_samples:
                raise ValueError("No baseline pressure samples received")
            if not writing_samples:
                raise ValueError("No writing pressure samples received")

            baseline_avg = round(sum(baseline_samples) / len(baseline_samples), 2)
            writing_avg = round(sum(writing_samples) / len(writing_samples), 2)
            result = self.calibrate(baseline_avg, writing_avg, source="auto_setup")

            async with self._lock:
                self._state.running = False
                self._state.phase = "completed"
                self._state.phase_started_at = 0.0
                self._state.phase_duration_seconds = 0
                self._state.result = result
                self._state.error = None
        except Exception as exc:
            async with self._lock:
                self._state.running = False
                self._state.phase = "error"
                self._state.phase_started_at = 0.0
                self._state.phase_duration_seconds = 0
                self._state.result = None
                self._state.error = str(exc)
