"use client";

import Link from "next/link";
import { useState } from "react";
import { useSchool } from "@/components/school-context";
import { Field, PageHead } from "@/components/ui";
import {
  ADMISSION_CLASSES,
  LAST_CLASSES,
  blankAdmission,
  registerClassName,
  submitAdmission,
  type AdmissionForm,
} from "@/lib/admission-form";
import { nextSerial, todayParts, uid } from "@/lib/format";
import { ADMISSION_ACCOUNT, ADMISSION_SHEET_URL, DRIVE_FOLDER_URL } from "@/lib/school-links";

export default function AdmissionPage() {
  const school = useSchool();
  const [form, setForm] = useState<AdmissionForm>(blankAdmission);
  const [parentFatherTouched, setParentFatherTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedNo, setSavedNo] = useState("");

  function set<K extends keyof AdmissionForm>(key: K, value: AdmissionForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setFatherName(value: string) {
    setForm((current) => ({
      ...current,
      fatherName: value,
      parentFatherName: parentFatherTouched ? current.parentFatherName : value,
    }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const admissionNo = nextSerial(
      school.students.map((student) => student.admissionNo),
      "WH-",
      3,
    );
    try {
      await submitAdmission(form);
      const notes = [
        form.formB ? `Form-B: ${form.formB}` : "",
        form.fatherCnic ? `Father CNIC: ${form.fatherCnic}` : "",
        form.guardianName ? `Guardian: ${form.guardianName}` : "",
        form.emergency ? `Emergency: ${form.emergency}` : "",
        form.admissionFee ? `Admission fee: Rs ${form.admissionFee}` : "",
        form.remarks,
      ]
        .filter(Boolean)
        .join("\n");
      await school.upsert("students", [
        {
          id: uid(),
          admissionNo,
          name: form.studentName.trim(),
          fatherName: form.fatherName.trim(),
          gender: form.gender,
          dateOfBirth: form.dateOfBirth,
          className: registerClassName(form.classOfAdmission),
          section: "A",
          rollNo: "",
          phone: form.phone.trim(),
          address: form.address.trim(),
          admissionDate: todayParts().iso,
          monthlyFee: form.tuitionFee.trim(),
          status: "Active",
          notes,
        },
      ]);
      setSavedNo(admissionNo);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The admission was not saved.");
    } finally {
      setSaving(false);
    }
  }

  if (savedNo) {
    return (
      <>
        <PageHead
          kicker="Admissions"
          title="Saved"
          lede={`${form.studentName.trim()} is on the admission sheet and in this browser as ${savedNo}.`}
        />
        <section className="card stack">
          <p>
            Open the{" "}
            <a href={ADMISSION_SHEET_URL} target="_blank" rel="noreferrer">
              admission sheet
            </a>{" "}
            on {ADMISSION_ACCOUNT}. Form-B, photos, and other papers go in the{" "}
            <a href={DRIVE_FOLDER_URL} target="_blank" rel="noreferrer">
              school Drive folder
            </a>
            .
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="btn"
              onClick={() => {
                setForm(blankAdmission());
                setParentFatherTouched(false);
                setSavedNo("");
              }}
            >
              Another admission
            </button>
            <Link className="btn secondary" href="/students">
              Student list
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHead
        kicker="Academic session 2026-2027"
        title="Admission form"
        lede="Each admission is written to the Whitehall sheet. A short copy also stays in this browser so attendance and fees can use it."
        action={
          <a className="btn secondary" href={DRIVE_FOLDER_URL} target="_blank" rel="noreferrer">
            School Drive
          </a>
        }
      />
      <form className="stack" onSubmit={onSubmit}>
        <section className="card stack">
          <h2>Student profile</h2>
          <div className="form-grid">
            <Field label="Student name">
              <input value={form.studentName} onChange={(event) => set("studentName", event.target.value)} required />
            </Field>
            <Field label="Father name">
              <input value={form.fatherName} onChange={(event) => setFatherName(event.target.value)} required />
            </Field>
            <Field label="Gender">
              <select value={form.gender} onChange={(event) => set("gender", event.target.value)} required>
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </Field>
            <Field label="Date of birth (Form-B)">
              <input type="date" value={form.dateOfBirth} onChange={(event) => set("dateOfBirth", event.target.value)} />
            </Field>
            <Field label="Form-B no.">
              <input value={form.formB} onChange={(event) => set("formB", event.target.value)} />
            </Field>
            <Field label="Class of admission">
              <select
                value={form.classOfAdmission}
                onChange={(event) => set("classOfAdmission", event.target.value)}
                required
              >
                <option value="">Select</option>
                {ADMISSION_CLASSES.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </Field>
            <Field label="Place of birth">
              <input value={form.placeOfBirth} onChange={(event) => set("placeOfBirth", event.target.value)} />
            </Field>
            <Field label="Age">
              <input
                value={form.age}
                onChange={(event) => set("age", event.target.value)}
                placeholder="8 years"
                required
              />
            </Field>
            <Field label="Nationality">
              <select value={form.nationality} onChange={(event) => set("nationality", event.target.value)} required>
                <option>Pakistani</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Religion">
              <select value={form.religion} onChange={(event) => set("religion", event.target.value)} required>
                <option>Islam</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Native language">
              <select value={form.language} onChange={(event) => set("language", event.target.value)} required>
                <option>Pashto</option>
                <option>Urdu</option>
                <option>Other</option>
              </select>
            </Field>
          </div>
        </section>

        <section className="card stack">
          <h2>Parent / guardian</h2>
          <div className="form-grid">
            <Field label="Father's name">
              <input
                value={form.parentFatherName}
                onChange={(event) => {
                  setParentFatherTouched(true);
                  set("parentFatherName", event.target.value);
                }}
                required
              />
            </Field>
            <Field label="Father's CNIC">
              <input value={form.fatherCnic} onChange={(event) => set("fatherCnic", event.target.value)} required />
            </Field>
            <Field label="Occupation">
              <input value={form.occupation} onChange={(event) => set("occupation", event.target.value)} />
            </Field>
            <Field label="Monthly income">
              <input value={form.income} onChange={(event) => set("income", event.target.value)} inputMode="numeric" />
            </Field>
            <Field label="Guardian's name">
              <input value={form.guardianName} onChange={(event) => set("guardianName", event.target.value)} required />
            </Field>
            <Field label="Guardian's CNIC">
              <input value={form.guardianCnic} onChange={(event) => set("guardianCnic", event.target.value)} />
            </Field>
            <Field label="Primary contact">
              <input value={form.phone} onChange={(event) => set("phone", event.target.value)} inputMode="tel" required />
            </Field>
            <Field label="Emergency / WhatsApp">
              <input
                value={form.emergency}
                onChange={(event) => set("emergency", event.target.value)}
                inputMode="tel"
                required
              />
            </Field>
            <div className="span-2">
              <Field label="Residential address">
                <textarea value={form.address} onChange={(event) => set("address", event.target.value)} required />
              </Field>
            </div>
          </div>
        </section>

        <section className="card stack">
          <h2>Academic background</h2>
          <div className="form-grid">
            <Field label="Last school attended">
              <input value={form.lastSchool} onChange={(event) => set("lastSchool", event.target.value)} />
            </Field>
            <Field label="Last class">
              <select value={form.lastClass} onChange={(event) => set("lastClass", event.target.value)}>
                <option value="">Select</option>
                {LAST_CLASSES.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </Field>
            <Field label="City / district">
              <input value={form.city} onChange={(event) => set("city", event.target.value)} />
            </Field>
            <Field label="Last grade / percentage">
              <input value={form.lastGrade} onChange={(event) => set("lastGrade", event.target.value)} />
            </Field>
            <div className="span-2">
              <Field label="Reason for leaving">
                <input value={form.reason} onChange={(event) => set("reason", event.target.value)} />
              </Field>
            </div>
          </div>
        </section>

        <section className="card stack">
          <h2>Medical history</h2>
          <div className="form-grid">
            <Field label="Blood group">
              <input value={form.bloodGroup} onChange={(event) => set("bloodGroup", event.target.value)} />
            </Field>
            <Field label="Allergies">
              <input value={form.allergies} onChange={(event) => set("allergies", event.target.value)} />
            </Field>
            <div className="span-2">
              <Field label="Physical disability / special needs">
                <input value={form.disability} onChange={(event) => set("disability", event.target.value)} />
              </Field>
            </div>
          </div>
        </section>

        <section className="card stack">
          <h2>Fee details</h2>
          <div className="form-grid">
            <Field label="Admission / registration fee (Rs)">
              <input
                value={form.admissionFee}
                onChange={(event) => set("admissionFee", event.target.value)}
                inputMode="numeric"
                required
              />
            </Field>
            <Field label="Tuition fee (Rs)">
              <input
                value={form.tuitionFee}
                onChange={(event) => set("tuitionFee", event.target.value)}
                inputMode="numeric"
                required
              />
            </Field>
            <div className="span-2">
              <Field label="Remarks">
                <textarea value={form.remarks} onChange={(event) => set("remarks", event.target.value)} required />
              </Field>
            </div>
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="form-actions">
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save admission"}
            </button>
            <a className="btn secondary" href={ADMISSION_SHEET_URL} target="_blank" rel="noreferrer">
              Open sheet
            </a>
          </div>
        </section>
      </form>
    </>
  );
}
