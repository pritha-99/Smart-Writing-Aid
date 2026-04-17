const SHOT = "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80";

export function fetchMockData() {
  return Promise.resolve({
    penStatus: "connected",
    sessionState: "writing",
    currentSubject: "Physics",
    liveTimerSeconds: 1428,
    subjects: ["Physics", "Mathematics", "Chemistry", "History"],
    analytics: {
      totalTimeSeconds: 1428,
      writingTimeSeconds: 894,
      watchingTimeSeconds: 534,
      focusScore: 62.6,
      totalLabel: "23m 48s",
      writingLabel: "14m 54s",
    },
    history: [
      { id: "h1", date: "2026-04-08", subject: "Physics", duration: "23m 48s", focusScore: 63 },
      { id: "h2", date: "2026-04-07", subject: "Mathematics", duration: "41m 19s", focusScore: 72 },
      { id: "h3", date: "2026-04-06", subject: "Chemistry", duration: "29m 09s", focusScore: 57 },
    ],
    screenshots: [
      { id: "s1", subject: "Physics", timestamp: "2026-04-08 16:05", thumbnail: SHOT },
      { id: "s2", subject: "Mathematics", timestamp: "2026-04-08 15:31", thumbnail: SHOT },
      { id: "s3", subject: "Chemistry", timestamp: "2026-04-07 11:12", thumbnail: SHOT },
    ],
    resources: [
      { id: "r1", subject: "Physics", title: "Projectile Motion Notes", link: "https://example.com/projectile" },
      { id: "r2", subject: "Mathematics", title: "Linear Algebra Cheatsheet", link: "https://example.com/linear" },
      { id: "r3", subject: "Chemistry", title: "Organic Reactions Grid", link: "https://example.com/organic" },
    ],
    calibration: {
      baseline: 98,
      writing: 341,
      threshold: 220,
      steps: [
        { id: "c1", label: "Hold pen normally", hint: "Relax your hand for 10 seconds.", status: "complete" },
        { id: "c2", label: "Write naturally", hint: "Write 2 to 3 short lines.", status: "active" },
        { id: "c3", label: "Review detected values", hint: "Confirm threshold and continue.", status: "pending" },
      ],
    },
    rawSensorValues: [331, 324, 338, 347, 329],
    debugLogs: [
      { id: "d1", signal: "PAUSE", timestamp: "16:10:21" },
      { id: "d2", signal: "PRESSURE:347", timestamp: "16:10:20" },
      { id: "d3", signal: "PLAY", timestamp: "16:09:48" },
    ],
  });
}
