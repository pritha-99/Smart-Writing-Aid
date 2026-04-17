import { useMemo, useState } from "react";

export default function ResourcesPage({ data }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.resources;

    return data.resources.filter((item) =>
      `${item.subject} ${item.title} ${item.link}`.toLowerCase().includes(q)
    );
  }, [data.resources, query]);

  return (
    <section className="glass rounded-2xl p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Study Resources</h2>
        <button className="rounded-lg bg-accent-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-accent-500">Add Resource</button>
      </div>

      <input
        placeholder="Search resources"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="mb-4 w-full rounded-xl border border-white/10 bg-surface-900 px-3 py-2 text-sm text-slate-100"
      />

      <div className="space-y-3">
        {filtered.map((resource) => (
          <article key={resource.id} className="rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-accent-500/40">
            <p className="text-xs uppercase tracking-wide text-slate-400">{resource.subject}</p>
            <p className="mt-1 font-medium text-slate-100">{resource.title}</p>
            <a className="mt-1 inline-block text-sm text-accent-400 hover:text-accent-300" href={resource.link}>
              {resource.link}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
