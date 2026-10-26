import { ADMIN_EMAIL } from "./school-links";
import type { Staff } from "./types";

export const ACCESS_AREAS = [
  { id: "overview", label: "Overview", href: "/" },
  { id: "admission", label: "Admission", href: "/admission" },
  { id: "students", label: "Students", href: "/students" },
  { id: "classes", label: "Classes", href: "/classes" },
  { id: "results", label: "Results", href: "/results" },
  { id: "log", label: "Log", href: "/log" },
  { id: "drive", label: "Drive", href: "" },
] as const;

export type AccessId = (typeof ACCESS_AREAS)[number]["id"];

const ALL_IDS = ACCESS_AREAS.map((area) => area.id);

const ROLE_LISTS: Record<string, AccessId[]> = {
  Principal: [...ALL_IDS],
  "Vice Principal": [...ALL_IDS],
  Teacher: ["overview", "students", "classes", "results", "drive"],
  Clerk: ["overview", "admission", "students", "classes", "drive"],
  Accountant: ["overview", "students", "classes", "drive"],
  Peon: ["overview"],
};

export function isOfficeAdmin(email: string) {
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export function accessForRole(designation: string): AccessId[] {
  return ROLE_LISTS[designation] ? [...ROLE_LISTS[designation]] : ["overview", "students", "classes", "results"];
}

/** Blank means the checklist has not been saved yet. "none" means every box was cleared. */
export function parseAccess(value: string | undefined | null): AccessId[] | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (raw === "none") return [];
  const known = new Set<string>(ALL_IDS);
  const picked: AccessId[] = [];
  for (const part of raw.split(",")) {
    const id = part.trim();
    if (known.has(id) && !picked.includes(id as AccessId)) picked.push(id as AccessId);
  }
  return picked;
}

export function formatAccess(ids: AccessId[]) {
  const picked = new Set(ids);
  const list = ALL_IDS.filter((id) => picked.has(id));
  return list.length ? list.join(",") : "none";
}

export function accessLabels(ids: AccessId[]) {
  const picked = new Set(ids);
  return ACCESS_AREAS.filter((area) => picked.has(area.id)).map((area) => area.label);
}

export function areasForStaff(email: string, staff: Staff[]): AccessId[] | "all" {
  if (isOfficeAdmin(email) || !email) return "all";
  const person = staff.find((row) => row.email.toLowerCase() === email.trim().toLowerCase());
  if (!person || person.status === "Left") return [];
  const saved = parseAccess(person.access);
  if (!saved) return [...ALL_IDS];
  return saved;
}

export function pathAllowed(pathname: string, areas: AccessId[] | "all") {
  if (areas === "all") return true;
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname || "/";
  if (path === "/staff" || path === "/settings") return false;
  const area = ACCESS_AREAS.find((item) => item.href && item.href === path);
  return Boolean(area && areas.includes(area.id));
}
