import FocusRing from "./FocusRing";
import ProgressBar from "./ProgressBar";

export default function AnalyticsPanel({ analytics }) {
  const writingPct = analytics.totalTimeSeconds
    ? (analytics.writingTimeSeconds / analytics.totalTimeSeconds) * 100
    : 0;
  const watchingPct = analytics.totalTimeSeconds
    ? (analytics.watchingTimeSeconds / analytics.totalTimeSeconds) * 100
    : 0;

  return (
    <section className="glass rounded-2xl p-5 shadow-soft transition hover:border-accent-500/40">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Session Analytics</h3>
        <FocusRing score={analytics.focusScore} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total Session</p>
          <p className="mt-1 text-xl font-semibold text-white">{analytics.totalLabel}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Writing Time</p>
          <p className="mt-1 text-xl font-semibold text-white">{analytics.writingLabel}</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <ProgressBar label="Writing Ratio" value={writingPct} tone="green" />
        <ProgressBar label="Watching Ratio" value={watchingPct} tone="amber" />
      </div>
    </section>
  );
}
