import { EXAM_TABS } from "./exam-sheet";
import { formatClassRoll, schoolNumbers } from "./school-numbers";

export const STUDENT_CLASSES: string[] = EXAM_TABS.map((tab) => tab.className);

export type StudentFormRecord = {
  name: string;
  fatherName: string;
  className: string;
  rollNo: string;
};

export type AddedStudent = StudentFormRecord & {
  id: string;
  registrationNo: string;
};

export type StudentStore = {
  patches: Record<string, StudentFormRecord>;
  added: AddedStudent[];
};

export type RosterRow = {
  id: string;
  name: string;
  fatherName: string;
  className: string;
  rollNo: string;
  registrationNo: string;
  added: boolean;
  edited: boolean;
};

const STORAGE_KEY = "whitehall-student-roster-v1";

const CLASS_NO: Record<string, number> = { "1st": 1, "2nd": 2, "3rd": 3, "4th": 4, "5th": 5, "6th": 6, "7th": 7 };

export function emptyStudentStore(): StudentStore {
  return { patches: {}, added: [] };
}

function isAdded(value: unknown): value is AddedStudent {
  if (!value || typeof value !== "object") return false;
  const row = value as AddedStudent;
  return Boolean(row.id && row.name && row.className && row.rollNo && row.registrationNo);
}

export function loadStudentStore(): StudentStore {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStudentStore();
    const parsed = JSON.parse(raw) as Partial<StudentStore>;
    const patches = parsed.patches && typeof parsed.patches === "object" ? parsed.patches : {};
    const added = Array.isArray(parsed.added) ? parsed.added.filter(isAdded) : [];
    return { patches, added };
  } catch {
    return emptyStudentStore();
  }
}

export function saveStudentStore(store: StudentStore) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function rosterRows(
  sheet: { sheetKey: string; name: string; className: string; rollNo: string }[],
  store: StudentStore,
): RosterRow[] {
  const numbers = schoolNumbers(sheet);
  const rows: RosterRow[] = sheet.map((student) => {
    const patch = store.patches[student.sheetKey];
    const assigned = numbers.get(student.sheetKey);
    return {
      id: student.sheetKey,
      name: patch?.name.trim() || student.name,
      fatherName: patch?.fatherName.trim() || "",
      className: patch?.className || student.className,
      rollNo: patch?.rollNo.trim() || assigned?.rollNo || student.rollNo,
      registrationNo: assigned?.registrationNo || "",
      added: false,
      edited: Boolean(patch),
    };
  });
  for (const extra of store.added) {
    rows.push({
      id: extra.id,
      name: extra.name,
      fatherName: extra.fatherName,
      className: extra.className,
      rollNo: extra.rollNo,
      registrationNo: extra.registrationNo,
      added: true,
      edited: false,
    });
  }
  return rows.sort((a, b) => a.registrationNo.localeCompare(b.registrationNo) || a.name.localeCompare(b.name));
}

export function placeInClass(className: string, rollNo: string) {
  const digits = Number(String(rollNo).replace(/\D/g, ""));
  if (!Number.isFinite(digits) || digits <= 0) return 0;
  const classNo = CLASS_NO[className];
  if (classNo && digits >= classNo * 100 && digits < (classNo + 1) * 100) return digits - classNo * 100;
  return digits;
}

export function suggestRoll(className: string, rows: { id: string; className: string; rollNo: string }[], exceptId?: string) {
  const place = rows.reduce((max, row) => {
    if (row.className !== className || row.id === exceptId) return max;
    return Math.max(max, placeInClass(className, row.rollNo));
  }, 0);
  return formatClassRoll(className, place + 1);
}

export function suggestRegistration(rows: { registrationNo: string }[]) {
  const serial = rows.reduce((max, row) => Math.max(max, Number(row.registrationNo.replace(/\D/g, "")) || 0), 0);
  return `WHES-${String(serial + 1).padStart(3, "0")}`;
}

export function applyStudentForm<
  T extends {
    sheetKey: string;
    name: string;
    fatherName: string;
    className: string;
    rollNo: string;
    registrationNo: string;
  },
>(student: T, store: StudentStore, assigned?: { rollNo: string; registrationNo: string }): T {
  const patch = store.patches[student.sheetKey];
  return {
    ...student,
    name: patch?.name.trim() || student.name,
    fatherName: patch ? patch.fatherName.trim() : student.fatherName,
    className: patch?.className || student.className,
    rollNo: patch?.rollNo.trim() || assigned?.rollNo || student.rollNo,
    registrationNo: student.registrationNo || assigned?.registrationNo || "",
  };
}
