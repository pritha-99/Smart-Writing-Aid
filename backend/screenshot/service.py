from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote
from uuid import uuid4

from backend.config import SCREENSHOTS_DIR, SCREENSHOTS_PUBLIC_PREFIX
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

        relative_path = file_path.relative_to(SCREENSHOTS_DIR).as_posix()

        metadata = {
            "id": str(uuid4()),
            "timestamp": now.isoformat(),
            "subject": safe_subject,
            "session_id": session_id,
            "file_path": str(file_path),
            "relative_path": relative_path,
            "public_url": self._public_url(relative_path),
        }
        self._screenshots_store.append(metadata)
        return metadata

    def list_screenshots(self) -> list[dict[str, Any]]:
        items = [self._decorate_metadata(item) for item in self._screenshots_store.read_all()]
        return sorted(
            items,
            key=lambda item: item.get("timestamp", ""),
            reverse=True,
        )

    def _decorate_metadata(self, item: dict[str, Any]) -> dict[str, Any]:
        enriched = dict(item)
        relative_path = enriched.get("relative_path") or self._infer_relative_path(enriched.get("file_path"))
        if relative_path:
            enriched["relative_path"] = relative_path
            enriched["public_url"] = enriched.get("public_url") or self._public_url(relative_path)
        return enriched

    def _infer_relative_path(self, file_path: str | None) -> str | None:
        if not file_path:
            return None

        raw = str(file_path).replace("\\", "/")
        marker = "/screenshots/"
        lowered = raw.lower()
        marker_pos = lowered.find(marker)
        if marker_pos >= 0:
            relative = raw[marker_pos + len(marker) :].lstrip("/")
            return relative or None

        candidate = Path(file_path)
        if not candidate.is_absolute():
            relative = raw.lstrip("/")
            return relative or None

        try:
            return candidate.resolve().relative_to(SCREENSHOTS_DIR.resolve()).as_posix()
        except Exception:
            return None

    def _public_url(self, relative_path: str) -> str:
        encoded = quote(relative_path, safe="/")
        return f"{SCREENSHOTS_PUBLIC_PREFIX}/{encoded}"
