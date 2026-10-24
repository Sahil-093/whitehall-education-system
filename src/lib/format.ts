import type { SchoolClass, SchoolSettings, Student } from "./types";

export const DEFAULT_SETTINGS: SchoolSettings = {
  schoolName: "Whitehall Education System",
  campus: "Karak",
  province: "Khyber Pakhtunkhwa",
  country: "Pakistan",
  address: "Karak, Khyber Pakhtunkhwa, Pakistan",
  phone: "",
  currency: "PKR",
  academicYear: "2026-2027",
};

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const STANDARD_CLASSES = [
  "Nursery",
  "Prep",
  "KG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
];

export const DESIGNATIONS = [
  "Principal",
  "Vice Principal",
  "Teacher",
  "Clerk",
  "Accountant",
  "Peon",
];

export function todayParts(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return {
    iso: `${date.getFullYear()}-${month}-${day}`,
    month: MONTHS[date.getMonth()],
    year: String(date.getFullYear()),
  };
}

export function num(value: string | number | null | undefined) {
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function money(value: string | number | null | undefined) {
  return `Rs ${Math.round(num(value)).toLocaleString("en-US")}`;
}

export function displayDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso || "—";
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function classRank(name: string) {
  const index = STANDARD_CLASSES.indexOf(name);
  if (index >= 0) return index;
  const digits = name.match(/(\d+)/);
  if (digits) return 20 + Number(digits[1]);
  return 80;
}

export function compareClass(
  a: { className: string; section?: string },
  b: { className: string; section?: string },
) {
  const byClass = classRank(a.className) - classRank(b.className);
  if (byClass !== 0) return byClass;
  return (a.section || "").localeCompare(b.section || "");
}

export function classLabel(className: string, section?: string) {
  if (!className) return "—";
  return section ? `${className}-${section}` : className;
}

export function classOptions(classes: SchoolClass[], students: Student[]) {
  const seen = new Map<string, { className: string; section: string }>();
  for (const room of classes) {
    seen.set(`${room.className}|${room.section}`, {
      className: room.className,
      section: room.section,
    });
  }
  for (const student of students) {
    if (!student.className) continue;
    const section = student.section || "A";
    seen.set(`${student.className}|${section}`, {
      className: student.className,
      section,
    });
  }
  return Array.from(seen.values()).sort(compareClass);
}

export function nextSerial(values: string[], prefix: string, width: number) {
  let max = 0;
  for (const value of values) {
    const match = String(value).match(/(\d+)\s*$/);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}${String(max + 1).padStart(width, "0")}`;
}

export function gradeFor(obtained: string, total: string) {
  const full = num(total);
  if (full <= 0 || obtained.trim() === "") return "";
  const percent = (num(obtained) / full) * 100;
  if (percent >= 90) return "A+";
  if (percent >= 80) return "A";
  if (percent >= 70) return "B";
  if (percent >= 60) return "C";
  if (percent >= 50) return "D";
  return "F";
}

export function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
