const configuredBase = (import.meta.env.VITE_API_BASE_URL || "").trim();
const inferredBase =
  typeof window !== "undefined" && window.location.port === "5173"
    ? "http://localhost:8000"
    : typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:8000";

const API_BASE = (configuredBase || inferredBase).replace(/\/$/, "");

function buildUrl(path) {
  return `${API_BASE}${path}`;
}

export async function api(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || `Request failed: ${response.status}`);
  }

  return response.json();
}

export function wsUrl(path = "/ws/events") {
  const u = new URL(API_BASE);
  u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
  u.pathname = path;
  u.search = "";
  u.hash = "";
  return u.toString();
}
