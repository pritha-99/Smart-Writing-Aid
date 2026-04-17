from __future__ import annotations

from backend.config import ENABLE_KEYBOARD_CONTROL, PLAY_PAUSE_KEY
from backend.debug.service import DebugService

try:
    import pyautogui
except Exception:
    pyautogui = None


class InputController:
    def __init__(self, debug_service: DebugService) -> None:
        self._debug_service = debug_service

    def press_play_pause(self) -> bool:
        if not ENABLE_KEYBOARD_CONTROL:
            self._debug_service.log(
                "keyboard_skipped",
                {"reason": "SMART_PEN_ENABLE_KEYBOARD_CONTROL is false", "key": PLAY_PAUSE_KEY},
            )
            return False

        if pyautogui is None:
            self._debug_service.log("keyboard_error", {"reason": "pyautogui unavailable"})
            return False

        pyautogui.press(PLAY_PAUSE_KEY)
        self._debug_service.log("keyboard_press", {"key": PLAY_PAUSE_KEY})
        return True
