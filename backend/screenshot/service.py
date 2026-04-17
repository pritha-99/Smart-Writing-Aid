from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from backend.config import SCREENSHOTS_DIR
from backend.storage.json_store import JsonCollection

try:
    import pyautogui
except Exception:
    pyautogui = None


class ScreenshotService:
    def __init__(self, screenshots_store: JsonCollection) -> None:
        self._screenshots_store = screenshots_store

    def capture(self, subject: str, session_id: str | None) -> dict[str, Any]:
        if pyautogui is None:
            raise RuntimeError("pyautogui is unavailable. Install dependencies and run with GUI access.")

        now = datetime.now(timezone.utc)
        date_str = now.strftime("%Y-%m-%d")
        safe_subject = subject.replace("/", "-").replace("\\", "-").strip() or "General"
        subject_dir = SCREENSHOTS_DIR / date_str / safe_subject
        subject_dir.mkdir(parents=True, exist_ok=True)

        filename = f"{now.strftime('%H%M%S')}_{uuid4().hex[:8]}.png"
        file_path = subject_dir / filename
        pyautogui.screenshot(str(file_path))

        metadata = {
            "id": str(uuid4()),
            "timestamp": now.isoformat(),
            "subject": safe_subject,
            "session_id": session_id,
            "file_path": str(file_path),
        }
        self._screenshots_store.append(metadata)
        return metadata

    def list_screenshots(self) -> list[dict[str, Any]]:
        return sorted(
            self._screenshots_store.read_all(),
            key=lambda item: item.get("timestamp", ""),
            reverse=True,
        )
