export default function CalibrationPage({ data, onAutoCalibrate }) {
  return (
    <section className="glass rounded-2xl p-5 shadow-soft">
      <h2 className="mb-4 text-lg font-semibold text-white">Calibration Setup</h2>

      <div className="space-y-3">
        {data.calibration.steps.map((step, index) => (
          <div
            key={step.id}
            className={`rounded-xl border p-3 transition ${
              step.status === "active"
                ? "border-accent-500/60 bg-accent-600/10"
                : step.status === "complete"
                ? "border-emerald-500/30 bg-emerald-400/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-slate-400">Step {index + 1}</p>
            <p className="font-medium text-slate-100">{step.label}</p>
            <p className="text-sm text-slate-400">{step.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Baseline</p>
          <p className="text-xl font-semibold text-white">{data.calibration.baseline}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Writing</p>
          <p className="text-xl font-semibold text-white">{data.calibration.writing}</p>
        </div>
        <div className="rounded-xl bg-accent-600/20 p-3">
          <p className="text-xs uppercase tracking-wide text-accent-300">Suggested Threshold</p>
          <p className="text-xl font-semibold text-accent-400">{data.calibration.threshold}</p>
        </div>
      </div>

      <button onClick={onAutoCalibrate} className="mt-5 rounded-xl bg-accent-600 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-accent-500">
        Run Auto Calibration
      </button>
    </section>
  );
}
