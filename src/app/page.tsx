"use client";

import Link from "next/link";
import { useSchool } from "@/components/school-context";
import { Empty, PageHead, StatStrip } from "@/components/ui";
import { classLabel, displayDate, todayParts } from "@/lib/format";

export default function OverviewPage() {
  const school = useSchool();
  const today = todayParts();
  const active = school.students.filter((student) => student.status !== "Left");

  const recent = [...school.students]
    .sort((a, b) => b.admissionDate.localeCompare(a.admissionDate) || b.admissionNo.localeCompare(a.admissionNo))
    .slice(0, 6);

  return (
    <>
      <PageHead
        kicker={`${school.settings.campus} campus`}
        title="Today at Whitehall"
        lede={`${displayDate(today.iso)} · ${school.settings.academicYear}. Admissions and classes for ${school.settings.address}.`}
      />
      <StatStrip
        items={[
          { label: "Active students", value: String(active.length) },
          { label: "Classes", value: String(school.classes.length) },
        ]}
      />

      {school.students.length === 0 ? (
        <Empty
          title="The register is empty"
          text={
            school.classes.length
              ? "Nursery to Class 10 are already on the class list. Add the first admission when a child joins."
              : "Add classes first, then the first admission."
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
      )}
    </>
  );
}
