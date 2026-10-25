"use client";

import { useState } from "react";
import { useSchool } from "@/components/school-context";
import { Field, PageHead } from "@/components/ui";
import { backupRegister } from "@/lib/browser-register";
import {
  ADMISSION_ACCOUNT,
  ADMISSION_SHEET_URL,
  DRIVE_FOLDER_URL,
  RESULTS_SHEET_URL,
  STAFF_SHEET_URL,
} from "@/lib/school-links";
import type { SchoolSettings } from "@/lib/types";

export default function SettingsPage() {
  const school = useSchool();
  const [form, setForm] = useState<SchoolSettings>(school.settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function set<K extends keyof SchoolSettings>(key: K, value: SchoolSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await school.saveSettings(form);
      setMessage("School details saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Details were not saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHead
        kicker="Campus record"
        title="Settings"
        lede="School details and a backup of the Karak register. The live site keeps records in this browser."
      />
      <div className="split">
        <form className="card stack" onSubmit={onSubmit}>
          <h2>School</h2>
          <Field label="School name">
            <input value={form.schoolName} onChange={(event) => set("schoolName", event.target.value)} required />
          </Field>
          <Field label="Campus">
            <input value={form.campus} onChange={(event) => set("campus", event.target.value)} />
          </Field>
          <Field label="Province">
            <input value={form.province} onChange={(event) => set("province", event.target.value)} />
          </Field>
          <Field label="Address">
            <textarea value={form.address} onChange={(event) => set("address", event.target.value)} />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={(event) => set("phone", event.target.value)} inputMode="tel" />
          </Field>
          <Field label="Academic year">
            <input value={form.academicYear} onChange={(event) => set("academicYear", event.target.value)} />
          </Field>
          {message ? <p className="lede">{message}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save details"}
          </button>
        </form>
        <section className="card help">
          <p className="page-kicker">This browser</p>
          <h2>Backup</h2>
          <p>
            Register ka backup is browser mein rehta hai. Nayi admission Google Sheet par likhi jati hai
            ({ADMISSION_ACCOUNT}). Browser clear karne se local register khatam ho sakta hai, is liye backup
            rakhain.
          </p>
          <p>
            Admission sheet:{" "}
            <a href={ADMISSION_SHEET_URL} target="_blank" rel="noreferrer">
              Whitehall Admission Form (Responses)
            </a>
          </p>
          <p>
            School Drive:{" "}
            <a href={DRIVE_FOLDER_URL} target="_blank" rel="noreferrer">
              Whitehall Education System
            </a>
          </p>
          <p>
            Results sheet:{" "}
            <a href={RESULTS_SHEET_URL} target="_blank" rel="noreferrer">
              Result October 2026
            </a>
          </p>
          <p>
            Staff sheet:{" "}
            <a href={STAFF_SHEET_URL} target="_blank" rel="noreferrer">
              Whitehall Education System — Staff
            </a>
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="btn"
              onClick={() => {
                const blob = new Blob([backupRegister()], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "whitehall-karak-register.json";
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download backup
            </button>
            <label className="btn secondary">
              Restore backup
              <input
                type="file"
                accept="application/json,.json"
                hidden
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  setError("");
                  setMessage("");
                  try {
                    await school.restore(await file.text());
                    setMessage("Backup restored in this browser.");
                  } catch (caught) {
                    setError(caught instanceof Error ? caught.message : "Backup could not be restored.");
                  }
                }}
              />
            </label>
          </div>
        </section>
      </div>
    </>
  );
}
