import { adoptOfficeLists, loadRegister } from "./browser-register";
import type { ResultCorrection } from "./exam-sheet";
import { loadLog, replaceLog, type LogEntry } from "./office-log";
import { fetchOffice, postOffice } from "./office-post";
import { loadBin, recycleRow, replaceBin, type BinItem, type BinKind } from "./recycle-bin";
import { loadResultEdits, replaceResultEdits } from "./result-edits";
import type { Row, SaveBody, SchoolSettings } from "./types";

function cell(row: Record<string, string>, key: string) {
  return row[key] || "";
}

function staffFrom(row: Record<string, string>): Row {
  return {
    id: cell(row, "Id") || cell(row, "Email"),
    name: cell(row, "Name"),
    designation: cell(row, "Role") || "Teacher",
    phone: cell(row, "Phone"),
    email: cell(row, "Email").toLowerCase(),
    passwordHash: "",
    subject: cell(row, "Subject"),
    qualification: cell(row, "Qualification"),
    salary: cell(row, "Monthly salary (Rs)"),
    joiningDate: cell(row, "Joined"),
    status: cell(row, "Status") || "Active",
    access: cell(row, "Can open"),
  };
}

function staffTo(row: Row) {
  return {
    Id: row.id || "",
    Name: row.name || "",
    Role: row.designation || "",
    Subject: row.subject || "",
    Qualification: row.qualification || "",
    Phone: row.phone || "",
    Email: row.email || "",
    "Monthly salary (Rs)": row.salary || "",
    Joined: row.joiningDate || "",
    Status: row.status || "Active",
    "Can open": row.access || "",
  };
}

function feeFrom(row: Record<string, string>): Row {
  return {
    id: cell(row, "Id"),
    studentId: cell(row, "Student id"),
    admissionNo: cell(row, "Admission no"),
    studentName: cell(row, "Student name"),
    className: cell(row, "Class"),
    section: cell(row, "Section") || "A",
    month: cell(row, "Month"),
    year: cell(row, "Year"),
    amount: cell(row, "Amount"),
    paidAmount: cell(row, "Paid"),
    status: cell(row, "Status"),
    paidDate: cell(row, "Paid date"),
    receiptNo: cell(row, "Receipt"),
    method: cell(row, "Method"),
  };
}

function feeTo(row: Row) {
  return {
    Id: row.id || "",
    "Student id": row.studentId || "",
    "Admission no": row.admissionNo || "",
    "Student name": row.studentName || "",
    Class: row.className || "",
    Section: row.section || "",
    Month: row.month || "",
    Year: row.year || "",
    Amount: row.amount || "",
    Paid: row.paidAmount || "",
    Status: row.status || "",
    "Paid date": row.paidDate || "",
    Receipt: row.receiptNo || "",
    Method: row.method || "",
  };
}

function markFrom(row: Record<string, string>): Row {
  return {
    id: cell(row, "Id"),
    date: cell(row, "Date"),
    studentId: cell(row, "Student id"),
    admissionNo: cell(row, "Admission no"),
    studentName: cell(row, "Student name"),
    className: cell(row, "Class"),
    section: cell(row, "Section") || "A",
    status: cell(row, "Status") || "Present",
  };
}

function markTo(row: Row) {
  return {
    Id: row.id || "",
    Date: row.date || "",
    "Student id": row.studentId || "",
    "Admission no": row.admissionNo || "",
    "Student name": row.studentName || "",
    Class: row.className || "",
    Section: row.section || "",
    Status: row.status || "Present",
  };
}

function settingsFrom(row: Record<string, string>): Partial<SchoolSettings> {
  return {
    schoolName: cell(row, "School name"),
    campus: cell(row, "Campus"),
    province: cell(row, "Province"),
    country: cell(row, "Country"),
    address: cell(row, "Address"),
    phone: cell(row, "Phone"),
    currency: cell(row, "Currency"),
    academicYear: cell(row, "Academic year"),
  };
}

function settingsTo(settings: Partial<SchoolSettings>) {
  return {
    "School name": settings.schoolName || "",
    Campus: settings.campus || "",
    Province: settings.province || "",
    Country: settings.country || "",
    Address: settings.address || "",
    Phone: settings.phone || "",
    Currency: settings.currency || "",
    "Academic year": settings.academicYear || "",
  };
}

function logFrom(row: Record<string, string>): LogEntry | null {
  const id = cell(row, "Id");
  const at = cell(row, "When");
  const actor = cell(row, "By");
  const action = cell(row, "Step");
  if (!id || !at || !actor || !action) return null;
  return { id, at, actor, action, detail: cell(row, "Detail") };
}

function logTo(entry: LogEntry) {
  return { Id: entry.id, When: entry.at, By: entry.actor, Step: entry.action, Detail: entry.detail };
}

function binFrom(row: Record<string, string>): BinItem | null {
  const kind = cell(row, "Kind");
  if (kind !== "roster" && kind !== "register-student" && kind !== "staff") return null;
  const id = cell(row, "Id");
  const name = cell(row, "Name");
  const removedAt = cell(row, "Removed at");
  if (!id || !name || !removedAt) return null;
  let payload: unknown = {};
  try {
    payload = JSON.parse(cell(row, "Payload") || "{}");
  } catch {
    payload = {};
  }
  return {
    id,
    kind: kind as BinKind,
    name,
    detail: cell(row, "Detail"),
    removedAt,
    removedBy: cell(row, "Removed by") || "Admin",
    payload,
  };
}

function correctionFrom(row: Record<string, string>): { key: string; edit: ResultCorrection } | null {
  const key = cell(row, "Key");
  if (!key) return null;
  let marks: Record<string, string> = {};
  try {
    const parsed = JSON.parse(cell(row, "Marks") || "{}") as unknown;
    if (parsed && typeof parsed === "object") {
      marks = Object.fromEntries(Object.entries(parsed as Record<string, unknown>).map(([name, value]) => [name, String(value ?? "")]));
    }
  } catch {
    marks = {};
  }
  return {
    key,
    edit: {
      name: cell(row, "Name"),
      rollNo: cell(row, "Roll no"),
      fatherName: cell(row, "Father name"),
      registrationNo: cell(row, "Registration no"),
      dateOfIssue: cell(row, "Date of issue"),
      marks,
    },
  };
}

function correctionTo(key: string, edit: ResultCorrection) {
  return {
    Key: key,
    Name: edit.name,
    "Roll no": edit.rollNo,
    "Father name": edit.fatherName,
    "Registration no": edit.registrationNo,
    "Date of issue": edit.dateOfIssue,
    Marks: JSON.stringify(edit.marks || {}),
  };
}

let flight: Promise<void> | null = null;

/** Loads the section sheets once and copies them into this browser. */
export function loadOfficeBooks() {
  if (!flight) {
    flight = pull().finally(() => {
      flight = null;
    });
  }
  return flight;
}

async function pull() {
  const before = loadRegister();
  const snap = await fetchOffice();
  if (!snap) return;
  adoptOfficeLists({
    staff: snap.staff.length ? snap.staff.map(staffFrom) : undefined,
    fees: snap.fees.length ? snap.fees.map(feeFrom) : undefined,
    attendance: snap.attendance.length ? snap.attendance.map(markFrom) : undefined,
    settings: snap.settings && cell(snap.settings, "School name") ? settingsFrom(snap.settings) : null,
  });
  if (!snap.staff.length && before.staff.length) postOffice("staff", "upsert", before.staff.map(staffTo));
  if (!snap.fees.length && before.fees.length) postOffice("fees", "upsert", before.fees.map(feeTo));
  if (!snap.attendance.length && before.attendance.length) postOffice("attendance", "upsert", before.attendance.map(markTo));
  if (!(snap.settings && cell(snap.settings, "School name"))) postOffice("settings", "replace", [settingsTo(before.settings)]);

  const remoteLog = snap.log.flatMap((row) => {
    const entry = logFrom(row);
    return entry ? [entry] : [];
  });
  const seen = new Set(remoteLog.map((entry) => entry.id));
  const missingLog = loadLog().filter((entry) => !seen.has(entry.id));
  const mergedLog = [...remoteLog, ...missingLog].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 400);
  replaceLog(mergedLog);
  if (missingLog.length) postOffice("log", "upsert", missingLog.map(logTo));

  const remoteBin = snap.recycle.flatMap((row) => {
    const item = binFrom(row);
    return item ? [item] : [];
  });
  if (remoteBin.length) {
    const remoteIds = new Set(remoteBin.map((item) => item.id));
    const recent = loadBin().filter((item) => !remoteIds.has(item.id) && Date.now() - Date.parse(item.removedAt) < 120000);
    replaceBin([...recent, ...remoteBin]);
    if (recent.length) postOffice("recycle", "upsert", recent.map(recycleRow));
  } else {
    const localBin = loadBin();
    if (localBin.length) postOffice("recycle", "upsert", localBin.map(recycleRow));
  }

  if (snap.corrections.length) {
    const next: Record<string, ResultCorrection> = {};
    for (const row of snap.corrections) {
      const parsed = correctionFrom(row);
      if (parsed) next[parsed.key] = parsed.edit;
    }
    replaceResultEdits(next);
  } else {
    const localEdits = loadResultEdits();
    const rows = Object.entries(localEdits).map(([key, edit]) => correctionTo(key, edit));
    if (rows.length) postOffice("corrections", "replace", rows);
  }
}

export function publishRegisterChange(body: SaveBody) {
  if (body.resource === "settings" && body.settings) postOffice("settings", "replace", [settingsTo(body.settings)]);
  if (body.resource === "staff" && body.action === "upsert") postOffice("staff", "upsert", (body.records || []).map(staffTo));
  if (body.resource === "staff" && body.action === "delete") postOffice("staff", "delete", [], body.ids || []);
  if (body.resource === "fees" && body.action === "upsert") postOffice("fees", "upsert", (body.records || []).map(feeTo));
  if (body.resource === "fees" && body.action === "delete") postOffice("fees", "delete", [], body.ids || []);
  if (body.resource === "attendance" && body.action === "upsert") postOffice("attendance", "upsert", (body.records || []).map(markTo));
  if (body.resource === "attendance" && body.action === "delete") postOffice("attendance", "delete", [], body.ids || []);
}
