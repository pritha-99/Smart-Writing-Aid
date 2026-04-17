export default function ProgressBar({ label, value, tone = "blue" }) {
  const width = `${Math.max(0, Math.min(100, value))}%`;
  const toneClass = tone === "green" ? "bg-emerald-400" : tone === "amber" ? "bg-amber-400" : "bg-accent-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${toneClass} transition-all duration-500`} style={{ width }} />
      </div>
    </div>
  );
}
