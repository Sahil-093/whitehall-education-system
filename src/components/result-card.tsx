"use client";

import { useState } from "react";
import { Drawer, Field } from "@/components/ui";
import { paperTotal, subjectResult, type ExamStudent, type ResultCorrection } from "@/lib/exam-sheet";

const SCALE = [
  ["A+", "90–100"],
  ["A", "80–89"],
  ["B", "70–79"],
  ["C", "60–69"],
  ["D", "50–59"],
  ["F", "Below 50"],
];

function asset(file: string) {
  return `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/${file}`;
}

function issueLabel(iso: string) {
  const value = iso || new Date().toISOString().slice(0, 10);
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function placeClass(rank: number) {
  if (rank === 1) return "place-1";
  if (rank === 2) return "place-2";
  if (rank === 3) return "place-3";
  return "";
}

export function ResultCard({ student, dateOfIssue }: { student: ExamStudent; dateOfIssue: string }) {
  const rows = student.marks.map((mark) => ({ mark, result: subjectResult(mark) })).filter((row) => row.result);
  const full = paperTotal(student);

  return (
    <article className="dmc">
      <div className="dmc-frame">
        <div className="dmc-inner">
          <header className="dmc-head">
            <img src={asset("logo.png")} alt="" />
            <p>The Whitehall Education System</p>
            <span>Karak</span>
            <h2>Detailed Marks Certificate</h2>
            <em>1st Term Examination 2026</em>
          </header>

          <h3>Student details</h3>
          <div className="dmc-details">
            <div>
              <span>Student name</span>
              <strong>{student.name}</strong>
            </div>
            <div>
              <span>Father&apos;s name</span>
              <strong>{student.fatherName || "\u00a0"}</strong>
            </div>
            <div>
              <span>Roll number</span>
              <strong>{student.rollNo || "—"}</strong>
            </div>
            <div>
              <span>Registration no.</span>
              <strong>{student.registrationNo || "\u00a0"}</strong>
            </div>
            <div>
              <span>Class</span>
              <strong>{student.className}</strong>
            </div>
            <div>
              <span>Position</span>
              <strong className={`place ${placeClass(student.rank)}`}>{student.position}</strong>
            </div>
            <div>
              <span>Academic session</span>
              <strong>2026-2027</strong>
            </div>
            <div>
              <span>Date of issue</span>
              <strong>{issueLabel(dateOfIssue)}</strong>
            </div>
          </div>

          <table className="dmc-marks">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Subject</th>
                <th>Max. marks</th>
                <th>Obtained</th>
                <th>Percentage</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.mark.subject}>
                  <td>{index + 1}</td>
                  <td className="dmc-subject">{row.mark.subject}</td>
                  <td>{row.mark.max}</td>
                  <td>
                    <strong>{row.result?.obtained}</strong>
                  </td>
                  <td>{row.result?.percentage}</td>
                  <td className={row.result?.grade === "F" ? "dmc-fail" : ""}>{row.result?.grade || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="dmc-totals-wrap">
            <table className="dmc-totals">
              <tbody>
                <tr>
                  <th>Total obtained</th>
                  <td>
                    {student.total} / {full}
                  </td>
                </tr>
                <tr>
                  <th>Percentage</th>
                  <td>{student.percentage}%</td>
                </tr>
                <tr>
                  <th>Position</th>
                  <td>{student.position}</td>
                </tr>
                <tr>
                  <th>Overall grade</th>
                  <td className={student.grade === "F" ? "dmc-fail" : ""}>{student.grade}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="dmc-lower">
            <div className="dmc-scale">
              <p>Grading scale</p>
              <ul>
                {SCALE.map(([grade, band]) => (
                  <li key={grade}>
                    <b className={grade === "F" ? "dmc-fail" : ""}>{grade}</b>
                    <span>{band}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="dmc-seal">
              <img src={asset("logo-mark.png")} alt="" />
              <span>School seal</span>
            </div>
          </div>

          <div className="dmc-signs">
            <div>
              <span />
              <p>Principal&apos;s signature</p>
            </div>
            <div>
              <span />
              <p>Examination incharge&apos;s signature</p>
            </div>
          </div>
          <p className="dmc-note">Not valid for admission purposes without the school seal and signatures.</p>
        </div>
      </div>
    </article>
  );
}

export function ResultEditor({
  student,
  dateOfIssue,
  edited,
  onClose,
  onSave,
  onReset,
}: {
  student: ExamStudent;
  dateOfIssue: string;
  edited: boolean;
  onClose: () => void;
  onSave: (correction: ResultCorrection) => void;
  onReset: () => void;
}) {
  const [name, setName] = useState(student.name);
  const [rollNo, setRollNo] = useState(student.rollNo);
  const [fatherName, setFatherName] = useState(student.fatherName);
  const [registrationNo, setRegistrationNo] = useState(student.registrationNo);
  const [issued, setIssued] = useState(dateOfIssue || new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<Record<string, string>>(() =>
    Object.fromEntries(student.marks.map((mark) => [mark.subject, mark.value])),
  );
  const [error, setError] = useState("");

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) {
      setError("Student name is required.");
      return;
    }
    const nextMarks: Record<string, string> = {};
    for (const mark of student.marks) {
      const value = (marks[mark.subject] || "").trim();
      if (value && !/^absent$/i.test(value) && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
        setError(`${mark.subject} needs a number, or Absent.`);
        return;
      }
      nextMarks[mark.subject] = /^absent$/i.test(value) ? "Absent" : value;
    }
    onSave({
      name: nextName,
      rollNo: rollNo.trim(),
      fatherName: fatherName.trim(),
      registrationNo: registrationNo.trim(),
      dateOfIssue: issued,
      marks: nextMarks,
    });
  }

  return (
    <Drawer title={`Edit ${student.name}`} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <p className="edit-note">
          {student.className}. Save updates this list and the certificate. Refresh writes the correction into the result sheet, then loads the sheet again. Father&apos;s name and registration stay on this computer.
        </p>
        <div className="form-grid">
          <Field label="Student name">
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Roll number">
            <input value={rollNo} onChange={(event) => setRollNo(event.target.value)} />
          </Field>
          <Field label="Father's name">
            <input value={fatherName} onChange={(event) => setFatherName(event.target.value)} />
          </Field>
          <Field label="Registration no.">
            <input value={registrationNo} onChange={(event) => setRegistrationNo(event.target.value)} />
          </Field>
          <Field label="Date of issue">
            <input type="date" value={issued} onChange={(event) => setIssued(event.target.value)} />
          </Field>
        </div>
        <div className="form-grid">
          {student.marks.map((mark) => (
            <Field key={mark.subject} label={mark.max ? `${mark.subject} / ${mark.max}` : mark.subject}>
              <input
                value={marks[mark.subject] || ""}
                onChange={(event) => setMarks((current) => ({ ...current, [mark.subject]: event.target.value }))}
                placeholder="Marks or Absent"
              />
            </Field>
          ))}
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="form-actions">
          <button type="submit" className="btn">
            Save correction
          </button>
          {edited ? (
            <button type="button" className="btn secondary" onClick={onReset}>
              Use sheet again
            </button>
          ) : null}
        </div>
      </form>
    </Drawer>
  );
}
