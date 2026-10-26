import { EXAM_SHEET_ID } from "./school-links";

export type ExamMark = {
  subject: string;
  value: string;
};

export type ExamStudent = {
  className: string;
  rollNo: string;
  name: string;
  marks: ExamMark[];
  total: string;
  position: string;
  percentage: string;
};

export type ExamClass = {
  className: string;
  subjects: string[];
  students: ExamStudent[];
};

/** Tabs of "1st Term Exam - Result 2026", in class order. */
export const EXAM_TABS = [
  { gid: "1288827159", className: "Pre-Nursery" },
  { gid: "716753241", className: "Nursery" },
  { gid: "994840931", className: "Prep" },
  { gid: "1935243487", className: "1st" },
  { gid: "890490549", className: "2nd" },
  { gid: "1505121680", className: "3rd" },
  { gid: "187080813", className: "4th" },
  { gid: "2100849051", className: "5th" },
  { gid: "1151055848", className: "6th" },
  { gid: "497972472", className: "7th" },
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

function loadTab(gid: string, fallbackClass: string) {
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

      const students = payload.table.rows
        .map((row) => {
          const at = (index: number) => (index < 0 ? "" : cellText(row.c?.[index]));
          const name = at(nameIndex);
          if (!name || /^student name$/i.test(name)) return null;
          return {
            className,
            rollNo: at(rollIndex),
            name,
            marks: subjectIndexes.map(({ label, index }) => ({ subject: label, value: at(index) })),
            total: at(totalIndex),
            position: at(positionIndex),
            percentage: at(percentageIndex),
          };
        })
        .filter((student): student is ExamStudent => student !== null)
        .sort((a, b) => Number(a.rollNo) - Number(b.rollNo) || a.name.localeCompare(b.name));

      resolve({
        className,
        subjects: subjectIndexes.map(({ label }) => label),
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
    inflight = Promise.all(EXAM_TABS.map((tab) => loadTab(tab.gid, tab.className))).catch((error) => {
      inflight = null;
      throw error;
    });
  }
  return inflight;
}

export function examStudents(classes: ExamClass[]) {
  return classes.flatMap((room) => room.students);
}
