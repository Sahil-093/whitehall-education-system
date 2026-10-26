"use client";

import { useEffect, useMemo, useState } from "react";
import { ResultCard, ResultEditor } from "@/components/result-card";
import { Badge, Empty, PageHead } from "@/components/ui";
import { useExamSheet } from "@/components/use-exam-sheet";
import { applyResultCorrections, examStudents, type ResultCorrection } from "@/lib/exam-sheet";
import { loadResultEdits, saveResultEdits } from "@/lib/result-edits";
import { EXAM_SHEET_URL } from "@/lib/school-links";

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

export default function ResultsPage() {
  const exam = useExamSheet();
  const [className, setClassName] = useState("");
  const [query, setQuery] = useState("");
  const [edits, setEdits] = useState<Record<string, ResultCorrection>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [cardKey, setCardKey] = useState<string | null>(null);
  const classes = useMemo(() => applyResultCorrections(exam.classes, edits), [exam.classes, edits]);
  const students = useMemo(() => examStudents(classes), [classes]);
  const selected = classes.find((room) => room.className === className) || null;
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return students
      .filter((student) => {
        if (className && student.className !== className) return false;
        if (!needle) return true;
        return `${student.name} ${student.rollNo} ${student.className}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => a.rank - b.rank || a.className.localeCompare(b.className) || Number(a.rollNo) - Number(b.rollNo));
  }, [students, className, query]);
  const editing = students.find((student) => student.sheetKey === editingKey) || null;
  const card = students.find((student) => student.sheetKey === cardKey) || null;

  useEffect(() => {
    setEdits(loadResultEdits());
  }, []);

  function writeEdits(next: Record<string, ResultCorrection>) {
    setEdits(next);
    saveResultEdits(next);
  }

  return (
    <>
      <PageHead
        kicker="1st term 2026"
        title="Results"
        lede="Every student gets a percentage from the class total, then a grade and a position from that percentage. Open a certificate for one student, or correct a mark if the sheet has a mistake. The list runs from 1st downward."
        action={
          <a className="btn secondary" href={EXAM_SHEET_URL} target="_blank" rel="noreferrer">
            Open sheet
          </a>
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
        <button type="button" className="btn secondary" onClick={() => window.print()}>
          Print list
        </button>
      </div>
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
                  <td className="num">{student.rollNo || "—"}</td>
                  <td>
                    <strong>{student.name}</strong>
                    {edits[student.sheetKey] ? <span className="edited-tag">Edited</span> : null}
                  </td>
                  {selected ? null : <td>{student.className}</td>}
                  {selected
                    ? selected.subjects.map((subject) => (
                        <td className="num" key={subject}>
                          {shownMark(student.marks.find((item) => item.subject === subject)?.value || "")}
                        </td>
                      ))
                    : null}
                  <td className="num">{shownMark(student.total)}</td>
                  <td>
                    <span className={`place ${placeClass(student.rank)}`}>{student.position}</span>
                  </td>
                  <td className="num">{student.percentage}</td>
                  <td>
                    <Badge value={student.grade} />
                  </td>
                  <td className="no-print">
                    <div className="row-actions">
                      <button type="button" className="text-btn" onClick={() => setCardKey(student.sheetKey)}>
                        Card
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
              Print certificate
            </button>
            <button type="button" className="btn secondary" onClick={() => setCardKey(null)}>
              Close
            </button>
          </div>
          <ResultCard student={card} dateOfIssue={edits[card.sheetKey]?.dateOfIssue || ""} />
        </div>
      ) : null}
      {editing ? (
        <ResultEditor
          key={editing.sheetKey}
          student={editing}
          dateOfIssue={edits[editing.sheetKey]?.dateOfIssue || ""}
          edited={Boolean(edits[editing.sheetKey])}
          onClose={() => setEditingKey(null)}
          onSave={(correction) => {
            writeEdits({ ...edits, [editing.sheetKey]: correction });
            setEditingKey(null);
          }}
          onReset={() => {
            const next = { ...edits };
            delete next[editing.sheetKey];
            writeEdits(next);
            setEditingKey(null);
          }}
        />
      ) : null}
    </>
  );
}
