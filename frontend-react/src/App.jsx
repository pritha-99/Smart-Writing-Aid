import { useMemo, useState } from "react";
import Header from "./components/Header";
import DebugPanel from "./components/DebugPanel";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";
import ScreenshotsPage from "./pages/ScreenshotsPage";
import { useBackendAppData } from "./hooks/useBackendAppData";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "history", label: "History" },
  { key: "screenshots", label: "Screenshots" },
];

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [debugOpen, setDebugOpen] = useState(false);
  const appData = useBackendAppData();

  const pageNode = useMemo(() => {
    if (activePage === "history") return <HistoryPage data={appData} />;
    if (activePage === "screenshots") return <ScreenshotsPage data={appData} />;
    return <DashboardPage data={appData} actions={appData.actions} message={appData.message} />;
  }, [activePage, appData]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1400px] gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <aside className="glass hidden w-64 shrink-0 rounded-2xl p-4 shadow-soft md:block">
        <div className="mb-6 text-lg font-semibold text-white">Smart Writing Aid</div>
        <nav className="space-y-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setActivePage(item.key)}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-all ${
                activePage === item.key
                  ? "bg-accent-600/25 text-accent-400 shadow-glow"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-4">
        <Header
          connectionStatus={appData.penStatus}
          debugOpen={debugOpen}
          onToggleDebug={() => setDebugOpen((value) => !value)}
        />

        <nav className="glass flex gap-2 overflow-auto rounded-xl p-2 md:hidden">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setActivePage(item.key)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition ${
                activePage === item.key
                  ? "bg-accent-600/25 text-accent-300"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="animate-floatUp">{pageNode}</div>
      </main>

      <DebugPanel
        open={debugOpen}
        logs={appData.debugLogs}
        rawValues={appData.rawSensorValues}
        connectionSource={appData.connectionSource}
      />
    </div>
  );
}
