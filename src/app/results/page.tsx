"use client";

import { useState } from "react";
import { useSchool } from "@/components/school-context";
import { Badge, Empty, Field, PageHead } from "@/components/ui";
import { classLabel, displayDate, gradeFor, todayParts, uid } from "@/lib/format";
import type { Exam } from "@/lib/types";

export default function ResultsPage() {
  const school = useSchool();
  const classNames = Array.from(new Set(school.classes.map((room) => room.className).concat(school.students.map((student) => student.className)))).filter(Boolean);
  const [form, setForm] = useState({
    name: "Mid Term",
    className: classNames[0] || "",
    subject: "",
    examDate: todayParts().iso,
    totalMarks: "100",
  });
  const [selectedId, setSelectedId] = useState(school.exams[0]?.id || "");
  const [draftKey, setDraftKey] = useState("");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const exam = school.exams.find((item) => item.id === selectedId) || null;

  async function addExam(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const id = uid();
      await school.upsert("exams", [{ id, ...form }]);
      setSelectedId(id);
      setForm((current) => ({ ...current, subject: "" }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Exam was not saved.");
    } finally {
      setSaving(false);
    }
  }

  async function removeExam(item: Exam) {
    if (!window.confirm(`Remove ${item.name} ${item.subject} and its marks?`)) return;
    await school.remove("exams", [item.id]);
    if (selectedId === item.id) setSelectedId("");
  }

  const roster = exam
    ? school.students
        .filter((student) => student.status !== "Left" && student.className === exam.className)
        .sort((a, b) => a.section.localeCompare(b.section) || a.name.localeCompare(b.name))
    : [];

  const saved: Record<string, string> = {};
  if (exam) {
    for (const result of school.results) {
      if (result.examId === exam.id) saved[result.studentId] = result.obtained;
    }
  }
  const marks = exam && draftKey === exam.id ? draft : saved;

  async function saveMarks() {
    if (!exam) return;
    setSaving(true);
    setError("");
    try {
      const records = [];
      const removeIds = [];
      for (const student of roster) {
        const id = `${exam.id}_${student.id}`;
        const obtained = (marks[student.id] || "").trim();
        if (!obtained) {
          if (school.results.some((result) => result.id === id)) removeIds.push(id);
          continue;
        }
        records.push({
          id,
          examId: exam.id,
          examName: exam.name,
          studentId: student.id,
          admissionNo: student.admissionNo,
          studentName: student.name,
          className: student.className,
          section: student.section,
          subject: exam.subject,
          obtained,
          totalMarks: exam.totalMarks,
          grade: gradeFor(obtained, exam.totalMarks),
        });
      }
      if (records.length) await school.upsert("results", records);
      if (removeIds.length) await school.remove("results", removeIds);
      setDraft(marks);
      setDraftKey(exam.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Marks were not saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHead
        kicker="Exams"
        title="Results"
        lede="One subject at a time. Grades: A+ from 90, then A, B, C, D, and F below 50."
        action={
          <button type="button" className="btn secondary" onClick={() => window.print()}>
            Print
          </button>
        }
      />
      <div className="split">
        <form className="card stack no-print" onSubmit={addExam}>
          <h2>New paper</h2>
          <Field label="Exam">
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </Field>
          <Field label="Class">
            <input list="exam-classes" value={form.className} onChange={(event) => setForm({ ...form, className: event.target.value })} required />
            <datalist id="exam-classes">
              {classNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </Field>
          <Field label="Subject">
            <input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} required />
          </Field>
          <Field label="Date">
            <input type="date" value={form.examDate} onChange={(event) => setForm({ ...form, examDate: event.target.value })} />
          </Field>
          <Field label="Total marks">
            <input value={form.totalMarks} onChange={(event) => setForm({ ...form, totalMarks: event.target.value })} inputMode="numeric" required />
          </Field>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save exam"}
          </button>
        </form>
        <div>
          {school.exams.length === 0 ? (
            <Empty title="No exams yet" text="Add a paper for a class, then enter the marks beside each student." />
          ) : (
            <>
              <div className="filters no-print">
                <select className="select" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} aria-label="Exam paper">
                  {school.exams.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {item.className} · {item.subject}
                    </option>
                  ))}
                </select>
                {exam ? (
                  <button type="button" className="text-btn danger" onClick={() => removeExam(exam)}>
                    Remove this paper
                  </button>
                ) : null}
              </div>
              {exam ? (
                <>
                  <p className="lede">
                    {exam.name}, {exam.subject}, {classLabel(exam.className)} · {displayDate(exam.examDate)} · total {exam.totalMarks}
                  </p>
                  {roster.length === 0 ? (
                    <Empty title="No students in this class" text="Admit students into this class before entering marks." />
                  ) : (
                    <div className="table-wrap">
                      <table className="data">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Section</th>
                            <th>Obtained</th>
                            <th>Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roster.map((student) => {
                            const obtained = marks[student.id] || "";
                            return (
                              <tr key={student.id}>
                                <td>
                                  <strong>{student.name}</strong>
                                  <div className="num">{student.admissionNo}</div>
                                </td>
                                <td>{student.section}</td>
                                <td>
                                  <input
                                    className="search"
                                    style={{ minWidth: 90, width: 90 }}
                                    value={obtained}
                                    inputMode="numeric"
                                    aria-label={`Marks for ${student.name}`}
                                    onChange={(event) => {
                                      const base = draftKey === exam.id ? draft : { ...saved };
                                      setDraft({ ...base, [student.id]: event.target.value });
                                      setDraftKey(exam.id);
                                    }}
                                  />
                                </td>
                                <td>{obtained ? <Badge value={gradeFor(obtained, exam.totalMarks)} /> : "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="form-actions no-print" style={{ marginTop: 14 }}>
                    <button type="button" className="btn" onClick={saveMarks} disabled={saving || roster.length === 0}>
                      {saving ? "Saving…" : "Save marks"}
                    </button>
                  </div>
                </>
              ) : null}
            </>
          )}
          {error ? <p className="form-error">{error}</p> : null}
        </div>
      </div>
    </>
  );
}
