from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from backend.analytics.engine import AnalyticsEngine
from backend.calibration.service import CalibrationService
from backend.config import (
    DATA_DIR,
    DEBUG_LOG_CAPACITY,
    DEVICE_TIMEOUT_SECONDS,
    ESP_ENABLED,
    ESP_POLL_INTERVAL_SECONDS,
    ESP_TIMEOUT_SECONDS,
    ESP_URL,
    FRONTEND_DIR,
    SERIAL_BAUDRATE,
    SERIAL_PORT,
)
from backend.debug.service import DebugService
from backend.device.esp_http_service import EspHttpService
from backend.device.service import DeviceService
from backend.events import EventBus
from backend.health.monitor import DeviceHealthMonitor
from backend.input.controller import InputController
from backend.screenshot.service import ScreenshotService
from backend.session.manager import SessionManager
from backend.storage.json_store import JsonCollection


class SessionStartRequest(BaseModel):
    subject: str = Field(min_length=1, max_length=80)


class ScreenshotRequest(BaseModel):
    subject: str = Field(default="General", max_length=80)
    session_id: str | None = None


class CalibrationRequest(BaseModel):
    baseline_pressure: float
    writing_pressure: float


class AutoCalibrationRequest(BaseModel):
    baseline_seconds: int = Field(default=10, ge=3, le=60)
    writing_seconds: int = Field(default=10, ge=3, le=60)


class SubjectRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class DeviceSignalRequest(BaseModel):
    signal: str = Field(min_length=1, max_length=20)


class WebSocketHub:
    def __init__(self) -> None:
        self._clients: list[WebSocket] = []

    async def connect(self, socket: WebSocket) -> None:
        await socket.accept()
        self._clients.append(socket)

    def disconnect(self, socket: WebSocket) -> None:
        if socket in self._clients:
            self._clients.remove(socket)

    async def broadcast(self, event: str, payload: dict[str, Any]) -> None:
        stale: list[WebSocket] = []
        message = {"event": event, "payload": payload}
        for client in self._clients:
            try:
                await client.send_json(message)
            except Exception:
                stale.append(client)
        for socket in stale:
            self.disconnect(socket)


@asynccontextmanager
async def lifespan(app: FastAPI):
    event_bus = EventBus()
    debug_service = DebugService(DEBUG_LOG_CAPACITY)

    sessions_store = JsonCollection(DATA_DIR / "sessions.json")
    screenshots_store = JsonCollection(DATA_DIR / "screenshots.json")
    subjects_store = JsonCollection(DATA_DIR / "subjects.json")
    calibration_store = JsonCollection(DATA_DIR / "calibration.json")

    analytics = AnalyticsEngine()
    session_manager = SessionManager(sessions_store, analytics)
    input_controller = InputController(debug_service)
    screenshot_service = ScreenshotService(screenshots_store)
    calibration_service = CalibrationService(calibration_store)
    websocket_hub = WebSocketHub()

    device_service = DeviceService(
        event_bus=event_bus,
        debug_service=debug_service,
        serial_port=SERIAL_PORT,
        baudrate=SERIAL_BAUDRATE,
    )
    esp_service = EspHttpService(
        device_service=device_service,
        debug_service=debug_service,
        url=ESP_URL,
        timeout_seconds=ESP_TIMEOUT_SECONDS,
        poll_interval_seconds=ESP_POLL_INTERVAL_SECONDS,
    )
    health_monitor = DeviceHealthMonitor(device_service, DEVICE_TIMEOUT_SECONDS)

    async def on_pause_signal(_: dict[str, Any]) -> None:
        session_manager.on_pause_signal()
        input_controller.press_play_pause()
        debug_service.log("pause_triggered", {})
        await websocket_hub.broadcast("pause_triggered", {})

    async def on_play_signal(_: dict[str, Any]) -> None:
        session_manager.on_play_signal()
        input_controller.press_play_pause()
        debug_service.log("resume_triggered", {})
        await websocket_hub.broadcast("resume_triggered", {})

    async def on_connect(payload: dict[str, Any]) -> None:
        debug_service.log("device_connected", payload)
        await websocket_hub.broadcast("device_connected", payload)

    async def on_disconnect(payload: dict[str, Any]) -> None:
        debug_service.log("device_disconnected", payload)
        await websocket_hub.broadcast("device_disconnected", payload)

    async def on_screenshot_signal(payload: dict[str, Any]) -> None:
        active = session_manager.get_active_session()
        subject = active["subject"] if active else "General"
        session_id = active["id"] if active else None
        try:
            data = screenshot_service.capture(subject=subject, session_id=session_id)
            debug_service.log("screenshot_captured", data)
            await websocket_hub.broadcast("screenshot_captured", data)
        except Exception as exc:
            debug_service.log("screenshot_error", {"error": str(exc), "signal": payload})

    async def on_pressure_signal(payload: dict[str, Any]) -> None:
        pressure = payload.get("pressure")
        if not isinstance(pressure, (int, float)):
            return
        await calibration_service.register_pressure_sample(float(pressure))
        await websocket_hub.broadcast("pressure_sample", {"pressure": float(pressure)})

    event_bus.subscribe("on_pause_signal", on_pause_signal)
    event_bus.subscribe("on_play_signal", on_play_signal)
    event_bus.subscribe("on_connect", on_connect)
    event_bus.subscribe("on_disconnect", on_disconnect)
    event_bus.subscribe("on_screenshot_signal", on_screenshot_signal)
    event_bus.subscribe("on_pressure_signal", on_pressure_signal)

    app.state.event_bus = event_bus
    app.state.debug_service = debug_service
    app.state.session_manager = session_manager
    app.state.screenshot_service = screenshot_service
    app.state.calibration_service = calibration_service
    app.state.subjects_store = subjects_store
    app.state.device_service = device_service
    app.state.esp_service = esp_service
    app.state.health_monitor = health_monitor
    app.state.websocket_hub = websocket_hub

    device_service.start()
    if ESP_ENABLED:
        esp_service.start()
    health_monitor.start()

    try:
        yield
    finally:
        await health_monitor.stop()
        if ESP_ENABLED:
            esp_service.stop()
        device_service.stop()


app = FastAPI(title="Smart Writing Aid", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")


@app.get("/")
def index() -> FileResponse:
    index_path = FRONTEND_DIR / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="Frontend not found")
    return FileResponse(index_path)


@app.post("/session/start")
def start_session(payload: SessionStartRequest) -> dict[str, Any]:
    try:
        session = app.state.session_manager.start_session(payload.subject.strip())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    subjects = app.state.subjects_store.read_all()
    if payload.subject not in [item.get("name") for item in subjects]:
        subjects.append({"name": payload.subject})
        app.state.subjects_store.overwrite(subjects)

    return session


@app.post("/session/stop")
def stop_session() -> dict[str, Any]:
    try:
        return app.state.session_manager.stop_session()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/sessions")
def list_sessions() -> list[dict[str, Any]]:
    return app.state.session_manager.list_sessions()


@app.get("/session/active")
def active_session() -> dict[str, Any] | None:
    return app.state.session_manager.get_active_session()


@app.get("/device/status")
def device_status() -> dict[str, Any]:
    return app.state.device_service.status()


@app.get("/device/esp/status")
def esp_status() -> dict[str, Any]:
    return app.state.esp_service.status()


@app.post("/device/signal")
async def ingest_signal(payload: DeviceSignalRequest) -> dict[str, str]:
    await app.state.device_service.ingest_signal(payload.signal)
    return {"status": "ok"}


@app.post("/screenshot")
def capture_screenshot(payload: ScreenshotRequest) -> dict[str, Any]:
    try:
        return app.state.screenshot_service.capture(payload.subject, payload.session_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/screenshots")
def list_screenshots() -> list[dict[str, Any]]:
    return app.state.screenshot_service.list_screenshots()


@app.post("/calibrate")
def calibrate(payload: CalibrationRequest) -> dict[str, Any]:
    return app.state.calibration_service.calibrate(
        baseline_pressure=payload.baseline_pressure,
        writing_pressure=payload.writing_pressure,
    )


@app.post("/calibrate/auto/start")
async def calibrate_auto_start(payload: AutoCalibrationRequest) -> dict[str, Any]:
    try:
        return await app.state.calibration_service.start_auto_calibration(
            baseline_seconds=payload.baseline_seconds,
            writing_seconds=payload.writing_seconds,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/calibrate/auto/status")
def calibrate_auto_status() -> dict[str, Any]:
    return app.state.calibration_service.status()


@app.get("/subjects")
def list_subjects() -> list[dict[str, Any]]:
    return app.state.subjects_store.read_all()


@app.post("/subjects")
def add_subject(payload: SubjectRequest) -> dict[str, str]:
    name = payload.name.strip()
    subjects = app.state.subjects_store.read_all()
    if name in [item.get("name") for item in subjects]:
        return {"status": "exists", "name": name}
    subjects.append({"name": name})
    app.state.subjects_store.overwrite(subjects)
    return {"status": "created", "name": name}


@app.get("/debug/logs")
def debug_logs() -> list[dict[str, Any]]:
    return app.state.debug_service.list_entries()


@app.websocket("/ws/events")
async def ws_events(websocket: WebSocket) -> None:
    await app.state.websocket_hub.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        app.state.websocket_hub.disconnect(websocket)
