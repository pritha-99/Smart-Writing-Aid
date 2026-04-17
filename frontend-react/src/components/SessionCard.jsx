import Timer from "./Timer";
import StatusIndicator from "./StatusIndicator";

export default function SessionCard({ sessionState, timerSeconds, subject }) {
  return (
    <section className="glass rounded-2xl p-5 shadow-soft transition hover:border-accent-500/40">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Session Status</h3>
        <StatusIndicator state={sessionState} />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-slate-400">Current Subject</p>
        <p className="text-lg font-medium text-slate-100">{subject}</p>
        <p className="text-sm text-slate-400">Session Timer</p>
        <Timer seconds={timerSeconds} />
      </div>
    </section>
  );
}
