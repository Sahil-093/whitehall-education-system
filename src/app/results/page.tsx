"use client";

import { useEffect, useMemo, useState } from "react";
import { ResultCard, ResultEditor } from "@/components/result-card";
import { Badge, Empty, PageHead } from "@/components/ui";
import { useExamSheet } from "@/components/use-exam-sheet";
import { useSharedStudents } from "@/components/use-shared-students";
import { applyResultCorrections, examStudents, type ExamStudent, type ResultCorrection } from "@/lib/exam-sheet";
import { loadResultEdits, saveResultEdits } from "@/lib/result-edits";
import { loadOfficeBooks } from "@/lib/office-adopt";
import { editsAfterSync, postResultSync } from "@/lib/result-sync";
import { recordLog } from "@/lib/office-log";
import { EXAM_SHEET_URL, RESULT_EDITS_SHEET_URL } from "@/lib/school-links";
import { emptyStudentStore, loadStudentStore, officeRows, STUDENT_CLASSES, type StudentStore } from "@/lib/student-roster";

function shownMark(value: string) {
  if (!value) return "—";
  if (value.toLowerCase() === "absent") return "Absent";
  return value;
}

function placeClass(rank: number) {
  if (rank === 1) return "place-1";
  if (rank === 2) return "place-2";
  if (rank === 3) return "place-3";
  return "";
}

function printCard() {
  document.body.classList.add("printing-card");
  const cleanup = () => document.body.classList.remove("printing-card");
  window.addEventListener("afterprint", cleanup, { once: true });
  window.print();
}

function byClassThenRank(a: ExamStudent, b: ExamStudent) {
  const ai = STUDENT_CLASSES.indexOf(a.className);
  const bi = STUDENT_CLASSES.indexOf(b.className);
  return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi) || a.rank - b.rank || a.name.localeCompare(b.name);
}

export default function ResultsPage() {
  const exam = useExamSheet();
  const shared = useSharedStudents();
  const [className, setClassName] = useState("");
  const [query, setQuery] = useState("");
  const [edits, setEdits] = useState<Record<string, ResultCorrection>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [cardKey, setCardKey] = useState<string | null>(null);
  const [batch, setBatch] = useState<ExamStudent[] | null>(null);
  const [syncNote, setSyncNote] = useState("");
  const [roster, setRoster] = useState<StudentStore>(emptyStudentStore);
  const classes = useMemo(() => applyResultCorrections(exam.classes, edits), [exam.classes, edits]);
  const students = useMemo(() => examStudents(classes), [classes]);
  const rosterList = useMemo(
    () => officeRows(examStudents(exam.classes), roster, shared.rows),
    [exam.classes, roster, shared.rows],
  );
  const rosterById = useMemo(() => new Map(rosterList.map((row) => [row.id, row])), [rosterList]);
  const presented = useMemo(
    () =>
      students.map((student) => {
        const row = rosterById.get(student.sheetKey);
        if (!row) return student;
        return {
          ...student,
          name: row.edited ? row.name : student.name,
          fatherName: row.fatherName || student.fatherName,
          className: row.edited ? row.className : student.className,
          rollNo: row.rollNo,
          registrationNo: row.registrationNo || student.registrationNo,
        };
      }),
    [students, rosterById],
  );
  const selected = classes.find((room) => room.className === className) || null;
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return presented
      .filter((student) => {
        if (className && student.className !== className) return false;
        if (!needle) return true;
        return `${student.name} ${student.rollNo} ${student.registrationNo} ${student.className}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => a.rank - b.rank || a.className.localeCompare(b.className) || Number(a.rollNo) - Number(b.rollNo));
  }, [presented, className, query]);
  const editing = students.find((student) => student.sheetKey === editingKey) || null;
  const editingView = presented.find((student) => student.sheetKey === editingKey) || null;
  const card = presented.find((student) => student.sheetKey === cardKey) || null;

  useEffect(() => {
    setEdits(loadResultEdits());
    setRoster(loadStudentStore());
    void loadOfficeBooks().then(() => setEdits(loadResultEdits()));
  }, []);

  useEffect(() => {
    if (!exam.classes.length || Object.keys(edits).length === 0) return;
    postResultSync(exam.classes, edits);
  }, [exam.classes, edits]);

  useEffect(() => {
    if (!batch) return;
    const timer = window.setTimeout(() => {
      document.body.classList.add("printing-card");
      const cleanup = () => {
        document.body.classList.remove("printing-card");
        setBatch(null);
      };
      window.addEventListener("afterprint", cleanup, { once: true });
      window.print();
    }, 400);
    return () => window.clearTimeout(timer);
  }, [batch]);

  function writeEdits(next: Record<string, ResultCorrection>) {
    setEdits(next);
    saveResultEdits(next);
  }

  async function onRefresh() {
    setSyncNote("");
    const pending = edits;
    const sent = Object.keys(pending).length > 0 && postResultSync(classes, pending);
    if (sent) {
      setSyncNote("Writing corrections into the sheet…");
      await new Promise((resolve) => window.setTimeout(resolve, 5000));
    }
    try {
      const next = await exam.refresh();
      if (sent) {
        const kept = editsAfterSync(pending, next);
        writeEdits(kept);
        const failed = Object.keys(pending).filter((key) => kept[key] === pending[key]);
        setSyncNote(failed.length > 0 ? "Some corrections are still only on this computer." : "The sheet and this list now match.");
      } else if (Object.keys(pending).length > 0) {
        setSyncNote("The latest sheet is loaded. Corrections on this computer are not in the sheet yet.");
      } else {
        setSyncNote("Loaded the latest sheet.");
      }
    } catch {
      setSyncNote("");
    }
  }

  return (
    <>
      <PageHead
        kicker="1st term 2026"
        title="Results"
        lede="Every student gets a percentage from the class total, then a grade and a position from that percentage. A saved correction is written into the same cell on the result sheet, so every signed-in computer sees that mark."
        action={
          <>
            <a className="btn secondary" href={EXAM_SHEET_URL} target="_blank" rel="noreferrer">
              Open sheet
            </a>
            <a className="btn secondary" href={RESULT_EDITS_SHEET_URL} target="_blank" rel="noreferrer">
              Corrections
            </a>
          </>
        }
      />
      <div className="filters no-print">
        <input
          className="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name or roll no"
          aria-label="Search results"
        />
        <select className="select" value={className} onChange={(event) => setClassName(event.target.value)} aria-label="Filter by class">
          <option value="">All classes</option>
          {classes.map((room) => (
            <option key={room.className}>{room.className}</option>
          ))}
        </select>
        <button type="button" className="btn secondary" onClick={onRefresh} disabled={exam.refreshing}>
          {exam.refreshing ? "Refreshing…" : "Refresh"}
        </button>
        <button type="button" className="btn secondary" onClick={() => window.print()}>
          Print list
        </button>
        <button
          type="button"
          className="btn secondary"
          onClick={() => setBatch([...shown].sort(byClassThenRank))}
          disabled={shown.length === 0 || batch !== null}
        >
          {batch ? "Preparing…" : className ? "Print class DMCs" : "Print all DMCs"}
        </button>
      </div>
      {syncNote ? <p className="edit-note">{syncNote}</p> : null}
      {exam.loading ? <p className="opening">Opening the result sheet…</p> : null}
      {exam.error ? <p className="form-error">{exam.error}</p> : null}
      {!exam.loading && !exam.error && shown.length === 0 ? (
        <Empty
          title={students.length === 0 ? "No results on the sheet yet" : "Nothing matches"}
          text={students.length === 0 ? "The class tabs are empty." : "Try another class or clear the search."}
        />
      ) : null}
      {shown.length > 0 ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Roll</th>
                <th>Student</th>
                {selected ? null : <th>Class</th>}
                {selected ? selected.subjects.map((subject) => <th key={subject}>{subject}</th>) : null}
                <th>Total</th>
                <th>Position</th>
                <th>%</th>
                <th>Grade</th>
                <th className="no-print"> </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((student) => (
                <tr key={student.sheetKey} className={placeClass(student.rank)}>
                  <td className="num" data-label="Roll">{student.rollNo || "—"}</td>
                  <td data-label="Student">
                    <strong>{student.name}</strong>
                    {edits[student.sheetKey] ? <span className="edited-tag">Edited</span> : null}
                  </td>
                  {selected ? null : <td data-label="Class">{student.className}</td>}
                  {selected
                    ? selected.subjects.map((subject) => (
                        <td className="num" data-label={subject} key={subject}>
                          {shownMark(student.marks.find((item) => item.subject === subject)?.value || "")}
                        </td>
                      ))
                    : null}
                  <td className="num" data-label="Total">{shownMark(student.total)}</td>
                  <td data-label="Position">
                    <span className={`place ${placeClass(student.rank)}`}>{student.position}</span>
                  </td>
                  <td className="num" data-label="%">{student.percentage}</td>
                  <td data-label="Grade">
                    <Badge value={student.grade} />
                  </td>
                  <td className="no-print">
                    <div className="row-actions">
                      <button type="button" className="text-btn" onClick={() => setCardKey(student.sheetKey)}>
                        DMC
                      </button>
                      <button type="button" className="text-btn" onClick={() => setEditingKey(student.sheetKey)}>
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {card ? (
        <div className="card-stage">
          <div className="card-stage-bar no-print">
            <button type="button" className="btn" onClick={printCard}>
              Print DMC
            </button>
            <button type="button" className="btn secondary" onClick={() => setCardKey(null)}>
              Close
            </button>
          </div>
          <ResultCard student={card} dateOfIssue={edits[card.sheetKey]?.dateOfIssue || ""} />
        </div>
      ) : null}
      {batch ? (
        <div className="card-stage card-stage-print dmc-batch">
          {batch.map((student) => (
            <ResultCard key={student.sheetKey} student={student} dateOfIssue={edits[student.sheetKey]?.dateOfIssue || ""} />
          ))}
        </div>
      ) : null}
      {editing ? (
        <ResultEditor
          key={editing.sheetKey}
          student={editing}
          schoolRoll={editingView?.rollNo || editing.rollNo}
          schoolRegistration={editingView?.registrationNo || ""}
          dateOfIssue={edits[editing.sheetKey]?.dateOfIssue || ""}
          edited={Boolean(edits[editing.sheetKey])}
          onClose={() => setEditingKey(null)}
          onSave={(correction) => {
            writeEdits({ ...edits, [editing.sheetKey]: correction });
            recordLog("Updated result", `${editing.name} · roll ${editing.rollNo}`);
            setEditingKey(null);
          }}
          onReset={() => {
            const next = { ...edits };
            delete next[editing.sheetKey];
            writeEdits(next);
            recordLog("Cleared result correction", `${editing.name} · roll ${editing.rollNo}`);
            setEditingKey(null);
          }}
        />
      ) : null}
    </>
  );
}
