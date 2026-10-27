"use client";

import { useState } from "react";
import { useSchool } from "@/components/school-context";
import { Empty, PageHead } from "@/components/ui";
import { classLabel, classOptions, todayParts } from "@/lib/format";

const MARKS = ["Present", "Absent", "Leave"] as const;

export default function AttendancePage() {
  const school = useSchool();
  const options = classOptions(school.classes, school.students);
  const [date, setDate] = useState(todayParts().iso);
  const [classKey, setClassKey] = useState(options[0] ? `${options[0].className}|${options[0].section}` : "");
  const [draftKey, setDraftKey] = useState("");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [className, section] = classKey.split("|");
  const filterKey = `${date}|${classKey}`;
  const roster = school.students
    .filter((student) => student.status !== "Left" && student.className === className && student.section === section)
    .sort((a, b) => a.name.localeCompare(b.name));

  const saved: Record<string, string> = {};
  for (const row of school.attendance) {
    if (row.date === date && row.className === className && row.section === section) {
      saved[row.studentId] = row.status;
    }
  }
  const marks = draftKey === filterKey ? draft : saved;

  function statusFor(studentId: string) {
    return marks[studentId] || "Present";
  }

  function setStatus(studentId: string, status: string) {
    const base = draftKey === filterKey ? draft : { ...saved };
    setDraft({ ...base, [studentId]: status });
    setDraftKey(filterKey);
  }

  function markAll(status: string) {
    setDraft(Object.fromEntries(roster.map((student) => [student.id, status])));
    setDraftKey(filterKey);
  }

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const records = roster.map((student) => ({
        id: `${date}_${student.id}`,
        date,
        studentId: student.id,
        admissionNo: student.admissionNo,
        studentName: student.name,
        className: student.className,
        section: student.section,
        status: statusFor(student.id),
      }));
      await school.upsert("attendance", records);
      setDraft(Object.fromEntries(records.map((record) => [record.studentId, record.status])));
      setDraftKey(filterKey);
      setMessage(`Saved ${records.length} ${records.length === 1 ? "student" : "students"} for ${classLabel(className, section)}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Attendance was not saved.");
    } finally {
      setSaving(false);
    }
  }

  const counts = { Present: 0, Absent: 0, Leave: 0 };
  for (const student of roster) counts[statusFor(student.id) as keyof typeof counts] += 1;

  return (
    <>
      <PageHead
        kicker="Daily register"
        title="Attendance"
        lede="Unmarked students are saved as present. Change the ones who are absent or on leave, then save the class. The marks are stored on the Attendance sheet."
        action={
          <button type="button" className="btn secondary" onClick={() => window.print()}>
            Print
          </button>
        }
      />
      {options.length === 0 ? (
        <Empty title="Add a class first" text="Attendance is taken class by class. Create Nursery, KG, or Class 1 before marking the day." />
      ) : (
        <>
          <div className="filters no-print">
            <input className="search" type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Attendance date" />
            <select className="select" value={classKey} onChange={(event) => setClassKey(event.target.value)} aria-label="Class">
              {options.map((room) => (
                <option key={`${room.className}|${room.section}`} value={`${room.className}|${room.section}`}>
                  {classLabel(room.className, room.section)}
                </option>
              ))}
            </select>
            <button type="button" className="btn secondary" onClick={() => markAll("Present")}>
              All present
            </button>
            <button type="button" className="btn secondary" onClick={() => markAll("Absent")}>
              All absent
            </button>
          </div>
          {roster.length === 0 ? (
            <Empty title="No active students in this class" text="Admit a student into this class, or pick another section." />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Adm no</th>
                    <th>Student</th>
                    <th>Mark</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((student) => (
                    <tr key={student.id}>
                      <td className="num" data-label="Adm no">{student.admissionNo}</td>
                      <td data-label="Student">
                        <strong>{student.name}</strong>
                        <div>{student.fatherName}</div>
                      </td>
                      <td data-label="Mark">
                        <div className="mark" role="group" aria-label={`Attendance for ${student.name}`}>
                          {MARKS.map((status) => (
                            <button
                              key={status}
                              type="button"
                              className={statusFor(student.id) === status ? `on ${status.toLowerCase()}` : ""}
                              onClick={() => setStatus(student.id, status)}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="form-actions no-print" style={{ marginTop: 14 }}>
            <button type="button" className="btn" onClick={save} disabled={saving || roster.length === 0}>
              {saving ? "Saving…" : "Save attendance"}
            </button>
            <span>
              Present {counts.Present} · Absent {counts.Absent} · Leave {counts.Leave}
            </span>
          </div>
          {message ? <p className="lede">{message}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
        </>
      )}
    </>
  );
}
