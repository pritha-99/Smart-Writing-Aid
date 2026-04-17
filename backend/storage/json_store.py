from __future__ import annotations

import json
from pathlib import Path
from threading import Lock
from typing import Any


class JsonCollection:
    def __init__(self, file_path: Path) -> None:
        self.file_path = file_path
        self._lock = Lock()
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            self.file_path.write_text("[]", encoding="utf-8")

    def _read_unlocked(self) -> list[dict[str, Any]]:
        raw = self.file_path.read_text(encoding="utf-8").strip()
        if not raw:
            return []
        data = json.loads(raw)
        if isinstance(data, list):
            return data
        raise ValueError(f"Expected JSON list in {self.file_path}")

    def _write_unlocked(self, data: list[dict[str, Any]]) -> None:
        self.file_path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def read_all(self) -> list[dict[str, Any]]:
        with self._lock:
            return self._read_unlocked()

    def append(self, item: dict[str, Any]) -> None:
        with self._lock:
            data = self._read_unlocked()
            data.append(item)
            self._write_unlocked(data)

    def overwrite(self, data: list[dict[str, Any]]) -> None:
        with self._lock:
            self._write_unlocked(data)
