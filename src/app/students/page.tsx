"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSchool } from "@/components/school-context";
import { Badge, Drawer, Empty, Field, PageHead } from "@/components/ui";
import { useExamSheet } from "@/components/use-exam-sheet";
import { examStudents } from "@/lib/exam-sheet";
import { classLabel, classOptions, compareClass, money, uid } from "@/lib/format";
import { schoolNumbers } from "@/lib/school-numbers";
import { EXAM_SHEET_URL } from "@/lib/school-links";
import type { Student } from "@/lib/types";

export default function StudentsPage() {
  const school = useSchool();
  const exam = useExamSheet();
  const [sheetQuery, setSheetQuery] = useState("");
  const [sheetClass, setSheetClass] = useState("");
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [status, setStatus] = useState("Active");
  const [editor, setEditor] = useState<Student | null>(null);
  const options = classOptions(school.classes, school.students);
  const numbers = useMemo(() => schoolNumbers(examStudents(exam.classes)), [exam.classes]);
  const roll = examStudents(exam.classes)
    .filter((student) => {
      if (sheetClass && student.className !== sheetClass) return false;
      const needle = sheetQuery.trim().toLowerCase();
      if (!needle) return true;
      const assigned = numbers.get(student.sheetKey);
      return `${student.name} ${student.rollNo} ${assigned?.rollNo || ""} ${assigned?.registrationNo || ""} ${student.className}`
        .toLowerCase()
        .includes(needle);
    })
    .sort((a, b) => (numbers.get(a.sheetKey)?.registrationNo || "").localeCompare(numbers.get(b.sheetKey)?.registrationNo || ""));

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return school.students
      .filter((student) => {
        if (status !== "All" && student.status !== status) return false;
        if (classFilter && `${student.className}|${student.section}` !== classFilter) return false;
        if (!needle) return true;
        return [student.name, student.fatherName, student.admissionNo, student.phone, student.className]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => compareClass(a, b) || a.name.localeCompare(b.name));
  }, [school.students, query, classFilter, status]);

  async function removeStudent(student: Student) {
    const confirmed = window.confirm(
      `Remove ${student.name} from the current register? Past attendance and fee receipts stay as they are.`,
    );
    if (!confirmed) return;
    await school.remove("students", [student.id]);
  }

  return (
    <>
      <PageHead
        kicker="Admissions"
        title="Students"
        lede="Roll numbers follow the class: PN01, N01, P01, then 101, 201, 301 and so on. Registration numbers run WHES-001 onward, from Pre-Nursery through 7th."
        action={
          <>
            <a className="btn secondary" href={EXAM_SHEET_URL} target="_blank" rel="noreferrer">
              Open sheet
            </a>
            <Link className="btn" href="/admission">
              New admission
            </Link>
          </>
        }
      />
      <div className="filters no-print">
        <input
          className="search"
          value={sheetQuery}
          onChange={(event) => setSheetQuery(event.target.value)}
          placeholder="Search name, roll, or registration"
          aria-label="Search the result roll"
        />
        <select className="select" value={sheetClass} onChange={(event) => setSheetClass(event.target.value)} aria-label="Filter the result roll by class">
          <option value="">All classes</option>
          {exam.classes.map((room) => (
            <option key={room.className}>{room.className}</option>
          ))}
        </select>
      </div>
      {exam.loading ? <p className="opening">Opening the result sheet…</p> : null}
      {exam.error ? <p className="form-error">{exam.error}</p> : null}
      {!exam.loading && !exam.error && roll.length === 0 ? (
        <Empty
          title={examStudents(exam.classes).length === 0 ? "No students on the sheet" : "Nothing matches"}
          text={examStudents(exam.classes).length === 0 ? "The class tabs have no names yet." : "Try another class or clear the search."}
        />
      ) : null}
      {roll.length > 0 ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Roll</th>
                <th>Registration</th>
                <th>Student</th>
                <th>Class</th>
              </tr>
            </thead>
            <tbody>
              {roll.map((student) => (
                <tr key={student.sheetKey}>
                  <td className="num">{numbers.get(student.sheetKey)?.rollNo || "—"}</td>
                  <td className="num">{numbers.get(student.sheetKey)?.registrationNo || "—"}</td>
                  <td>
                    <strong>{student.name}</strong>
                  </td>
                  <td>{student.className}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {school.students.length > 0 ? (
        <>
          <h2 style={{ marginTop: 28 }}>Admissions in this browser</h2>
          <div className="filters no-print">
        <input
          className="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, father, admission no"
          aria-label="Search students"
        />
        <select className="select" value={classFilter} onChange={(event) => setClassFilter(event.target.value)} aria-label="Filter by class">
          <option value="">All classes</option>
          {options.map((room) => (
            <option key={`${room.className}|${room.section}`} value={`${room.className}|${room.section}`}>
              {classLabel(room.className, room.section)}
            </option>
          ))}
        </select>
        <select className="select" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
          <option>Active</option>
          <option>Left</option>
          <option>All</option>
        </select>
      </div>

      {shown.length === 0 ? (
        <Empty title="Nothing matches" text="Try another class, or clear the search." />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Adm no</th>
                <th>Student</th>
                <th>Father</th>
                <th>Class</th>
                <th>Phone</th>
                <th>Monthly fee</th>
                <th>Status</th>
                <th className="no-print"> </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((student) => (
                <tr key={student.id}>
                  <td className="num">{student.admissionNo}</td>
                  <td>
                    <strong>{student.name}</strong>
                    <div>{student.gender || "—"}</div>
                  </td>
                  <td>{student.fatherName}</td>
                  <td>{classLabel(student.className, student.section)}</td>
                  <td>{student.phone || "—"}</td>
                  <td className="num">{money(student.monthlyFee)}</td>
                  <td>
                    <Badge value={student.status} />
                  </td>
                  <td className="no-print">
                    <button type="button" className="text-btn" onClick={() => setEditor(student)}>
                      Edit
                    </button>
                    {" · "}
                    <button type="button" className="text-btn danger" onClick={() => removeStudent(student)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
        </>
      ) : null}

      {editor ? (
        <StudentDrawer
          key={editor.id || "new"}
          initial={editor}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </>
  );
}

function StudentDrawer({ initial, onClose }: { initial: Student; onClose: () => void }) {
  const school = useSchool();
  const [form, setForm] = useState(initial);
  const [feeTouched, setFeeTouched] = useState(Boolean(initial.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const options = classOptions(school.classes, school.students);

  function set<K extends keyof Student>(key: K, value: Student[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyClass(className: string, section: string) {
    const match = school.classes.find((room) => room.className === className && room.section === section);
    setForm((current) => ({
      ...current,
      className,
      section,
      monthlyFee: !feeTouched && match?.monthlyFee ? match.monthlyFee : current.monthlyFee,
    }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await school.upsert("students", [{ ...form, id: form.id || uid() }]);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer title={initial.id ? "Edit student" : "New admission"} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <div className="form-grid">
          <Field label="Admission no">
            <input value={form.admissionNo} onChange={(event) => set("admissionNo", event.target.value)} required />
          </Field>
          <Field label="Roll no">
            <input value={form.rollNo} onChange={(event) => set("rollNo", event.target.value)} />
          </Field>
          <Field label="Student name">
            <input value={form.name} onChange={(event) => set("name", event.target.value)} required />
          </Field>
          <Field label="Father name">
            <input value={form.fatherName} onChange={(event) => set("fatherName", event.target.value)} required />
          </Field>
          <Field label="Gender">
            <select value={form.gender} onChange={(event) => set("gender", event.target.value)} required>
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
            </select>
          </Field>
          <Field label="Date of birth">
            <input type="date" value={form.dateOfBirth} onChange={(event) => set("dateOfBirth", event.target.value)} />
          </Field>
          <Field label="Class">
            <input
              list="class-names"
              value={form.className}
              onChange={(event) => applyClass(event.target.value, form.section)}
              required
            />
            <datalist id="class-names">
              {Array.from(new Set(options.map((room) => room.className))).map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </Field>
          <Field label="Section">
            <input value={form.section} onChange={(event) => applyClass(form.className, event.target.value)} required />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={(event) => set("phone", event.target.value)} inputMode="tel" />
          </Field>
          <Field label="Monthly fee (Rs)">
            <input
              value={form.monthlyFee}
              onChange={(event) => {
                setFeeTouched(true);
                set("monthlyFee", event.target.value);
              }}
              inputMode="numeric"
            />
          </Field>
          <Field label="Admission date">
            <input type="date" value={form.admissionDate} onChange={(event) => set("admissionDate", event.target.value)} />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(event) => set("status", event.target.value)}>
              <option>Active</option>
              <option>Left</option>
            </select>
          </Field>
          <div className="span-2">
            <Field label="Address">
              <textarea value={form.address} onChange={(event) => set("address", event.target.value)} />
            </Field>
          </div>
          <div className="span-2">
            <Field label="Notes">
              <textarea value={form.notes} onChange={(event) => set("notes", event.target.value)} />
            </Field>
          </div>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="form-actions">
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save student"}
          </button>
          <button className="btn secondary" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Drawer>
  );
}
