const state = {
  activeSession: null,
  subjects: [],
};

const $ = (id) => document.getElementById(id);

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || `Request failed: ${response.status}`);
  }

  return response.json();
}

async function refreshDeviceStatus() {
  const status = await api("/device/status");
  const el = $("deviceStatus");
  el.textContent = status.connected ? "Connected" : "Disconnected";
  el.classList.toggle("online", status.connected);
  el.classList.toggle("offline", !status.connected);
}

async function refreshEspStatus() {
  const el = $("espStatus");
  try {
    const status = await api("/device/esp/status");
    const running = Boolean(status.running);
    const enabled = Boolean(status.enabled);
    const label = running ? "Polling" : enabled ? "Enabled (idle)" : "Disabled";
    el.textContent = label;
    el.classList.toggle("online", running);
    el.classList.toggle("offline", !running);

    const detailsEl = $("espStatusDetails");
    const lastSignal = status.last_signal || "-";
    const lastPoll = status.last_poll_at ? new Date(status.last_poll_at).toLocaleTimeString() : "-";
    const lastError = status.last_error || "none";
    detailsEl.textContent = `Last signal: ${lastSignal} | Last poll: ${lastPoll} | Error: ${lastError}`;
  } catch (error) {
    el.textContent = "Unavailable";
    el.classList.remove("online");
    el.classList.add("offline");
    $("espStatusDetails").textContent = `ESP status unavailable: ${error.message}`;
  }
}

async function refreshSubjects() {
  state.subjects = await api("/subjects");
  const select = $("subjectSelect");
  select.innerHTML = "";
  const fallback = state.subjects.length ? state.subjects : [{ name: "General" }];
  fallback.forEach((subject) => {
    const option = document.createElement("option");
    option.value = subject.name;
    option.textContent = subject.name;
    select.appendChild(option);
  });
}

async function refreshSessions() {
  const sessions = await api("/sessions");
  const body = $("historyTable");
  body.innerHTML = "";
  sessions.slice(0, 20).forEach((session) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${new Date(session.start_time).toLocaleString()}</td>
      <td>${session.subject}</td>
      <td>${Math.round(session.total_time || session.watching_time + session.writing_time)}s</td>
      <td>${session.focus_score}%</td>
    `;
    body.appendChild(row);
  });
}

async function refreshScreenshots() {
  const shots = await api("/screenshots");
  const list = $("screenshotsList");
  list.innerHTML = "";
  shots.slice(0, 20).forEach((shot) => {
    const item = document.createElement("li");
    const title = document.createElement("button");
    title.type = "button";
    title.className = "shot-link";
    title.textContent = `${new Date(shot.timestamp).toLocaleString()} - ${shot.subject}`;

    if (shot.public_url) {
      title.onclick = () => showScreenshotModal(shot);
      const preview = document.createElement("img");
      preview.src = shot.public_url;
      preview.alt = shot.subject;
      preview.className = "shot-thumb";
      preview.loading = "lazy";
      preview.onclick = () => showScreenshotModal(shot);
      item.appendChild(preview);
    }

    const path = document.createElement("p");
    path.className = "muted shot-path";
    path.textContent = shot.file_path || "No file path";

    item.appendChild(title);
    item.appendChild(path);
    list.appendChild(item);
  });
}

function showScreenshotModal(shot) {
  const overlay = document.createElement("div");
  overlay.className = "shot-modal-overlay";

  const modal = document.createElement("div");
  modal.className = "shot-modal";

  const heading = document.createElement("h3");
  heading.textContent = `${shot.subject} - ${new Date(shot.timestamp).toLocaleString()}`;

  const body = document.createElement("div");
  body.className = "shot-modal-body";

  if (shot.public_url) {
    const image = document.createElement("img");
    image.src = shot.public_url;
    image.alt = shot.subject;
    image.className = "shot-modal-image";
    body.appendChild(image);
  } else {
    const pathText = document.createElement("p");
    pathText.className = "muted";
    pathText.textContent = shot.file_path || "Screenshot file unavailable";
    body.appendChild(pathText);
  }

  const footer = document.createElement("div");
  footer.className = "shot-modal-footer";

  const openNew = document.createElement("a");
  openNew.href = shot.public_url || "#";
  openNew.target = "_blank";
  openNew.rel = "noreferrer";
  openNew.textContent = "Open in new tab";
  openNew.className = "shot-link";
  if (!shot.public_url) {
    openNew.style.pointerEvents = "none";
    openNew.style.opacity = "0.6";
  }

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.textContent = "Close";
  closeBtn.onclick = () => document.body.removeChild(overlay);

  footer.appendChild(openNew);
  footer.appendChild(closeBtn);

  modal.appendChild(heading);
  modal.appendChild(body);
  modal.appendChild(footer);
  overlay.appendChild(modal);

  overlay.onclick = () => document.body.removeChild(overlay);
  modal.onclick = (event) => event.stopPropagation();

  document.body.appendChild(overlay);
}

async function refreshDebug() {
  const logs = await api("/debug/logs");
  const list = $("debugList");
  list.innerHTML = "";
  logs.slice(0, 30).forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = `${new Date(entry.timestamp).toLocaleTimeString()} | ${entry.event} | ${JSON.stringify(entry.details)}`;
    list.appendChild(item);
  });
}

async function refreshActiveSession() {
  const session = await api("/session/active");
  state.activeSession = session;

  if (!session) {
    $("sessionMode").textContent = "Idle";
    $("focusScore").textContent = "0%";
    return;
  }

  $("sessionMode").textContent = `${session.mode} (${session.subject})`;
  $("focusScore").textContent = `${session.focus_score}%`;
}

async function refreshAutoCalibrationStatus() {
  const status = await api("/calibrate/auto/status");
  const el = $("autoCalibrationStatus");
  const autoBtn = $("autoCalibrateBtn");

  if (status.setup_completed && !status.running) {
    autoBtn.disabled = true;
    const latest = status.latest_setup;
    if (latest) {
      el.textContent = `Setup calibration already completed. Threshold: ${latest.recommended_threshold} (baseline: ${latest.baseline_pressure}, writing: ${latest.writing_pressure})`;
      $("calibrationResult").textContent = `Recommended threshold: ${latest.recommended_threshold}`;
    }
    return;
  }

  autoBtn.disabled = false;

  if (!status.running && !status.result && !status.error) {
    el.textContent = "Auto calibration idle";
    return;
  }

  if (status.running) {
    el.textContent = `${status.phase.toUpperCase()} phase | ${status.phase_remaining_seconds}s left | baseline samples: ${status.baseline_sample_count} | writing samples: ${status.writing_sample_count}`;
    return;
  }

  if (status.error) {
    el.textContent = `Auto calibration failed: ${status.error}`;
    return;
  }

  if (status.result) {
    el.textContent = `Auto calibration done. Threshold: ${status.result.recommended_threshold} (baseline: ${status.result.baseline_pressure}, writing: ${status.result.writing_pressure})`;
    $("calibrationResult").textContent = `Recommended threshold: ${status.result.recommended_threshold}`;
  }
}

function showMessage(message) {
  $("sessionMessage").textContent = message;
}

function setupActions() {
  $("addSubjectBtn").onclick = async () => {
    try {
      const name = $("subjectInput").value.trim();
      if (!name) return;
      await api("/subjects", { method: "POST", body: JSON.stringify({ name }) });
      $("subjectInput").value = "";
      await refreshSubjects();
      showMessage(`Subject '${name}' added`);
    } catch (error) {
      showMessage(error.message);
    }
  };

  $("startBtn").onclick = async () => {
    try {
      const subject = $("subjectSelect").value || "General";
      await api("/session/start", { method: "POST", body: JSON.stringify({ subject }) });
      showMessage(`Session started for ${subject}`);
      await refreshActiveSession();
    } catch (error) {
      showMessage(error.message);
    }
  };

  $("stopBtn").onclick = async () => {
    try {
      const session = await api("/session/stop", { method: "POST" });
      showMessage(`Stopped. Focus score: ${session.focus_score}%`);
      await refreshActiveSession();
      await refreshSessions();
    } catch (error) {
      showMessage(error.message);
    }
  };

  $("simulatePauseBtn").onclick = () => api("/device/signal", { method: "POST", body: JSON.stringify({ signal: "PAUSE" }) });
  $("simulatePlayBtn").onclick = () => api("/device/signal", { method: "POST", body: JSON.stringify({ signal: "PLAY" }) });

  $("captureBtn").onclick = async () => {
    try {
      const subject = state.activeSession?.subject || $("subjectSelect").value || "General";
      const session_id = state.activeSession?.id || null;
      await api("/screenshot", { method: "POST", body: JSON.stringify({ subject, session_id }) });
      showMessage("Screenshot captured");
      await refreshScreenshots();
    } catch (error) {
      showMessage(error.message);
    }
  };

  $("autoCalibrateBtn").onclick = async () => {
    try {
      await api("/calibrate/auto/start", {
        method: "POST",
        body: JSON.stringify({ baseline_seconds: 10, writing_seconds: 10 }),
      });
      $("autoCalibrationStatus").textContent = "Auto calibration started: keep pen still for 10s";
    } catch (error) {
      $("autoCalibrationStatus").textContent = error.message;
    }
  };
}

function setupWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${protocol}://${window.location.host}/ws/events`);

  ws.onmessage = async (event) => {
    const { event: eventName } = JSON.parse(event.data);
    showMessage(`Event: ${eventName}`);
    await Promise.all([
      refreshDeviceStatus(),
      refreshEspStatus(),
      refreshActiveSession(),
      refreshSessions(),
      refreshScreenshots(),
      refreshDebug(),
      refreshAutoCalibrationStatus(),
    ]);
  };

  ws.onopen = () => {
    setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send("ping");
      }
    }, 5000);
  };
}

async function init() {
  setupActions();
  await Promise.all([
    refreshDeviceStatus(),
    refreshEspStatus(),
    refreshSubjects(),
    refreshSessions(),
    refreshScreenshots(),
    refreshDebug(),
    refreshActiveSession(),
    refreshAutoCalibrationStatus(),
  ]);
  setupWebSocket();
  setInterval(refreshActiveSession, 2000);
  setInterval(refreshDeviceStatus, 3000);
  setInterval(refreshEspStatus, 3000);
  setInterval(refreshAutoCalibrationStatus, 1000);
}

init().catch((error) => {
  showMessage(error.message);
});
