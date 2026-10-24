import { DEFAULT_SETTINGS, STANDARD_CLASSES, gradeFor, num, uid } from "./format";
import { ADMISSION_SHEET_URL } from "./school-links";
import type { ListResource, Row, SaveBody, SchoolPayload, SchoolSettings } from "./types";

const STORAGE_KEY = "whitehall-register-v1";

export const SPREADSHEET_URL = ADMISSION_SHEET_URL;

type Database = {
  students: Row[];
  staff: Row[];
  classes: Row[];
  attendance: Row[];
  fees: Row[];
  exams: Row[];
  results: Row[];
  settings: SchoolSettings;
};

const LIST_RESOURCES: ListResource[] = [
  "students",
  "staff",
  "classes",
  "attendance",
  "fees",
  "exams",
  "results",
];

const MONEY = new Set(["monthlyFee", "salary", "amount", "paidAmount", "obtained", "totalMarks"]);

function blankDatabase(): Database {
  return {
    students: [],
    staff: [],
    classes: STANDARD_CLASSES.map((className) => ({
      id: uid(),
      className,
      section: "A",
      classTeacher: "",
      monthlyFee: "",
      room: "",
    })),
    attendance: [],
    fees: [],
    exams: [],
    results: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

function clip(value: unknown, limit: number) {
  return String(value ?? "").trim().slice(0, limit);
}

function moneyField(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const parsed = Number(raw.replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(parsed)) return "";
  return String(Math.max(0, Math.round(parsed)));
}

function sanitize(resource: ListResource, row: Row): Row {
  const clean: Row = {};
  const keys = Object.keys(row);
  for (const key of keys) clean[key] = clip(row[key], key === "notes" || key === "address" ? 400 : 140);
  for (const key of Object.keys(clean)) {
    if (MONEY.has(key)) clean[key] = moneyField(row[key]);
  }
  if ((resource === "students" || resource === "staff") && !clean.status) clean.status = "Active";
  if ((resource === "students" || resource === "classes") && !clean.section) clean.section = "A";
  if (resource === "attendance" && !["Present", "Absent", "Leave"].includes(clean.status)) clean.status = "Present";
  if (resource === "exams" && !clean.totalMarks) clean.totalMarks = "100";
  if (resource === "fees") {
    const amount = num(clean.amount);
    const paid = num(clean.paidAmount);
    if (amount <= 0) clean.status = paid > 0 ? "Paid" : "Unpaid";
    else clean.status = paid <= 0 ? "Unpaid" : paid < amount ? "Partial" : "Paid";
  }
  if (resource === "results") clean.grade = gradeFor(clean.obtained, clean.totalMarks);
  return clean;
}

function settingsFrom(value: unknown): SchoolSettings {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const settings = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof SchoolSettings)[]) {
    const next = source[key];
    if (typeof next === "string") settings[key] = next.trim();
  }
  if (!settings.schoolName) settings.schoolName = DEFAULT_SETTINGS.schoolName;
  if (!settings.campus) settings.campus = DEFAULT_SETTINGS.campus;
  if (!settings.province) settings.province = DEFAULT_SETTINGS.province;
  if (!settings.country) settings.country = DEFAULT_SETTINGS.country;
  if (!settings.address) settings.address = DEFAULT_SETTINGS.address;
  if (!settings.currency) settings.currency = DEFAULT_SETTINGS.currency;
  if (!settings.academicYear) settings.academicYear = DEFAULT_SETTINGS.academicYear;
  return settings;
}

function toPayload(db: Database): SchoolPayload {
  return {
    mode: "local",
    connected: false,
    spreadsheetUrl: SPREADSHEET_URL,
    serviceAccountEmail: "",
    error: null,
    settings: db.settings,
    students: db.students as SchoolPayload["students"],
    staff: db.staff as SchoolPayload["staff"],
    classes: db.classes as SchoolPayload["classes"],
    attendance: db.attendance as SchoolPayload["attendance"],
    fees: db.fees as SchoolPayload["fees"],
    exams: db.exams as SchoolPayload["exams"],
    results: db.results as SchoolPayload["results"],
  };
}

function readDatabase(): Database {
  if (typeof window === "undefined") return blankDatabase();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = blankDatabase();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<Database>;
    const db = blankDatabase();
    for (const resource of LIST_RESOURCES) {
      const rows = parsed[resource];
      db[resource] = Array.isArray(rows) ? rows.map((row) => sanitize(resource, row)) : [];
    }
    db.classes = Array.isArray(parsed.classes) && parsed.classes.length ? db.classes : blankDatabase().classes;
    if (Array.isArray(parsed.classes) && parsed.classes.length === 0) db.classes = [];
    db.settings = settingsFrom(parsed.settings);
    return db;
  } catch {
    return blankDatabase();
  }
}

function writeDatabase(db: Database) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function apply(db: Database, body: SaveBody) {
  if (body.resource === "settings") {
    db.settings = settingsFrom({ ...db.settings, ...body.settings });
    return;
  }
  if (!LIST_RESOURCES.includes(body.resource)) throw new Error("Unknown part of the register.");
  const resource = body.resource;

  if (body.action === "delete") {
    const ids = new Set(body.ids || []);
    db[resource] = db[resource].filter((row) => !ids.has(row.id));
    if (resource === "exams") db.results = db.results.filter((row) => !ids.has(row.examId));
    return;
  }

  const incoming = (body.records || []).map((row) => sanitize(resource, { ...row }));
  for (const record of incoming) {
    if (resource === "students") {
      if (!record.name) throw new Error("Student name is required.");
      if (!record.fatherName) throw new Error("Father name is required.");
      if (!record.className) throw new Error("Class is required.");
    }
    if (resource === "staff" && !record.name) throw new Error("Staff name is required.");
    if (resource === "classes" && !record.className) throw new Error("Class name is required.");
    if (resource === "exams") {
      if (!record.name) throw new Error("Exam name is required.");
      if (!record.className) throw new Error("Choose a class for the exam.");
      if (!record.subject) throw new Error("Subject is required.");
    }
  }

  const next = db[resource].slice();
  const index = new Map(next.map((row, position) => [row.id, position]));
  for (const record of incoming) {
    if (!record.id) record.id = uid();
    const at = index.get(record.id);
    if (at == null) {
      index.set(record.id, next.length);
      next.push(record);
    } else next[at] = { ...next[at], ...record };
  }

  if (resource === "classes") {
    const seen = new Set<string>();
    for (const row of next) {
      const key = `${row.className.toLowerCase()}|${row.section.toLowerCase()}`;
      if (seen.has(key)) throw new Error(`${row.className}-${row.section} is already in the register.`);
      seen.add(key);
    }
  }

  db[resource] = next;
  if (resource === "students") {
    const byId = new Map(next.map((row) => [row.id, row]));
    for (const related of ["attendance", "fees", "results"] as const) {
      for (const row of db[related]) {
        const student = byId.get(row.studentId);
        if (!student) continue;
        row.studentName = student.name;
        row.admissionNo = student.admissionNo;
      }
    }
  }
}

export function loadRegister() {
  return toPayload(readDatabase());
}

export function changeRegister(body: SaveBody) {
  const db = readDatabase();
  apply(db, body);
  writeDatabase(db);
  return toPayload(db);
}

export function backupRegister() {
  return JSON.stringify(readDatabase(), null, 2);
}

export function restoreRegister(raw: string) {
  const parsed = JSON.parse(raw) as Partial<Database>;
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.students)) {
    throw new Error("This file is not a Whitehall register backup.");
  }
  const db = blankDatabase();
  for (const resource of LIST_RESOURCES) {
    const rows = parsed[resource];
    db[resource] = Array.isArray(rows) ? rows.map((row) => sanitize(resource, row)) : [];
  }
  db.settings = settingsFrom(parsed.settings);
  writeDatabase(db);
  return toPayload(db);
}
