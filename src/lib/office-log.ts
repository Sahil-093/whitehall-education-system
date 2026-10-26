import { readActor } from "./admin-auth";
import { uid } from "./format";

export type LogEntry = {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
};

const STORAGE_KEY = "whitehall-office-log-v1";
const MAX_ENTRIES = 400;

export function formatWhen(iso: string, withTime = false) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function loadLog(): LogEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Partial<LogEntry>;
      if (!row.id || !row.at || !row.actor || !row.action) return [];
      return [{ id: String(row.id), at: String(row.at), actor: String(row.actor), action: String(row.action), detail: String(row.detail || "") }];
    });
  } catch {
    return [];
  }
}

export function recordLog(action: string, detail: string) {
  const next: LogEntry = {
    id: uid(),
    at: new Date().toISOString(),
    actor: readActor().name,
    action,
    detail,
  };
  const entries = [next, ...loadLog()].slice(0, MAX_ENTRIES);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return next;
}
