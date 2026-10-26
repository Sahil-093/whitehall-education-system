"use client";

import { useMemo, useState } from "react";
import { Badge, Empty, PageHead } from "@/components/ui";
import { useExamSheet } from "@/components/use-exam-sheet";
import { examStudents } from "@/lib/exam-sheet";
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

export default function ResultsPage() {
  const exam = useExamSheet();
  const [className, setClassName] = useState("");
  const [query, setQuery] = useState("");
  const students = useMemo(() => examStudents(exam.classes), [exam.classes]);
  const selected = exam.classes.find((room) => room.className === className) || null;
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

  return (
    <>
      <PageHead
        kicker="1st term 2026"
        title="Results"
        lede="Every student gets a percentage from the class total, then a grade and a position from that percentage. The list runs from 1st downward. Tied percentages share a place. 1st is gold, 2nd silver, 3rd bronze."
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
          {exam.classes.map((room) => (
            <option key={room.className}>{room.className}</option>
          ))}
        </select>
        <button type="button" className="btn secondary" onClick={() => window.print()}>
          Print
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
                {selected
                  ? selected.subjects.map((subject) => <th key={subject}>{subject}</th>)
                  : null}
                <th>Total</th>
                <th>Position</th>
                <th>%</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((student) => (
                <tr key={`${student.className}-${student.rollNo}-${student.name}`} className={placeClass(student.rank)}>
                  <td className="num">{student.rollNo || "—"}</td>
                  <td>
                    <strong>{student.name}</strong>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
