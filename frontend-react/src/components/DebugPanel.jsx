export default function DebugPanel({ open, logs, rawValues, connectionSource }) {
  return (
    <aside
      className={`glass fixed right-3 top-3 z-30 w-[330px] max-w-[90vw] rounded-2xl p-4 shadow-soft transition-all duration-300 ${
        open ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-[110%] opacity-0"
      }`}
    >
      <h3 className="mb-2 text-sm font-semibold text-white">Debug Panel</h3>
      <div className="mb-3 rounded-xl bg-black/20 p-2">
        <p className="text-xs text-slate-400">Raw Sensor Values</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {rawValues.map((value, idx) => (
            <span key={`${value}-${idx}`} className="rounded bg-surface-900 px-2 py-0.5 font-mono text-xs text-accent-400">
              {value}
            </span>
          ))}
        </div>
      </div>
      <div className="max-h-80 space-y-2 overflow-auto pr-1">
        {logs.map((entry) => (
          <div key={entry.id} className="rounded-lg bg-white/5 p-2 text-xs">
            <p className="font-medium text-slate-200">{entry.signal}</p>
            {connectionSource === "serial" && entry.detail ? <p className="text-slate-300">{entry.detail}</p> : null}
            <p className="text-slate-400">{entry.timestamp}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
