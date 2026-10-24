"use client";

import { useState } from "react";
import { useSchool } from "@/components/school-context";
import { Empty, Field, PageHead } from "@/components/ui";
import { classLabel, compareClass, money, STANDARD_CLASSES, uid } from "@/lib/format";
import type { SchoolClass } from "@/lib/types";

const emptyClass = (): SchoolClass => ({
  id: "",
  className: "",
  section: "A",
  classTeacher: "",
  monthlyFee: "",
  room: "",
});

export default function ClassesPage() {
  const school = useSchool();
  const [form, setForm] = useState<SchoolClass>(emptyClass);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const rooms = [...school.classes].sort(compareClass);

  function set<K extends keyof SchoolClass>(key: K, value: SchoolClass[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await school.upsert("classes", [{ ...form, id: form.id || uid(), section: form.section || "A" }]);
      setForm(emptyClass());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Class was not saved.");
    } finally {
      setSaving(false);
    }
  }

  async function addStandard() {
    setSaving(true);
    setError("");
    try {
      const missing = STANDARD_CLASSES.filter(
        (className) => !school.classes.some((room) => room.className === className && room.section === "A"),
      ).map((className) => ({
        id: uid(),
        className,
        section: "A",
        classTeacher: "",
        monthlyFee: "",
        room: "",
      }));
      if (missing.length === 0) {
        setError("Nursery to Class 10, section A, are already in the register.");
        return;
      }
      await school.upsert("classes", missing);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Classes were not added.");
    } finally {
      setSaving(false);
    }
  }

  async function removeRoom(room: SchoolClass) {
    if (!window.confirm(`Remove ${classLabel(room.className, room.section)}? Students already in it stay on the register.`)) return;
    await school.remove("classes", [room.id]);
  }

  return (
    <>
      <PageHead
        kicker="Campus"
        title="Classes"
        lede="Sections, class teacher, and the usual monthly fee. A student's own fee can still be different."
        action={
          <button type="button" className="btn secondary" onClick={addStandard} disabled={saving}>
            Add Nursery to Class 10
          </button>
        }
      />
      <form className="inline-form card no-print" onSubmit={onSubmit}>
        <Field label="Class">
          <input list="standard-classes" value={form.className} onChange={(event) => set("className", event.target.value)} required />
          <datalist id="standard-classes">
            {STANDARD_CLASSES.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </Field>
        <Field label="Section">
          <input value={form.section} onChange={(event) => set("section", event.target.value)} required />
        </Field>
        <Field label="Class teacher">
          <input value={form.classTeacher} onChange={(event) => set("classTeacher", event.target.value)} />
        </Field>
        <Field label="Monthly fee (Rs)">
          <input value={form.monthlyFee} onChange={(event) => set("monthlyFee", event.target.value)} inputMode="numeric" />
        </Field>
        <Field label="Room">
          <input value={form.room} onChange={(event) => set("room", event.target.value)} />
        </Field>
        <button className="btn" type="submit" disabled={saving}>
          {form.id ? "Update class" : "Add class"}
        </button>
        {form.id ? (
          <button className="btn secondary" type="button" onClick={() => setForm(emptyClass())}>
            Cancel edit
          </button>
        ) : null}
      </form>
      {error ? <p className="form-error">{error}</p> : null}
      {rooms.length === 0 ? (
        <Empty title="No classes yet" text="Use the button above for the usual Karak private-school ladder, or add one class yourself." />
      ) : (
        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="data">
            <thead>
              <tr>
                <th>Class</th>
                <th>Teacher</th>
                <th>Monthly fee</th>
                <th>Room</th>
                <th className="no-print"> </th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td>{classLabel(room.className, room.section)}</td>
                  <td>{room.classTeacher || "—"}</td>
                  <td className="num">{room.monthlyFee ? money(room.monthlyFee) : "—"}</td>
                  <td>{room.room || "—"}</td>
                  <td className="no-print">
                    <button type="button" className="text-btn" onClick={() => setForm(room)}>
                      Edit
                    </button>
                    {" · "}
                    <button type="button" className="text-btn danger" onClick={() => removeRoom(room)}>
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
  );
}
