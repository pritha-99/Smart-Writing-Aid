from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
SCREENSHOTS_DIR = BASE_DIR / "screenshots"
FRONTEND_DIR = BASE_DIR / "frontend"
SCREENSHOTS_PUBLIC_PREFIX = "/screenshots/files"

DATA_DIR.mkdir(parents=True, exist_ok=True)
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

SERIAL_PORT = os.getenv("SMART_PEN_SERIAL_PORT", "")
SERIAL_BAUDRATE = int(os.getenv("SMART_PEN_BAUDRATE", "115200"))
DEVICE_TIMEOUT_SECONDS = int(os.getenv("SMART_PEN_TIMEOUT_SECONDS", "12"))
RECONNECT_SECONDS = int(os.getenv("SMART_PEN_RECONNECT_SECONDS", "3"))
PLAY_PAUSE_KEY = os.getenv("SMART_PEN_PLAY_PAUSE_KEY", "space")
ENABLE_KEYBOARD_CONTROL = os.getenv("SMART_PEN_ENABLE_KEYBOARD_CONTROL", "false").lower() == "true"
DEBUG_LOG_CAPACITY = int(os.getenv("SMART_PEN_DEBUG_LOG_CAPACITY", "300"))

ESP_ENABLED = os.getenv("SMART_PEN_ESP_ENABLED", "false").lower() == "true"
ESP_URL = os.getenv("SMART_PEN_ESP_URL", "")
ESP_TIMEOUT_SECONDS = float(os.getenv("SMART_PEN_ESP_TIMEOUT_SECONDS", "2"))
ESP_POLL_INTERVAL_SECONDS = float(os.getenv("SMART_PEN_ESP_POLL_INTERVAL_SECONDS", "0.2"))
ESP_SHOT_REARM_SECONDS = float(os.getenv("SMART_PEN_ESP_SHOT_REARM_SECONDS", "0.8"))
