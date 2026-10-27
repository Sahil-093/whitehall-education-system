"use client";

import Link from "next/link";
import { useSchool } from "@/components/school-context";
import { Empty, PageHead, StatStrip } from "@/components/ui";
import { useExamSheet } from "@/components/use-exam-sheet";
import { examStudents } from "@/lib/exam-sheet";
import { displayDate, todayParts } from "@/lib/format";

export default function OverviewPage() {
  const school = useSchool();
  const exam = useExamSheet();
  const today = todayParts();
  const roll = examStudents(exam.classes);

  return (
    <>
      <PageHead
        kicker={`${school.settings.campus} campus`}
        title="Today at Whitehall"
        lede={`${displayDate(today.iso)} · ${school.settings.academicYear}. The 1st term roll for ${school.settings.address}.`}
      />
      {exam.loading ? <p className="opening">Opening the result sheet…</p> : null}
      {exam.error ? <p className="form-error">{exam.error}</p> : null}
      {!exam.loading && !exam.error ? (
        <StatStrip
          items={[
            { label: "Students", value: String(roll.length) },
            { label: "Classes", value: String(exam.classes.length) },
          ]}
        />
      ) : null}

      {!exam.loading && !exam.error && roll.length === 0 ? (
        <Empty
          title="No students on the result sheet"
          text="The class tabs are empty."
          action={
            <Link className="btn" href="/results">
              Open results
            </Link>
          }
        />
      ) : null}
      {exam.classes.some((room) => room.students.length > 0) ? (
        <section className="panel">
          <h2>1st term classes</h2>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Students</th>
                </tr>
              </thead>
              <tbody>
                {exam.classes.map((room) => (
                  <tr key={room.className}>
                    <td data-label="Class">
                      <strong>{room.className}</strong>
                    </td>
                    <td className="num" data-label="Students">{room.students.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
}
