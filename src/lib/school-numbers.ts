import { EXAM_TABS } from "./exam-sheet";

export type SchoolNumber = {
  rollNo: string;
  registrationNo: string;
};

const CLASS_ORDER: string[] = EXAM_TABS.map((tab) => tab.className);

function rollValue(rollNo: string) {
  const trimmed = rollNo.trim();
  if (!trimmed) return Number.MAX_SAFE_INTEGER;
  const value = Number(trimmed.replace(/[^0-9.]/g, ""));
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

export function formatClassRoll(className: string, place: number) {
  const number = String(place).padStart(2, "0");
  if (className === "Pre-Nursery") return `PN${number}`;
  if (className === "Nursery") return `N${number}`;
  if (className === "Prep") return `P${number}`;
  const classNo: Record<string, number> = { "1st": 1, "2nd": 2, "3rd": 3, "4th": 4, "5th": 5, "6th": 6, "7th": 7 };
  if (classNo[className]) return String(classNo[className] * 100 + place);
  return number;
}

export function schoolNumbers(
  students: { className: string; rollNo: string; name: string; sheetKey: string }[],
) {
  const groups = new Map<string, typeof students>();
  for (const student of students) {
    const list = groups.get(student.className) || [];
    list.push(student);
    groups.set(student.className, list);
  }
  const classNames = [
    ...CLASS_ORDER.filter((name) => groups.has(name)),
    ...[...groups.keys()].filter((name) => !CLASS_ORDER.includes(name)),
  ];
  const assigned = new Map<string, SchoolNumber>();
  let serial = 1;
  for (const className of classNames) {
    const list = (groups.get(className) || []).slice().sort((a, b) => rollValue(a.rollNo) - rollValue(b.rollNo) || a.name.localeCompare(b.name));
    list.forEach((student, index) => {
      assigned.set(student.sheetKey, {
        rollNo: formatClassRoll(className, index + 1),
        registrationNo: `WHES-${String(serial).padStart(3, "0")}`,
      });
      serial += 1;
    });
  }
  return assigned;
}
