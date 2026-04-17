const STATE_STYLES = {
  writing: "bg-emerald-400",
  watching: "bg-amber-400",
  idle: "bg-slate-500",
  connected: "bg-emerald-400",
  connecting: "bg-amber-400",
  disconnected: "bg-red-400",
};

export default function StatusIndicator({ label, state, compact = false }) {
  const colorClass = STATE_STYLES[state] || "bg-slate-500";
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 ${compact ? "text-xs" : "text-sm"}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${colorClass} ${state === "connecting" ? "animate-pulseDot" : ""}`} />
      <span className="capitalize text-slate-200">{label || state}</span>
    </div>
  );
}
