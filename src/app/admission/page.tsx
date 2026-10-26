"use client";

import Link from "next/link";
import { useState } from "react";
import { AdmissionFields } from "@/components/admission-fields";
import { useSchool } from "@/components/school-context";
import { PageHead } from "@/components/ui";
import { blankAdmission, registerClassName, submitAdmission, type AdmissionForm } from "@/lib/admission-form";
import { nextSerial, todayParts, uid } from "@/lib/format";
import { ADMISSION_ACCOUNT, ADMISSION_SHEET_URL, DRIVE_FOLDER_URL } from "@/lib/school-links";

export default function AdmissionPage() {
  const school = useSchool();
  const [form, setForm] = useState<AdmissionForm>(blankAdmission);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedNo, setSavedNo] = useState("");

  function set<K extends keyof AdmissionForm>(key: K, value: AdmissionForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
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
        <AdmissionFields form={form} onChange={set} required />
        {error ? <p className="form-error">{error}</p> : null}
        <div className="form-actions">
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save admission"}
          </button>
          <a className="btn secondary" href={ADMISSION_SHEET_URL} target="_blank" rel="noreferrer">
            Open sheet
          </a>
        </div>
      </form>
    </>
  );
}
