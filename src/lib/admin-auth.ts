import { activeStaffHash } from "./browser-register";
import { ADMIN_EMAIL } from "./school-links";

export { ADMIN_EMAIL };

const PASSWORD_HASH = "e0bc60c82713f64ef8a57c0c40d02ce24fd0141d5cc3086259c19b1e62a62bea";
const SESSION_KEY = "whitehall-admin-session";
const ACTOR_KEY = "whitehall-office-actor";
const SESSION_MARK = "73c9728866bac2fabac17167db4bd1beed53efdee585922dc2acce363f70cf30";

export type OfficeActor = {
  name: string;
  email: string;
};

export function readSession() {
  try {
    return localStorage.getItem(SESSION_KEY) === SESSION_MARK;
  } catch {
    return false;
  }
}

export function writeSession(actor: OfficeActor) {
  localStorage.setItem(SESSION_KEY, SESSION_MARK);
  localStorage.setItem(ACTOR_KEY, JSON.stringify({ name: actor.name, email: actor.email }));
}

export function readActor(): OfficeActor {
  try {
    const raw = localStorage.getItem(ACTOR_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<OfficeActor>;
      if (parsed.name) return { name: String(parsed.name), email: String(parsed.email || "") };
    }
  } catch {
    /* keep the office name */
  }
  return { name: "Admin", email: ADMIN_EMAIL };
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(ACTOR_KEY);
  } catch {
    /* private mode */
  }
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function passwordMatches(password: string) {
  return (await sha256(password)) === PASSWORD_HASH;
}

export async function credentialsMatch(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) return false;
  const hash = await sha256(password);
  if (normalized === ADMIN_EMAIL) return hash === PASSWORD_HASH;
  const staffHash = activeStaffHash(normalized);
  return Boolean(staffHash) && staffHash === hash;
}
