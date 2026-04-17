# Smart Writing Aid – Software PRD (MVP)

## 1. Overview

This application is a **local web-based system** that integrates with a smart pen device to enhance learning from video content.

The system detects writing activity from the pen and automatically controls video playback, tracks study sessions, captures screenshots, and provides analytics.

The hardware sends signals (`PAUSE`, `PLAY`) via Serial/Bluetooth to the application.

---

## 2. Goals

* Eliminate manual video control during note-taking
* Track learning sessions and provide insights
* Enable resource organization by subject
* Provide a seamless, low-distraction study workflow

---

## 3. Tech Stack (MVP)

### Backend

* Python (FastAPI preferred)
* Serial communication (`pyserial`)
* Keyboard control (`pyautogui`)
* Local storage (JSON files)

### Frontend

* React (or simple HTML + JS if needed)
* Runs on `localhost`

### Communication

* REST API (frontend ↔ backend)
* WebSocket (real-time device status updates)

---

## 4. System Architecture

```
[ESP32 Pen] 
    ↓ (Serial/Bluetooth)
[Device Service]
    ↓
[Input Controller] ---> [Keyboard Events (OS level)]
    ↓
[Session Manager]
    ↓
[Analytics Engine]
    ↓
[Storage Layer (JSON)]
    ↓
[Frontend UI]
```

---

## 5. Core Modules

### 5.1 Device Service

Handles communication with ESP32.

**Responsibilities:**

* Read incoming signals (`PAUSE`, `PLAY`)
* Track connection status
* Auto-reconnect on failure
* Emit events to system

**Events:**

* `on_pause_signal`
* `on_play_signal`
* `on_disconnect`
* `on_connect`

---

### 5.2 Input Controller

Controls system-level keyboard input.

**Responsibilities:**

* Trigger global play/pause key
* Configurable key binding

**API:**

```python
press_play_pause()
```

---

### 5.3 Session Manager

**Responsibilities:**

* Start/stop learning session
* Store session metadata
* Track:

  * start time
  * end time
  * subject
  * writing duration
  * watching duration

---

### 5.4 Analytics Engine

**Writing Score Calculation:**

```
writing_score = (writing_time / total_session_time) * 100
```

**Outputs:**

* Total study time
* Writing vs watching ratio

---

### 5.5 Screenshot Service

**Trigger:**

* Push button from pen

**Behavior:**

* Capture full screen
* Save to folder:
  `/screenshots/{date}/{subject}/`

**Metadata JSON:**

```json
{
  "timestamp": "ISO",
  "subject": "string",
  "session_id": "string",
  "file_path": "string"
}
```

---

### 5.6 Storage Layer

Use JSON files:

```
/data/
  sessions.json
  screenshots.json
  subjects.json
```

---

### 5.7 Device Health Monitor

**Checks:**

* Last signal timestamp
* Connection state

**Behavior:**

* If no signal for X seconds:

  * Mark as disconnected
  * Show UI popup

---

### 5.8 Calibration Module

**Setup Flow:**

1. User holds pen (idle)
2. User writes
3. System records:

   * baseline pressure
   * writing pressure

**Output:**

* Recommended threshold

---

### 5.9 Debug Mode

**Displays:**

* Raw sensor values
* Incoming signals
* Connection logs

---

## 6. Features

### 6.1 Home Page

Components:

* Start Learning button
* Current session status
* Pen connection indicator
* Timer (optional)
* Subject selector

---

### 6.2 Session Flow

1. User clicks "Start Learning"
2. Selects subject
3. Device connects
4. Writing detected:

   * Send pause command
5. Writing stops:

   * Resume video
6. User stops session

---

### 6.3 History Page

Displays:

* Date
* Subject
* Total time
* Focus score

---

### 6.4 Screenshot Viewer

* View screenshots by subject/date
* Open folder

---

### 6.5 Study Resources

* Add links/files per subject
* Search functionality

---

## 7. Data Models

### Session

```json
{
  "id": "uuid",
  "subject": "string",
  "start_time": "ISO",
  "end_time": "ISO",
  "writing_time": "number",
  "watching_time": "number",
  "focus_score": "number"
}
```

### Screenshot

```json
{
  "id": "uuid",
  "timestamp": "ISO",
  "subject": "string",
  "session_id": "uuid",
  "file_path": "string"
}
```

---

## 8. API Endpoints

### Session

* `POST /session/start`
* `POST /session/stop`
* `GET /sessions`

### Device

* `GET /device/status`

### Screenshot

* `POST /screenshot`
* `GET /screenshots`

### Calibration

* `POST /calibrate`

---

## 9. WebSocket Events

* `device_connected`
* `device_disconnected`
* `pause_triggered`
* `resume_triggered`

---

## 10. Folder Structure

```
project/
│
├── backend/
│   ├── main.py
│   ├── device/
│   ├── input/
│   ├── session/
│   ├── analytics/
│   ├── storage/
│   ├── screenshot/
│   └── calibration/
│
├── frontend/
│   ├── src/
│   └── public/
│
├── data/
├── screenshots/
└── README.md
```

---

## 11. Non-Functional Requirements

* Low latency (<200ms response)
* Works offline (localhost only)
* Cross-platform (Windows priority)

---

## 12. MVP Scope

### Included:

* Device → Play/Pause control
* Session tracking
* Focus score
* Screenshot capture (manual via pen)
* Subject-based organization
* Debug mode
* Calibration setup
* Device health monitoring

### Excluded:

* Cloud sync
* Plugin integrations
* Advanced UI widgets

---

## 13. Future Extensions

* Bluetooth support (replace serial)
* Browser extension integration
* Advanced analytics dashboard
* Gesture-based controls

---

## 14. Notes for GitHub Copilot

* Keep modules loosely coupled
* Use event-driven architecture
* Avoid hardcoding COM ports
* Abstract device communication layer
* Ensure thread-safe serial reading
* Use async APIs where possible

---
