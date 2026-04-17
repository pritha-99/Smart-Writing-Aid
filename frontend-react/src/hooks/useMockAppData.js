import { useEffect, useState } from "react";
import { fetchMockData } from "../services/mockApi";
import { useLiveTimer } from "./useLiveTimer";

export function useMockAppData() {
  const [data, setData] = useState({
    penStatus: "connecting",
    sessionState: "idle",
    currentSubject: "General",
    liveTimerSeconds: 0,
    subjects: [],
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
    calibration: { baseline: "-", writing: "-", threshold: "-", steps: [] },
    rawSensorValues: [],
    debugLogs: [],
  });

  useEffect(() => {
    let mounted = true;
    fetchMockData().then((payload) => {
      if (mounted) {
        setData(payload);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const liveTimerSeconds = useLiveTimer(data.liveTimerSeconds, data.sessionState !== "idle");

  return {
    ...data,
    liveTimerSeconds,
    analytics: {
      ...data.analytics,
      totalTimeSeconds: liveTimerSeconds,
    },
  };
}
