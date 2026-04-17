export default function FocusRing({ score }) {
  const safeScore = Math.max(0, Math.min(100, score));
  const angle = (safeScore / 100) * 360;

  return (
    <div className="relative grid h-32 w-32 place-items-center rounded-full" style={{ background: `conic-gradient(#318bff ${angle}deg, rgba(255,255,255,0.08) ${angle}deg)` }}>
      <div className="grid h-24 w-24 place-items-center rounded-full bg-surface-900 text-center shadow-inner">
        <p className="text-2xl font-bold text-accent-400">{Math.round(safeScore)}%</p>
        <p className="text-[11px] uppercase tracking-wide text-slate-400">Focus</p>
      </div>
    </div>
  );
}
