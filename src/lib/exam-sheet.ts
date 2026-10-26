import { EXAM_SHEET_ID } from "./school-links";

export type ExamMark = {
  subject: string;
  value: string;
  max: number;
};

export type ExamStudent = {
  className: string;
  rollNo: string;
  name: string;
  sheetKey: string;
  fatherName: string;
  registrationNo: string;
  marks: ExamMark[];
  total: string;
  position: string;
  percentage: string;
  grade: string;
  rank: number;
};

export type ResultCorrection = {
  name: string;
  rollNo: string;
  fatherName: string;
  registrationNo: string;
  dateOfIssue: string;
  marks: Record<string, string>;
};

type MeritSource = {
  className: string;
  rollNo: string;
  name: string;
  sheetKey: string;
  fatherName: string;
  registrationNo: string;
  marks: { subject: string; value: string }[];
  total: string;
};

export type ExamClass = {
  className: string;
  tab: string;
  subjects: string[];
  students: ExamStudent[];
};

/** Tabs of "1st Term Exam - Result 2026", in class order. */
export const EXAM_TABS = [
  { gid: "1288827159", className: "Pre-Nursery", tab: "P.G" },
  { gid: "716753241", className: "Nursery", tab: "Nursery" },
  { gid: "994840931", className: "Prep", tab: "PREP" },
  { gid: "1935243487", className: "1st", tab: "1st " },
  { gid: "890490549", className: "2nd", tab: "2nd" },
  { gid: "1505121680", className: "3rd", tab: "3rd" },
  { gid: "187080813", className: "4th", tab: "4th" },
  { gid: "2100849051", className: "5th", tab: "5th" },
  { gid: "1151055848", className: "6th", tab: "6th" },
  { gid: "497972472", className: "7th", tab: "7th" },
] as const;

type GvizCell = { v?: unknown; f?: string } | null;

type GvizPayload = {
  status: string;
  table: {
    cols: { label: string }[];
    rows: { c: GvizCell[] }[];
  };
};

function cellText(cell: GvizCell) {
  if (!cell) return "";
  const shown = cell.f != null ? String(cell.f).trim() : "";
  if (shown) return shown;
  if (cell.v == null) return "";
  return String(cell.v).trim();
}

function classFromLabel(label: string) {
  const match = /class:\s*(.+?)(?:\s+student name)?$/i.exec(label);
  return match?.[1]?.trim() || "";
}

function numericMark(value: string) {
  if (!value || /^absent$/i.test(value)) return null;
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function paperFull(subject: string, values: string[]) {
  const scores = values.map(numericMark).filter((score): score is number => score !== null);
  if (scores.length === 0) return 0;
  if (/\boral\b/i.test(subject) || /\bO$/i.test(subject)) return 50;
  if (/nazra/i.test(subject) && Math.max(...scores) <= 50) return 50;
  return 100;
}

function formatPercent(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}

function ordinal(place: number) {
  const mod100 = place % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${place}th`;
  if (place % 10 === 1) return `${place}st`;
  if (place % 10 === 2) return `${place}nd`;
  if (place % 10 === 3) return `${place}rd`;
  return `${place}th`;
}

export function gradeFromPercent(percent: number) {
  if (percent >= 90) return "A+";
  if (percent >= 80) return "A";
  if (percent >= 70) return "B";
  if (percent >= 60) return "C";
  if (percent >= 50) return "D";
  return "F";
}

function withMerit(students: MeritSource[], subjects: string[]): ExamStudent[] {
  const fullBySubject = new Map(subjects.map((subject) => [subject, paperFull(subject, students.map((student) => student.marks.find((mark) => mark.subject === subject)?.value || ""))]));
  const scored = students.map((student) => {
    let got = 0;
    let full = 0;
    const marks = student.marks.map((mark) => {
      const paper = fullBySubject.get(mark.subject) || 0;
      if (paper) {
        full += paper;
        got += numericMark(mark.value) ?? 0;
      }
      return { ...mark, max: paper };
    });
    const percent = full > 0 ? Math.round((got / full) * 10000) / 100 : 0;
    return { ...student, marks, total: String(got), percent };
  });
  const unique = Array.from(new Set(scored.map((student) => student.percent))).sort((a, b) => b - a);
  const placeOf = new Map(unique.map((percent, index) => [percent, index + 1]));
  return scored
    .map((student) => {
      const rank = placeOf.get(student.percent) || scored.length;
      return {
        ...student,
        percentage: formatPercent(student.percent),
        grade: gradeFromPercent(student.percent),
        rank,
        position: ordinal(rank),
      };
    })
    .sort((a, b) => a.rank - b.rank || Number(a.rollNo) - Number(b.rollNo) || a.name.localeCompare(b.name));
}

export function subjectResult(mark: ExamMark) {
  if (!mark.max) return null;
  const raw = mark.value.trim();
  if (!raw) return { obtained: "—", percentage: "—", grade: "" };
  if (/^absent$/i.test(raw)) return { obtained: "Absent", percentage: "—", grade: "" };
  const score = numericMark(raw);
  if (score == null) return { obtained: raw, percentage: "—", grade: "" };
  const percent = Math.round((score / mark.max) * 10000) / 100;
  return { obtained: String(score), percentage: `${formatPercent(percent)}%`, grade: gradeFromPercent(percent) };
}

export function paperTotal(student: ExamStudent) {
  return student.marks.reduce((sum, mark) => sum + mark.max, 0);
}

export function applyResultCorrections(classes: ExamClass[], corrections: Record<string, ResultCorrection>) {
  return classes.map((room) => {
    const source = room.students.map((student) => {
      const edit = corrections[student.sheetKey];
      const marks = student.marks.map((mark) => ({
        subject: mark.subject,
        value: edit && Object.prototype.hasOwnProperty.call(edit.marks, mark.subject) ? edit.marks[mark.subject] : mark.value,
      }));
      return {
        className: student.className,
        rollNo: edit?.rollNo.trim() || student.rollNo,
        name: edit?.name.trim() || student.name,
        sheetKey: student.sheetKey,
        fatherName: edit?.fatherName.trim() || "",
        registrationNo: edit?.registrationNo.trim() || "",
        marks,
        total: student.total,
      };
    });
    return { ...room, students: withMerit(source, room.subjects) };
  });
}

function loadTab(gid: string, fallbackClass: string, tab: string) {
  return new Promise<ExamClass>((resolve, reject) => {
    const callbackName = `whExam_${gid}_${Date.now()}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("The result sheet took too long."));
    }, 20000);

    function cleanup() {
      window.clearTimeout(timeout);
      delete (window as unknown as Record<string, unknown>)[callbackName];
      script.remove();
    }

    (window as unknown as Record<string, (payload: GvizPayload) => void>)[callbackName] = (payload) => {
      cleanup();
      if (!payload || payload.status !== "ok") {
        reject(new Error("The result sheet could not be read."));
        return;
      }
      const labels = payload.table.cols.map((column) => column.label || "");
      const nameIndex = labels.findIndex((label) => /student name/i.test(label));
      const rollIndex = labels.findIndex((label) => /^roll no$/i.test(label.trim()));
      const totalIndex = labels.findIndex((label) => /^total$/i.test(label.trim()));
      const positionIndex = labels.findIndex((label) => /^positions?$/i.test(label.trim()));
      const percentageIndex = labels.findIndex((label) => /^percentage$/i.test(label.trim()));
      const className = classFromLabel(labels[nameIndex] || "") || fallbackClass;
      const subjectIndexes = labels
        .map((label, index) => ({ label: label.trim(), index }))
        .filter(({ label, index }) => {
          if (!label || index === nameIndex) return false;
          if ([rollIndex, totalIndex, positionIndex, percentageIndex].includes(index)) return false;
          return !/^(roll no|total|positions?|percentage)$/i.test(label);
        });

      const parsed = payload.table.rows
        .map((row) => {
          const at = (index: number) => (index < 0 ? "" : cellText(row.c?.[index]));
          const name = at(nameIndex);
          if (!name || /^student name$/i.test(name)) return null;
          const rollNo = at(rollIndex);
          return {
            className,
            rollNo,
            name,
            sheetKey: [className, rollNo, name].join("\u001f"),
            fatherName: "",
            registrationNo: "",
            marks: subjectIndexes.map(({ label, index }) => ({ subject: label, value: at(index) })),
            total: at(totalIndex),
          };
        })
        .filter((student): student is NonNullable<typeof student> => student !== null);
      const subjects = subjectIndexes.map(({ label }) => label);
      const students = withMerit(parsed, subjects);

      resolve({
        className,
        tab,
        subjects,
        students,
      });
    };

    const query = `out:json;responseHandler:${callbackName}`;
    script.src = `https://docs.google.com/spreadsheets/d/${EXAM_SHEET_ID}/gviz/tq?tqx=${encodeURIComponent(query)}&gid=${gid}&headers=2&_=${Date.now()}`;
    script.onerror = () => {
      cleanup();
      reject(new Error("The result sheet did not load."));
    };
    document.body.appendChild(script);
  });
}

let inflight: Promise<ExamClass[]> | null = null;

export function loadExamBook() {
  if (!inflight) {
    inflight = Promise.all(EXAM_TABS.map((tab) => loadTab(tab.gid, tab.className, tab.tab))).catch((error) => {
      inflight = null;
      throw error;
    });
  }
  return inflight;
}

export function reloadExamBook() {
  inflight = null;
  return loadExamBook();
}

export function examStudents(classes: ExamClass[]) {
  return classes.flatMap((room) => room.students);
}
