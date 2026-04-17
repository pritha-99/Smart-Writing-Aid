import { useMemo, useState } from "react";

export default function HistoryPage({ data }) {
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  const filtered = useMemo(() => {
    return data.history.filter((item) => {
      const subjectOk = subjectFilter === "All" || item.subject === subjectFilter;
      const dateOk = !dateFilter || item.date.startsWith(dateFilter);
      return subjectOk && dateOk;
    });
  }, [data.history, subjectFilter, dateFilter]);

  return (
    <section className="glass rounded-2xl p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Session History</h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
            className="rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm text-slate-200"
          >
            <option>All</option>
            {data.subjects.map((subject) => (
              <option key={subject}>{subject}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm text-slate-200"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Focus Score</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id} className="border-t border-white/5 transition hover:bg-white/5">
                <td className="px-4 py-3 text-slate-200">{entry.date}</td>
                <td className="px-4 py-3 text-slate-200">{entry.subject}</td>
                <td className="px-4 py-3 text-slate-300">{entry.duration}</td>
                <td className="px-4 py-3 font-semibold text-accent-400">{entry.focusScore}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
