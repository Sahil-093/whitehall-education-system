"use client";

import Link from "next/link";
import { useSchool } from "@/components/school-context";
import { Empty, PageHead, StatStrip } from "@/components/ui";
import { classLabel, compareClass, displayDate, money, num, todayParts } from "@/lib/format";

export default function OverviewPage() {
  const school = useSchool();
  const today = todayParts();
  const active = school.students.filter((student) => student.status !== "Left");
  const marked = school.attendance.filter((row) => row.date === today.iso);
  const present = marked.filter((row) => row.status === "Present").length;
  const absent = marked.filter((row) => row.status === "Absent").length;
  const monthFees = school.fees.filter((fee) => fee.month === today.month && fee.year === today.year);
  const collected = monthFees.reduce((sum, fee) => sum + num(fee.paidAmount), 0);
  const outstanding = monthFees.reduce(
    (sum, fee) => sum + Math.max(0, num(fee.amount) - num(fee.paidAmount)),
    0,
  );

  const recent = [...school.students]
    .sort((a, b) => b.admissionDate.localeCompare(a.admissionDate) || b.admissionNo.localeCompare(a.admissionNo))
    .slice(0, 6);

  const byClass = new Map<string, { className: string; section: string; present: number; absent: number; leave: number; unmarked: number }>();
  for (const student of active) {
    const key = `${student.className}|${student.section}`;
    const bucket = byClass.get(key) || {
      className: student.className,
      section: student.section,
      present: 0,
      absent: 0,
      leave: 0,
      unmarked: 0,
    };
    const mark = marked.find((row) => row.studentId === student.id);
    if (!mark) bucket.unmarked += 1;
    else if (mark.status === "Absent") bucket.absent += 1;
    else if (mark.status === "Leave") bucket.leave += 1;
    else bucket.present += 1;
    byClass.set(key, bucket);
  }
  const classRows = Array.from(byClass.values()).sort(compareClass);

  return (
    <>
      <PageHead
        kicker={`${school.settings.campus} campus`}
        title="Today at Whitehall"
        lede={`${displayDate(today.iso)} · ${school.settings.academicYear}. Students, attendance, and fees for ${school.settings.address}.`}
      />
      <StatStrip
        items={[
          { label: "Active students", value: String(active.length) },
          { label: "Present today", value: String(present) },
          { label: `${today.month} collected`, value: money(collected) },
          { label: `${today.month} still due`, value: money(outstanding) },
        ]}
      />

      {school.students.length === 0 ? (
        <Empty
          title="The register is empty"
          text={
            school.classes.length
              ? "Nursery to Class 10 are already on the class list. Add the first admission when a child joins."
              : "Add classes first, then the first admission. Attendance and monthly fees hang off that list."
          }
          action={
            <div className="page-actions">
              <Link className="btn secondary" href="/classes">
                Add classes
              </Link>
              <Link className="btn" href="/admission">
                New admission
              </Link>
            </div>
          }
        />
      ) : (
        <div className="split">
          <section className="panel">
            <h2>Latest admissions</h2>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Class</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <strong>{student.name}</strong>
                        <div className="num">{student.admissionNo}</div>
                      </td>
                      <td>{classLabel(student.className, student.section)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="panel">
            <h2>Attendance, {displayDate(today.iso)}</h2>
            {classRows.length === 0 ? (
              <p className="lede">No active students to mark.</p>
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Not marked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classRows.map((row) => (
                      <tr key={`${row.className}-${row.section}`}>
                        <td>{classLabel(row.className, row.section)}</td>
                        <td className="num">{row.present}</td>
                        <td className="num">{row.absent}</td>
                        <td className="num">{row.unmarked}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="lede">
              {absent} absent today. <Link href="/attendance">Open the attendance register</Link>
              {monthFees.length === 0 ? (
                <>
                  , or <Link href="/fees">create {today.month} fee slips</Link>
                </>
              ) : null}
              .
            </p>
          </section>
        </div>
      )}
    </>
  );
}
