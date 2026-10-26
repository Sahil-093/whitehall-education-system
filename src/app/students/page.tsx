"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSchool } from "@/components/school-context";
import { StudentRecord, type StudentRecordSave } from "@/components/student-record";
import { Badge, Drawer, Empty, Field, PageHead } from "@/components/ui";
import { useExamSheet } from "@/components/use-exam-sheet";
import { readActor } from "@/lib/admin-auth";
import { examStudents } from "@/lib/exam-sheet";
import { classLabel, classOptions, compareClass, money, uid } from "@/lib/format";
import { formatWhen, recordLog } from "@/lib/office-log";
import { holdItem } from "@/lib/recycle-bin";
import { EXAM_SHEET_URL } from "@/lib/school-links";
import {
  emptyStudentStore,
  loadStudentStore,
  rosterRows,
  saveStudentStore,
  STUDENT_CLASSES,
  suggestRegistration,
  suggestRoll,
  type RosterRow,
  type StudentStore,
} from "@/lib/student-roster";
import type { Student } from "@/lib/types";

function auditLine(student: RosterRow) {
  if (!student.edited && !student.added) return null;
  const kind = student.audit?.kind || (student.added && !student.edited ? "added" : "edited");
  const by = student.audit?.by || "Admin";
  const when = student.audit?.at ? formatWhen(student.audit.at) : "";
  const label = kind === "added" ? "Added by" : "Edited by";
  return (
    <span className="edit-by">
      {label}: {by}
      {when ? ` · ${when}` : ""}
    </span>
  );
}

export default function StudentsPage() {
  const school = useSchool();
  const exam = useExamSheet();
  const [sheetQuery, setSheetQuery] = useState("");
  const [sheetClass, setSheetClass] = useState("");
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [status, setStatus] = useState("Active");
  const [editor, setEditor] = useState<Student | null>(null);
  const [store, setStore] = useState<StudentStore>(emptyStudentStore);
  const [draft, setDraft] = useState<{ row: RosterRow; edit: boolean } | null>(null);
  const options = classOptions(school.classes, school.students);
  const rows = useMemo(() => rosterRows(examStudents(exam.classes), store), [exam.classes, store]);
  const roll = rows.filter((student) => {
    if (sheetClass && student.className !== sheetClass) return false;
    const needle = sheetQuery.trim().toLowerCase();
    if (!needle) return true;
    return `${student.name} ${student.fatherName} ${student.rollNo} ${student.registrationNo} ${student.className}`
      .toLowerCase()
      .includes(needle);
  });

  useEffect(() => {
    setStore(loadStudentStore());
  }, []);

  function writeStore(next: StudentStore) {
    saveStudentStore(next);
    setStore(next);
  }

  function startAdd() {
    const className = sheetClass || STUDENT_CLASSES[0];
    setDraft({
      edit: true,
      row: {
        id: "",
        name: "",
        fatherName: "",
        className,
        rollNo: suggestRoll(className, rows),
        registrationNo: suggestRegistration(rows),
        added: true,
        edited: false,
        photo: "",
      },
    });
  }

  function saveRecord(next: StudentRecordSave, options?: { close?: boolean }) {
    if (!draft) return;
    const record = {
      name: next.name,
      fatherName: next.fatherName,
      className: next.className,
      rollNo: next.rollNo,
      profile: next.profile,
      photo: next.photo,
      audit: {
        by: readActor().name,
        at: new Date().toISOString(),
        kind: !draft.row.id ? ("added" as const) : ("edited" as const),
      },
    };
    try {
      if (!draft.row.id) {
        writeStore({
          ...store,
          added: [...store.added, { ...record, id: uid(), registrationNo: draft.row.registrationNo }],
        });
      } else if (draft.row.added) {
        writeStore({
          ...store,
          added: store.added.map((student) => (student.id === draft.row.id ? { ...student, ...record } : student)),
        });
      } else {
        writeStore({
          ...store,
          patches: { ...store.patches, [draft.row.id]: record },
        });
      }
    } catch {
      throw new Error("This browser could not store that photo. Remove it or use a smaller picture.");
    }
    recordLog(
      options?.close === false ? "Saved student photo" : record.audit.kind === "added" ? "Added student" : "Updated student",
      `${next.name} · ${next.rollNo} · ${next.className}`,
    );
    if (options?.close === false) {
      setDraft((current) =>
        current
          ? {
              ...current,
              edit: true,
              row: {
                ...current.row,
                name: next.name,
                fatherName: next.fatherName,
                className: next.className,
                rollNo: next.rollNo,
                photo: next.photo,
                profile: next.profile,
                audit: record.audit,
                edited: true,
              },
            }
          : current,
      );
      return;
    }
    setDraft(null);
  }

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
      `Remove ${student.name}? The record stays in the Recycle Bin for 14 days.`,
    );
    if (!confirmed) return;
    holdItem({
      kind: "register-student",
      name: student.name,
      detail: `${student.admissionNo} · ${student.className}`,
      payload: student,
    });
    recordLog("Removed student", `${student.name} · kept in the recycle bin for 14 days`);
    await school.remove("students", [student.id]);
  }

  return (
    <>
      <PageHead
        kicker="Admissions"
        title="Students"
        lede="View a student, or open the full admission form to fill in the details. Every field can be left blank for now. The roll number saved here is the roll number on the result list."
        action={
          <>
            <a className="btn secondary" href={EXAM_SHEET_URL} target="_blank" rel="noreferrer">
              Open sheet
            </a>
            <Link className="btn secondary" href="/admission">
              New admission
            </Link>
            <button type="button" className="btn" onClick={startAdd}>
              Add student
            </button>
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
          title={rows.length === 0 ? "No students on the sheet" : "Nothing matches"}
          text={rows.length === 0 ? "The class tabs have no names yet." : "Try another class or clear the search."}
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
                <th className="no-print"> </th>
              </tr>
            </thead>
            <tbody>
              {roll.map((student) => (
                <tr key={student.id}>
                  <td className="num">{student.rollNo || "—"}</td>
                  <td className="num">{student.registrationNo || "—"}</td>
                  <td>
                    <strong>{student.name}</strong>
                    {student.fatherName ? <div>{student.fatherName}</div> : null}
                    {auditLine(student)}
                  </td>
                  <td>{student.className}</td>
                  <td className="no-print">
                    <button type="button" className="text-btn" onClick={() => setDraft({ row: student, edit: false })}>
                      View
                    </button>
                    {" · "}
                    <button type="button" className="text-btn" onClick={() => setDraft({ row: student, edit: true })}>
                      Edit
                    </button>
                  </td>
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

      {draft ? (
        <StudentRecord
          key={draft.row.id || "new"}
          initial={draft.row}
          rows={rows}
          startInEdit={draft.edit}
          onClose={() => setDraft(null)}
          onSave={saveRecord}
          onReset={() => {
            if (!draft.row.id || draft.row.added) return;
            const patches = { ...store.patches };
            delete patches[draft.row.id];
            writeStore({ ...store, patches });
            recordLog("Restored sheet", `${draft.row.name} · ${draft.row.rollNo}`);
            setDraft(null);
          }}
          onRemove={() => {
            if (!draft.row.added || !draft.row.id) return;
            const student = store.added.find((row) => row.id === draft.row.id);
            if (!window.confirm(`Remove ${draft.row.name}? The record stays in the Recycle Bin for 14 days.`)) return;
            if (student) {
              holdItem({
                kind: "roster",
                name: student.name,
                detail: `${student.rollNo} · ${student.className} · ${student.registrationNo}`,
                payload: student,
              });
            }
            writeStore({ ...store, added: store.added.filter((row) => row.id !== draft.row.id) });
            recordLog("Removed student", `${draft.row.name} · ${draft.row.rollNo} · kept in the recycle bin for 14 days`);
            setDraft(null);
          }}
        />
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
