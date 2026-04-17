import { useMemo } from "react";

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const hrs = String(Math.floor(total / 3600)).padStart(2, "0");
  const mins = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const secs = String(total % 60).padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
}

export default function Timer({ seconds }) {
  const timeLabel = useMemo(() => formatDuration(seconds), [seconds]);
  return <span className="font-mono text-2xl font-semibold tracking-wide text-white">{timeLabel}</span>;
}
