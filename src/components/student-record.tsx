"use client";

import { useState } from "react";
import { AdmissionFields } from "@/components/admission-fields";
import { StudentPhoto } from "@/components/student-photo";
import { Drawer, Field } from "@/components/ui";
import { blankAdmission, type AdmissionForm } from "@/lib/admission-form";
import { photoFileName, storeStudentPhoto } from "@/lib/photo-store";
import { suggestRoll, type RosterRow } from "@/lib/student-roster";

export type StudentRecordSave = {
  name: string;
  fatherName: string;
  className: string;
  rollNo: string;
  profile: AdmissionForm;
  photo: string;
};

function formFromRow(row: RosterRow): AdmissionForm {
  if (row.profile) return { ...blankAdmission(), ...row.profile };
  return {
    ...blankAdmission(),
    studentName: row.name,
    fatherName: row.fatherName,
    parentFatherName: row.fatherName,
    classOfAdmission: row.className,
    nationality: "",
    religion: "",
    language: "",
  };
}

export function StudentRecord({
  initial,
  rows,
  startInEdit,
  onClose,
  onSave,
  onReset,
  onRemove,
}: {
  initial: RosterRow;
  rows: RosterRow[];
  startInEdit: boolean;
  onClose: () => void;
  onSave: (next: StudentRecordSave, options?: { close?: boolean }) => void;
  onReset: () => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(startInEdit);
  const [form, setForm] = useState<AdmissionForm>(() => formFromRow(initial));
  const [rollNo, setRollNo] = useState(initial.rollNo);
  const [autoRoll, setAutoRoll] = useState(initial.rollNo);
  const [photo, setPhoto] = useState(initial.photo);
  const [error, setError] = useState("");
  const [photoNote, setPhotoNote] = useState("");

  function onChange<K extends keyof AdmissionForm>(key: K, value: AdmissionForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === "classOfAdmission" && typeof value === "string" && value) {
      const suggestion = suggestRoll(value, rows, initial.id || undefined);
      setRollNo((current) => (current === autoRoll || !current.trim() ? suggestion : current));
      setAutoRoll(suggestion);
    }
  }

  function payload(nextPhoto: string): StudentRecordSave {
    const name = form.studentName.trim();
    const className = form.classOfAdmission || initial.className;
    const nextRoll = rollNo.trim() || suggestRoll(className, rows, initial.id || undefined);
    return {
      name: name || initial.name,
      fatherName: form.fatherName.trim(),
      className,
      rollNo: nextRoll,
      profile: { ...form, studentName: name || initial.name, classOfAdmission: className },
      photo: nextPhoto,
    };
  }

  function applyPhoto(nextPhoto: string) {
    setPhoto(nextPhoto);
    setError("");
    if (!initial.id && !form.studentName.trim()) {
      setPhotoNote("Add a student name, then press Save student.");
      return;
    }
    const label = [initial.registrationNo, form.studentName.trim() || initial.name].filter(Boolean).join(" ");
    try {
      onSave(payload(nextPhoto), { close: false });
      storeStudentPhoto(label, nextPhoto);
      setPhotoNote(
        nextPhoto
          ? `Photo saved in Student photos as ${photoFileName(label)}.`
          : "Photo removed from Student photos.",
      );
      setEditing(true);
    } catch (caught) {
      setPhotoNote("");
      setError(caught instanceof Error ? caught.message : "The photo could not be saved.");
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!initial.id && !form.studentName.trim()) {
      setError("Add a student name so this student appears on the list.");
      return;
    }
    try {
      onSave(payload(photo));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The student could not be saved.");
    }
  }

  return (
    <Drawer
      wide
      title={editing ? (initial.id ? `Update ${initial.name}` : "Add student") : initial.name}
      onClose={onClose}
      headerAction={
        editing ? null : (
          <button type="button" className="text-btn" onClick={() => setEditing(true)}>
            Edit
          </button>
        )
      }
    >
      <form onSubmit={submit}>
        <p className="edit-note">
          {editing
            ? "Every detail is optional for now. The roll number saved here is the one on the result list."
            : "These are the details saved for this student. Update opens the full form if something needs correcting."}
        </p>
        <StudentPhoto
          photo={photo}
          fileName={[initial.registrationNo, form.studentName.trim() || initial.name].filter(Boolean).join(" ")}
          onChange={applyPhoto}
        />
        {photoNote ? <p className="edit-note">{photoNote}</p> : null}
        <AdmissionFields form={form} onChange={onChange} readOnly={!editing} allowEmptyClass={false}>
          <Field label="Roll number">
            <input value={rollNo} onChange={(event) => setRollNo(event.target.value)} readOnly={!editing} />
          </Field>
          <Field label="Registration no.">
            <input value={initial.registrationNo} readOnly />
          </Field>
        </AdmissionFields>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="form-actions">
          {editing ? (
            <button className="btn" type="submit">
              Save student
            </button>
          ) : (
            <>
              <button className="btn" type="button" onClick={() => setEditing(true)}>
                Update
              </button>
              <button className="btn secondary" type="button" onClick={() => setEditing(true)}>
                Edit
              </button>
            </>
          )}
          {editing && initial.edited ? (
            <button className="btn secondary" type="button" onClick={onReset}>
              Use sheet again
            </button>
          ) : null}
          {editing && initial.added && initial.id ? (
            <button className="btn secondary" type="button" onClick={onRemove}>
              Remove
            </button>
          ) : null}
          <button className="btn secondary" type="button" onClick={onClose}>
            {editing ? "Cancel" : "Close"}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
