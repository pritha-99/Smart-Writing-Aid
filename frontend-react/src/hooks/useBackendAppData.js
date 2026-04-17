import { useCallback, useEffect, useState } from "react";
import { api, wsUrl } from "../services/api";
import { useLiveTimer } from "./useLiveTimer";

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

function mapHistory(sessions) {
  return (sessions || []).map((s) => ({
    id: s.id,
    date: new Date(s.start_time).toLocaleString(),
    subject: s.subject,
    duration: formatDuration(s.total_time || s.writing_time + s.watching_time),
    focusScore: s.focus_score,
  }));
}

function mapScreenshots(items) {
  return (items || []).map((shot, index) => ({
    id: shot.id || `${shot.timestamp}-${index}`,
    subject: shot.subject,
    timestamp: new Date(shot.timestamp).toLocaleString(),
    thumbnail: null,
    filePath: shot.file_path,
  }));
}

function mapDebug(logs) {
  return (logs || []).slice(0, 30).map((entry, index) => ({
    id: `${entry.timestamp}-${index}`,
    signal: entry.event,
    timestamp: new Date(entry.timestamp).toLocaleTimeString(),
  }));
}

export function useBackendAppData() {
  const [data, setData] = useState({
    penStatus: "connecting",
    sessionState: "idle",
    currentSubject: "General",
    activeSessionId: null,
    liveTimerSeconds: 0,
    subjects: ["General"],
    analytics: {
      totalTimeSeconds: 0,
      writingTimeSeconds: 0,
      watchingTimeSeconds: 0,
      focusScore: 0,
      totalLabel: "0m 00s",
      writingLabel: "0m 00s",
    },
    history: [],
    screenshots: [],
    resources: [],
    calibration: {
      baseline: "-",
      writing: "-",
      threshold: "-",
      steps: [
        { id: "c1", label: "Hold pen normally", hint: "Keep pen still for baseline sampling.", status: "pending" },
        { id: "c2", label: "Write naturally", hint: "Write a few lines during writing phase.", status: "pending" },
        { id: "c3", label: "Review detected values", hint: "Threshold appears after completion.", status: "pending" },
      ],
    },
    rawSensorValues: [],
    debugLogs: [],
  });

  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    const [device, active, sessions, subjects, screenshots, logs, calStatus] = await Promise.all([
      api("/device/status"),
      api("/session/active"),
      api("/sessions"),
      api("/subjects"),
      api("/screenshots"),
      api("/debug/logs"),
      api("/calibrate/auto/status"),
    ]);

    const writing = Number(active?.writing_time || 0);
    const watching = Number(active?.watching_time || 0);
    const total = writing + watching;
    const latestCal = calStatus?.latest_setup || calStatus?.latest || calStatus?.result || null;

    setData((prev) => ({
      ...prev,
      penStatus: device.connected ? "connected" : "disconnected",
      sessionState: active?.mode || "idle",
      currentSubject: active?.subject || "General",
      activeSessionId: active?.id || null,
      liveTimerSeconds: total,
      subjects: (subjects || []).map((item) => item.name),
      analytics: {
        totalTimeSeconds: total,
        writingTimeSeconds: writing,
        watchingTimeSeconds: watching,
        focusScore: Number(active?.focus_score || 0),
        totalLabel: formatDuration(total),
        writingLabel: formatDuration(writing),
      },
      history: mapHistory(sessions),
      screenshots: mapScreenshots(screenshots),
      calibration: {
        baseline: latestCal?.baseline_pressure ?? "-",
        writing: latestCal?.writing_pressure ?? "-",
        threshold: latestCal?.recommended_threshold ?? "-",
        steps: prev.calibration.steps,
      },
      rawSensorValues: (logs || [])
        .map((entry) => entry?.details?.pressure)
        .filter((v) => typeof v === "number")
        .slice(0, 10),
      debugLogs: mapDebug(logs),
    }));
  }, []);

  const runAction = useCallback(
    async (runner, successMessage) => {
      try {
        const result = await runner();
        if (successMessage) setMessage(successMessage);
        await refresh();
        return result;
      } catch (error) {
        setMessage(error?.message || "Operation failed");
        return null;
      }
    },
    [refresh],
  );

  useEffect(() => {
    let pingId = null;
    refresh().catch((error) => setMessage(error.message));

    const intervalId = window.setInterval(() => {
      refresh().catch(() => {});
    }, 3000);

    const ws = new WebSocket(wsUrl("/ws/events"));
    ws.onmessage = () => refresh().catch(() => {});
    ws.onopen = () => {
      pingId = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send("ping");
      }, 5000);
    };

    return () => {
      window.clearInterval(intervalId);
      if (pingId) window.clearInterval(pingId);
      ws.close();
    };
  }, [refresh]);

  const startSession = useCallback(
    async (subject) => {
      const target = subject || data.currentSubject || "General";
      await runAction(
        () => api("/session/start", { method: "POST", body: JSON.stringify({ subject: target }) }),
        `Session started for ${target}`,
      );
    },
    [data.currentSubject, runAction],
  );

  const startAutoCalibration = useCallback(async () => {
    await runAction(
      () =>
        api("/calibrate/auto/start", {
          method: "POST",
          body: JSON.stringify({ baseline_seconds: 10, writing_seconds: 10 }),
        }),
      "Auto calibration started",
    );
  }, [runAction]);

  const stopSession = useCallback(async () => {
    const stopped = await runAction(() => api("/session/stop", { method: "POST" }));
    if (stopped) {
      setMessage(`Session stopped. Focus score: ${stopped.focus_score}%`);
    }
  }, [runAction]);

  const addSubject = useCallback(
    async (name) => {
      const clean = (name || "").trim();
      if (!clean) return;
      await runAction(
        () => api("/subjects", { method: "POST", body: JSON.stringify({ name: clean }) }),
        `Subject '${clean}' added`,
      );
    },
    [runAction],
  );

  const sendSignal = useCallback(
    async (signal) => {
      await runAction(
        () => api("/device/signal", { method: "POST", body: JSON.stringify({ signal }) }),
        `Signal sent: ${signal}`,
      );
    },
    [runAction],
  );

  const captureScreenshot = useCallback(
    async (subject, sessionId) => {
      await runAction(
        () =>
          api("/screenshot", {
            method: "POST",
            body: JSON.stringify({ subject: subject || "General", session_id: sessionId || null }),
          }),
        "Screenshot captured",
      );
    },
    [runAction],
  );

  const liveTimerSeconds = useLiveTimer(data.liveTimerSeconds, data.sessionState !== "idle");

  return {
    ...data,
    liveTimerSeconds,
    analytics: {
      ...data.analytics,
      totalTimeSeconds: liveTimerSeconds,
      totalLabel: formatDuration(liveTimerSeconds),
    },
    message,
    actions: {
      addSubject,
      stopSession,
      sendSignal,
      captureScreenshot,
      startSession,
      startAutoCalibration,
      refresh,
    },
  };
}
