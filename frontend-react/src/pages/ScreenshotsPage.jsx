import { useState } from "react";

export default function ScreenshotsPage({ data }) {
  const [selected, setSelected] = useState(null);

  return (
    <section className="glass rounded-2xl p-5 shadow-soft">
      <h2 className="mb-4 text-lg font-semibold text-white">Screenshot Viewer</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.screenshots.map((shot) => (
          <button
            key={shot.id}
            onClick={() => setSelected(shot)}
            className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left transition hover:-translate-y-0.5 hover:border-accent-500/50"
          >
            {shot.thumbnail ? (
              <img src={shot.thumbnail} alt={shot.subject} className="h-36 w-full object-cover transition duration-300 group-hover:scale-105" />
            ) : (
              <div className="h-36 w-full bg-gradient-to-br from-surface-900 via-surface-800 to-surface-700 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Local File</p>
                <p className="mt-2 line-clamp-4 text-xs text-slate-300">{shot.filePath}</p>
              </div>
            )}
            <div className="p-3">
              <p className="text-sm font-medium text-slate-100">{shot.subject}</p>
              <p className="text-xs text-slate-400">{shot.timestamp}</p>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-surface-900" onClick={(event) => event.stopPropagation()}>
            {selected.thumbnail ? (
              <img src={selected.thumbnail} alt={selected.subject} className="max-h-[70vh] w-full object-cover" />
            ) : (
              <div className="p-5">
                <p className="mb-3 text-sm uppercase tracking-wide text-slate-400">Screenshot File</p>
                <p className="rounded-xl border border-white/10 bg-white/5 p-3 font-mono text-xs text-slate-300">{selected.filePath}</p>
              </div>
            )}
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-white">{selected.subject}</p>
                <p className="text-sm text-slate-400">{selected.timestamp}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg border border-white/10 px-3 py-1 text-sm text-slate-200">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
