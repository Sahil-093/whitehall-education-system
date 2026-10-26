"use client";

import { useState } from "react";
import { ADMISSION_CLASSES, LAST_CLASSES, type AdmissionForm } from "@/lib/admission-form";
import { Field } from "@/components/ui";

export function AdmissionFields({
  form,
  onChange,
  required = false,
  readOnly = false,
  allowEmptyClass = true,
  children,
}: {
  form: AdmissionForm;
  onChange: <K extends keyof AdmissionForm>(key: K, value: AdmissionForm[K]) => void;
  required?: boolean;
  readOnly?: boolean;
  allowEmptyClass?: boolean;
  children?: React.ReactNode;
}) {
  const [parentTouched, setParentTouched] = useState(
    () => Boolean(form.parentFatherName) && form.parentFatherName !== form.fatherName,
  );
  const lock = readOnly;
  const must = required && !readOnly;

  function setFatherName(value: string) {
    onChange("fatherName", value);
    if (!parentTouched) onChange("parentFatherName", value);
  }

  return (
    <div className="record-sections">
      <section className="card stack">
        <h2>Student profile</h2>
        <div className="form-grid">
          <Field label="Student name">
            <input value={form.studentName} onChange={(event) => onChange("studentName", event.target.value)} required={must} readOnly={lock} />
          </Field>
          <Field label="Father name">
            <input value={form.fatherName} onChange={(event) => setFatherName(event.target.value)} required={must} readOnly={lock} />
          </Field>
          <Field label="Gender">
            <select value={form.gender} onChange={(event) => onChange("gender", event.target.value)} required={must} disabled={lock}>
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
            </select>
          </Field>
          <Field label="Date of birth (Form-B)">
            <input type="date" value={form.dateOfBirth} onChange={(event) => onChange("dateOfBirth", event.target.value)} disabled={lock} />
          </Field>
          <Field label="Form-B no.">
            <input value={form.formB} onChange={(event) => onChange("formB", event.target.value)} readOnly={lock} />
          </Field>
          <Field label="Class of admission">
            <select
              value={form.classOfAdmission}
              onChange={(event) => onChange("classOfAdmission", event.target.value)}
              required={must}
              disabled={lock}
            >
              {allowEmptyClass ? <option value="">Select</option> : null}
              {ADMISSION_CLASSES.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </Field>
          {children}
          <Field label="Place of birth">
            <input value={form.placeOfBirth} onChange={(event) => onChange("placeOfBirth", event.target.value)} readOnly={lock} />
          </Field>
          <Field label="Age">
            <input value={form.age} onChange={(event) => onChange("age", event.target.value)} placeholder="8 years" required={must} readOnly={lock} />
          </Field>
          <Field label="Nationality">
            <select value={form.nationality} onChange={(event) => onChange("nationality", event.target.value)} required={must} disabled={lock}>
              {must ? null : <option value="">Select</option>}
              <option>Pakistani</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="Religion">
            <select value={form.religion} onChange={(event) => onChange("religion", event.target.value)} required={must} disabled={lock}>
              {must ? null : <option value="">Select</option>}
              <option>Islam</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="Native language">
            <select value={form.language} onChange={(event) => onChange("language", event.target.value)} required={must} disabled={lock}>
              {must ? null : <option value="">Select</option>}
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
                setParentTouched(true);
                onChange("parentFatherName", event.target.value);
              }}
              required={must}
              readOnly={lock}
            />
          </Field>
          <Field label="Father's CNIC">
            <input value={form.fatherCnic} onChange={(event) => onChange("fatherCnic", event.target.value)} required={must} readOnly={lock} />
          </Field>
          <Field label="Occupation">
            <input value={form.occupation} onChange={(event) => onChange("occupation", event.target.value)} readOnly={lock} />
          </Field>
          <Field label="Monthly income">
            <input value={form.income} onChange={(event) => onChange("income", event.target.value)} inputMode="numeric" readOnly={lock} />
          </Field>
          <Field label="Guardian's name">
            <input value={form.guardianName} onChange={(event) => onChange("guardianName", event.target.value)} required={must} readOnly={lock} />
          </Field>
          <Field label="Guardian's CNIC">
            <input value={form.guardianCnic} onChange={(event) => onChange("guardianCnic", event.target.value)} readOnly={lock} />
          </Field>
          <Field label="Primary contact">
            <input value={form.phone} onChange={(event) => onChange("phone", event.target.value)} inputMode="tel" required={must} readOnly={lock} />
          </Field>
          <Field label="Emergency / WhatsApp">
            <input value={form.emergency} onChange={(event) => onChange("emergency", event.target.value)} inputMode="tel" required={must} readOnly={lock} />
          </Field>
          <div className="span-2">
            <Field label="Residential address">
              <textarea value={form.address} onChange={(event) => onChange("address", event.target.value)} required={must} readOnly={lock} />
            </Field>
          </div>
        </div>
      </section>

      <section className="card stack">
        <h2>Academic background</h2>
        <div className="form-grid">
          <Field label="Last school attended">
            <input value={form.lastSchool} onChange={(event) => onChange("lastSchool", event.target.value)} readOnly={lock} />
          </Field>
          <Field label="Last class">
            <select value={form.lastClass} onChange={(event) => onChange("lastClass", event.target.value)} disabled={lock}>
              <option value="">Select</option>
              {LAST_CLASSES.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </Field>
          <Field label="City / district">
            <input value={form.city} onChange={(event) => onChange("city", event.target.value)} readOnly={lock} />
          </Field>
          <Field label="Last grade / percentage">
            <input value={form.lastGrade} onChange={(event) => onChange("lastGrade", event.target.value)} readOnly={lock} />
          </Field>
          <div className="span-2">
            <Field label="Reason for leaving">
              <input value={form.reason} onChange={(event) => onChange("reason", event.target.value)} readOnly={lock} />
            </Field>
          </div>
        </div>
      </section>

      <section className="card stack">
        <h2>Medical history</h2>
        <div className="form-grid">
          <Field label="Blood group">
            <input value={form.bloodGroup} onChange={(event) => onChange("bloodGroup", event.target.value)} readOnly={lock} />
          </Field>
          <Field label="Allergies">
            <input value={form.allergies} onChange={(event) => onChange("allergies", event.target.value)} readOnly={lock} />
          </Field>
          <div className="span-2">
            <Field label="Physical disability / special needs">
              <input value={form.disability} onChange={(event) => onChange("disability", event.target.value)} readOnly={lock} />
            </Field>
          </div>
        </div>
      </section>

      <section className="card stack">
        <h2>Fee details</h2>
        <div className="form-grid">
          <Field label="Admission / registration fee (Rs)">
            <input value={form.admissionFee} onChange={(event) => onChange("admissionFee", event.target.value)} inputMode="numeric" required={must} readOnly={lock} />
          </Field>
          <Field label="Tuition fee (Rs)">
            <input value={form.tuitionFee} onChange={(event) => onChange("tuitionFee", event.target.value)} inputMode="numeric" required={must} readOnly={lock} />
          </Field>
          <div className="span-2">
            <Field label="Remarks">
              <textarea value={form.remarks} onChange={(event) => onChange("remarks", event.target.value)} required={must} readOnly={lock} />
            </Field>
          </div>
        </div>
      </section>
    </div>
  );
}
