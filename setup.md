# Setup Guide

This guide helps you set up the Smart Writing Aid codebase and all dependencies.

## 1. Prerequisites

Install these first:

- Python `3.10+`
- Node.js `18+` and npm
- Git (optional, recommended)
- A GUI desktop session (required for `pyautogui` screenshot/keyboard features)

## 2. Clone/Open Project

If already available locally, open:

- `/home/pritha/ptt`

## 3. Backend Setup (Python)

### Linux/macOS

```bash
cd /home/pritha/ptt
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Windows PowerShell

```powershell
cd C:\path\to\ptt
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Windows CMD

```bat
cd C:\path\to\ptt
py -3 -m venv .venv
.venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## 4. Frontend Setup (React)

```bash
cd /home/pritha/ptt/frontend-react
npm install
```

On Windows, use your local project path instead of `/home/pritha/ptt`.

## 5. Environment Configuration

A `.env` file is already supported at repo root.

Example values:

```env
# Serial device (optional if using ESP HTTP polling)
SMART_PEN_SERIAL_PORT=
SMART_PEN_BAUDRATE=115200

# Device behavior
SMART_PEN_TIMEOUT_SECONDS=12
SMART_PEN_RECONNECT_SECONDS=3
SMART_PEN_DEBUG_LOG_CAPACITY=300

# Keyboard control
SMART_PEN_ENABLE_KEYBOARD_CONTROL=true
SMART_PEN_PLAY_PAUSE_KEY=space

# ESP HTTP polling adapter
SMART_PEN_ESP_ENABLED=true
SMART_PEN_ESP_URL=http://10.251.100.160/data
SMART_PEN_ESP_TIMEOUT_SECONDS=2
SMART_PEN_ESP_POLL_INTERVAL_SECONDS=0.2
```

## 6. Choose Hardware Mode

Use one mode at a time.

### Mode A: ESP HTTP Polling

- Set `SMART_PEN_ESP_ENABLED=true`
- Set `SMART_PEN_ESP_URL=http://<ESP_IP>/data`
- Keep serial port empty if not used

### Mode B: Serial Device

- Set `SMART_PEN_ESP_ENABLED=false`
- Set serial values:
  - Linux: `SMART_PEN_SERIAL_PORT=/dev/ttyUSB0`
  - Windows: `SMART_PEN_SERIAL_PORT=COM3` (example)

## 7. Run Backend

### Linux/macOS

```bash
cd /home/pritha/ptt
source .venv/bin/activate
set -a && source .env && set +a
uvicorn backend.main:app --reload --port 8000
```

### Windows PowerShell

```powershell
cd C:\path\to\ptt
.\.venv\Scripts\Activate.ps1
Get-Content .env | ForEach-Object {
  if ($_ -match '^(?!#)([^=]+)=(.*)$') {
    [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
  }
}
uvicorn backend.main:app --reload --port 8000
```

## 8. Run Frontend

### Classic frontend (served by backend)

Open:

- `http://localhost:8000`

### React frontend (Vite)

```bash
cd /home/pritha/ptt/frontend-react
npm run dev
```

Open:

- `http://localhost:5173`

React frontend calls backend at `http://localhost:8000` by default in dev mode.

Optional override:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

## 9. Verify Installation

Check backend health APIs:

- `GET http://localhost:8000/device/status`
- `GET http://localhost:8000/device/esp/status`
- `GET http://localhost:8000/debug/logs`

If using ESP mode, verify:

- `running: true`
- `last_poll_at` updates
- `last_error: null`

## 10. Functional Smoke Test

1. Start session in frontend (`Start Learning`)
2. Send/simulate `PAUSE` and `PLAY`
3. Trigger/click screenshot capture
4. Confirm entries appear in:
   - `data/sessions.json`
   - `data/screenshots.json`
5. Confirm screenshot files are created under `screenshots/YYYY-MM-DD/<Subject>/`

## 11. Troubleshooting

- `pyautogui` errors:
  - Ensure desktop GUI session is active
  - Grant screen/keyboard permissions as required by OS
- No hardware signals:
  - Check `.env` mode settings (ESP vs serial)
  - Verify ESP endpoint manually: `http://<ESP_IP>/data`
  - Verify serial port name (`/dev/ttyUSB0` vs `COMx`)
- React shows no live data:
  - Ensure backend is running on `:8000`
  - Check browser console/network for API errors

## 12. Important Note

Do not run legacy `script.py` and backend ESP integration at the same time. Use backend services as the single runtime path.
