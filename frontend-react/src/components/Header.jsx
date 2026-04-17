import StatusIndicator from "./StatusIndicator";

export default function Header({ connectionStatus, debugOpen, onToggleDebug }) {
  return (
    <header className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 shadow-soft">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Smart Writing Aid</h1>
        <p className="text-sm text-slate-400">A focused writing-first learning workflow on localhost.</p>
      </div>
      <div className="flex items-center gap-3">
        <StatusIndicator label={`Pen ${connectionStatus}`} state={connectionStatus} compact />
        <button
          className={`rounded-lg border px-3 py-1.5 text-sm transition ${
            debugOpen
              ? "border-accent-500/60 bg-accent-600/20 text-accent-400"
              : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20"
          }`}
          onClick={onToggleDebug}
        >
          Debug {debugOpen ? "On" : "Off"}
        </button>
      </div>
    </header>
  );
}
