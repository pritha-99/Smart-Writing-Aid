import { useEffect, useMemo, useState } from "react";
import SessionCard from "../components/SessionCard";
import AnalyticsPanel from "../components/AnalyticsPanel";

export default function DashboardPage({ data, actions, message }) {
  const [selectedSubject, setSelectedSubject] = useState(data.currentSubject || data.subjects[0] || "General");
  const [newSubject, setNewSubject] = useState("");

  useEffect(() => {
    setSelectedSubject(data.currentSubject || data.subjects[0] || "General");
  }, [data.currentSubject, data.subjects]);

  const statusText = useMemo(() => {
    if (data.sessionState === "writing") return "Writing detected. Video paused.";
    if (data.sessionState === "watching") return "Watching mode active.";
    return "Session idle. Start learning when ready.";
  }, [data.sessionState]);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <section className="glass rounded-2xl p-5 shadow-soft lg:col-span-3">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Home Dashboard</h2>
            <p className="text-sm text-slate-400">Low-distraction control center for live study sessions.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => actions.startSession(selectedSubject)}
              className="rounded-xl bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-accent-500"
            >
              Start Learning
            </button>
            <button
              onClick={() => actions.stopSession()}
              className="rounded-xl border border-red-500/40 bg-red-500/20 px-5 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/30"
            >
              Stop Session
            </button>
          </div>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            Subject
            <select
              value={selectedSubject}
              onChange={(event) => setSelectedSubject(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface-900 px-3 py-2 text-slate-100 outline-none transition focus:border-accent-500/60"
            >
              {data.subjects.map((subject) => (
                <option key={subject}>{subject}</option>
              ))}
            </select>
          </label>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-slate-400">Current State</p>
            <p className="mt-1 text-base font-semibold text-white">{statusText}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <input
            value={newSubject}
            onChange={(event) => setNewSubject(event.target.value)}
            placeholder="New subject"
            className="rounded-xl border border-white/10 bg-surface-900 px-3 py-2 text-sm text-slate-100"
          />
          <button
            onClick={async () => {
              await actions.addSubject(newSubject);
              if (newSubject.trim()) {
                setSelectedSubject(newSubject.trim());
                setNewSubject("");
              }
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
          >
            Add Subject
          </button>
          <button
            onClick={() => actions.sendSignal("PAUSE")}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
          >
            Simulate PAUSE
          </button>
          <button
            onClick={() => actions.sendSignal("PLAY")}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
          >
            Simulate PLAY
          </button>
          <button
            onClick={() => actions.captureScreenshot(selectedSubject, data.activeSessionId)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
          >
            Capture Screenshot
          </button>
        </div>

        {message ? <p className="mb-4 text-sm text-accent-300">{message}</p> : null}

        <SessionCard sessionState={data.sessionState} timerSeconds={data.liveTimerSeconds} subject={data.currentSubject} />
      </section>

      <div className="lg:col-span-2">
        <AnalyticsPanel analytics={data.analytics} />
      </div>
    </div>
  );
}
