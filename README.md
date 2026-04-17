# Smart Writing Aid (MVP)

Local software stack for pen-driven learning sessions with hardware signal ingestion, automatic play/pause control, screenshot capture, calibration, analytics, and live dashboards.

## Core Functionalities

- Session management:
	- Start/stop sessions by subject
	- Track writing time vs watching time
	- Compute live and final focus score
- Hardware signal processing:
	- Accept `PLAY`, `PAUSE`, `SHOT`, `PRESSURE:<value>` signals
	- Supports two hardware input paths:
		- Serial device input (`pyserial`)
		- ESP HTTP polling input (`/data` endpoint)
- Automatic playback control:
	- Triggers keyboard play/pause key on `PLAY`/`PAUSE` when enabled
- Screenshot workflow:
	- Capture screenshots manually or from `SHOT` signal
	- Store metadata in JSON and files under date/subject folders
- Calibration:
	- Manual calibration endpoint
	- Auto calibration (baseline phase + writing phase)
	- One-time setup calibration lock after successful auto setup
- Live monitoring and debugging:
	- Device status and ESP adapter status endpoints
	- Debug log stream for device, calibration, screenshot, and control events
	- WebSocket event broadcasting for real-time UI refresh
- Subject management:
	- Add/list subjects
	- Auto-add subject on session start if missing

## Frontend Functionalities

- `frontend/` (served at `http://localhost:8000`):
	- Live device status and ESP adapter status
	- Start/stop session
	- Add subject
	- Simulate `PLAY`/`PAUSE`
	- Capture screenshot
	- Auto calibration controls and status
	- Session history, screenshot list, debug feed
- `frontend-react/` (served by Vite at `http://localhost:5173`):
	- Live backend integration (no fixed mock timer)
	- Dashboard controls:
		- Start/stop session
		- Add subject
		- Simulate `PLAY`/`PAUSE`
		- Capture screenshot
		- Start auto calibration
	- Session history, screenshot viewer, debug panel
	- Polling + WebSocket updates from backend

## Architecture

- Backend framework: FastAPI
- Event backbone: `EventBus` + async event handlers
- Persistence: JSON collections in `data/`
- Main modules:
	- `backend/main.py`: app lifecycle, API routes, event wiring
	- `backend/device/service.py`: serial input service + signal ingestion
	- `backend/device/esp_http_service.py`: ESP HTTP polling adapter
	- `backend/session/manager.py`: active session state/time accounting
	- `backend/input/controller.py`: keyboard trigger abstraction
	- `backend/screenshot/service.py`: screenshot capture and metadata
	- `backend/calibration/service.py`: manual + auto calibration flow
	- `backend/health/monitor.py`: disconnect timeout monitoring
	- `backend/debug/service.py`: in-memory rolling debug logs

## Data Storage

- `data/sessions.json`: session history
- `data/screenshots.json`: screenshot metadata
- `data/subjects.json`: subject list
- `data/calibration.json`: calibration records
- `screenshots/YYYY-MM-DD/<Subject>/`: captured images

## Setup

1. Create and activate virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install backend dependencies:

```bash
pip install -r requirements.txt
```

3. Optional: create/edit `.env` at repo root (`/home/pritha/ptt/.env`).

4. Load environment variables:

```bash
set -a && source .env && set +a
```

5. Start backend:

```bash
uvicorn backend.main:app --reload --port 8000
```

6. Open classic frontend:

- `http://localhost:8000`

## React Frontend Setup

```bash
cd frontend-react
npm install
npm run dev
```

Open `http://localhost:5173`.

Default API behavior:

- In Vite dev on port `5173`, frontend targets `http://localhost:8000`
- Override with `VITE_API_BASE_URL`

## Hardware Connection Modes

### Mode A: Serial Device

Set:

```bash
SMART_PEN_SERIAL_PORT=/dev/ttyUSB0
SMART_PEN_BAUDRATE=115200
```

The backend reads serial lines and ingests supported signals.

### Mode B: ESP HTTP Polling

Set:

```bash
SMART_PEN_ESP_ENABLED=true
SMART_PEN_ESP_URL=http://<ESP_IP>/data
SMART_PEN_ESP_TIMEOUT_SECONDS=2
SMART_PEN_ESP_POLL_INTERVAL_SECONDS=0.2
```

The ESP adapter polls endpoint text and forwards normalized signals to the same ingestion pipeline.

Debounce behavior for ESP polling:

- Repeated `PLAY`/`PAUSE` values are suppressed unless state changes
- Repeated `SHOT` values fire only once until a non-`SHOT` value arrives

## Environment Variables

- `SMART_PEN_SERIAL_PORT`
- `SMART_PEN_BAUDRATE` (default `115200`)
- `SMART_PEN_TIMEOUT_SECONDS` (default `12`)
- `SMART_PEN_RECONNECT_SECONDS` (default `3`)
- `SMART_PEN_DEBUG_LOG_CAPACITY` (default `300`)
- `SMART_PEN_ENABLE_KEYBOARD_CONTROL` (default `false`)
- `SMART_PEN_PLAY_PAUSE_KEY` (default `space`)
- `SMART_PEN_ESP_ENABLED` (default `false`)
- `SMART_PEN_ESP_URL`
- `SMART_PEN_ESP_TIMEOUT_SECONDS` (default `2`)
- `SMART_PEN_ESP_POLL_INTERVAL_SECONDS` (default `0.2`)

## API Endpoints

### Session

- `POST /session/start`
- `POST /session/stop`
- `GET /session/active`
- `GET /sessions`

### Device

- `GET /device/status`
- `GET /device/esp/status`
- `POST /device/signal`

### Screenshot

- `POST /screenshot`
- `GET /screenshots`

### Calibration

- `POST /calibrate`
- `POST /calibrate/auto/start`
- `GET /calibrate/auto/status`

### Subjects

- `GET /subjects`
- `POST /subjects`

### Debug + Events

- `GET /debug/logs`
- WebSocket: `/ws/events`

## Supported Signal Formats

- `PLAY`
- `PAUSE`
- `SHOT`
- `PRESSURE:<number>`

Examples:

- `PRESSURE:412.6`
- `pressure:327`

## Notes

- Screenshot capture requires GUI access and `pyautogui` support.
- Keyboard control is disabled by default for safety.
- If hardware is unavailable, you can still test via `POST /device/signal` or frontend simulate buttons.
- Legacy standalone `script.py` was the original prototype loop. Integrated runtime is now the backend services.
