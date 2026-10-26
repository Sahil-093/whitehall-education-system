"use client";

import { Empty, PageHead } from "@/components/ui";
import { useExamSheet } from "@/components/use-exam-sheet";
import { EXAM_SHEET_URL } from "@/lib/school-links";

export default function ClassesPage() {
  const exam = useExamSheet();

  return (
    <>
      <PageHead
        kicker="1st term 2026"
        title="Classes"
        lede="These classes are the tabs of the 1st term result sheet, from Pre-Nursery through 7th."
        action={
          <a className="btn secondary" href={EXAM_SHEET_URL} target="_blank" rel="noreferrer">
            Open sheet
          </a>
        }
      />
      {exam.loading ? <p className="opening">Opening the result sheet…</p> : null}
      {exam.error ? <p className="form-error">{exam.error}</p> : null}
      {!exam.loading && !exam.error && exam.classes.length === 0 ? (
        <Empty title="No classes on the sheet" text="The result workbook has no class tabs yet." />
      ) : null}
      {exam.classes.length > 0 ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Class</th>
                <th>Students</th>
                <th>Subjects</th>
              </tr>
            </thead>
            <tbody>
              {exam.classes.map((room) => (
                <tr key={room.className}>
                  <td>
                    <strong>{room.className}</strong>
                  </td>
                  <td className="num">{room.students.length}</td>
                  <td>{room.subjects.join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
