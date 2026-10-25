"use client";

import { useState } from "react";
import { useSchool } from "@/components/school-context";
import { Badge, Drawer, Empty, Field, PageHead } from "@/components/ui";
import { sha256 } from "@/lib/admin-auth";
import { DESIGNATIONS, displayDate, money, todayParts, uid } from "@/lib/format";
import type { Staff } from "@/lib/types";

const blank = (): Staff => ({
  id: "",
  name: "",
  designation: "Teacher",
  phone: "",
  email: "",
  passwordHash: "",
  subject: "",
  qualification: "",
  salary: "",
  joiningDate: todayParts().iso,
  status: "Active",
});

export default function StaffPage() {
  const school = useSchool();
  const [editor, setEditor] = useState<Staff | null>(null);
  const people = [...school.staff].sort((a, b) => a.name.localeCompare(b.name));

  async function removePerson(person: Staff) {
    if (!window.confirm(`Remove ${person.name} from the staff list?`)) return;
    await school.remove("staff", [person.id]);
  }

  return (
    <>
      <PageHead
        kicker="People"
        title="Staff"
        lede="Teachers and office staff on the Karak campus. Each person signs in with the email and password saved here."
        action={
          <button type="button" className="btn" onClick={() => setEditor(blank())}>
            Add staff
          </button>
        }
      />
      {people.length === 0 ? (
        <Empty title="No staff yet" text="Add the principal and class teachers so the register knows who is on campus." />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Subject</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Salary</th>
                <th>Status</th>
                <th className="no-print"> </th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => (
                <tr key={person.id}>
                  <td>
                    <strong>{person.name}</strong>
                    <div>{person.qualification || "—"}</div>
                  </td>
                  <td>{person.designation}</td>
                  <td>{person.subject || "—"}</td>
                  <td>{person.email || "—"}</td>
                  <td>{person.phone || "—"}</td>
                  <td className="num">{person.salary ? money(person.salary) : "—"}</td>
                  <td>
                    <Badge value={person.status} />
                  </td>
                  <td className="no-print">
                    <button type="button" className="text-btn" onClick={() => setEditor(person)}>
                      Edit
                    </button>
                    {" · "}
                    <button type="button" className="text-btn danger" onClick={() => removePerson(person)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editor ? <StaffDrawer key={editor.id || "new"} initial={editor} onClose={() => setEditor(null)} /> : null}
    </>
  );
}

function StaffDrawer({ initial, onClose }: { initial: Staff; onClose: () => void }) {
  const school = useSchool();
  const [form, setForm] = useState(initial);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof Staff>(key: K, value: Staff[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (!email.includes("@")) {
      setError("Enter the staff email.");
      return;
    }
    if (!password && !form.passwordHash) {
      setError("Set a login password for this staff member.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const passwordHash = password ? await sha256(password) : form.passwordHash;
      await school.upsert("staff", [{ ...form, email, passwordHash, id: form.id || uid() }]);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Staff was not saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer title={initial.id ? "Edit staff" : "Add staff"} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <Field label="Name">
          <input value={form.name} onChange={(event) => set("name", event.target.value)} required />
        </Field>
        <Field label="Role">
          <input list="roles" value={form.designation} onChange={(event) => set("designation", event.target.value)} required />
          <datalist id="roles">
            {DESIGNATIONS.map((role) => (
              <option key={role} value={role} />
            ))}
          </datalist>
        </Field>
        <Field label="Subject">
          <input value={form.subject} onChange={(event) => set("subject", event.target.value)} />
        </Field>
        <Field label="Qualification">
          <input value={form.qualification} onChange={(event) => set("qualification", event.target.value)} />
        </Field>
        <Field label="Phone">
          <input value={form.phone} onChange={(event) => set("phone", event.target.value)} inputMode="tel" />
        </Field>
        <Field label="Login email">
          <input
            type="email"
            value={form.email}
            onChange={(event) => set("email", event.target.value)}
            autoComplete="off"
            required
          />
        </Field>
        <Field label="Login password">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required={!form.passwordHash}
          />
        </Field>
        {form.passwordHash ? <p className="lede">Leave the password blank to keep the current one.</p> : null}
        <Field label="Monthly salary (Rs)">
          <input value={form.salary} onChange={(event) => set("salary", event.target.value)} inputMode="numeric" />
        </Field>
        <Field label="Joined">
          <input type="date" value={form.joiningDate} onChange={(event) => set("joiningDate", event.target.value)} />
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={(event) => set("status", event.target.value)}>
            <option>Active</option>
            <option>Left</option>
          </select>
        </Field>
        {form.joiningDate ? <p className="lede">Joined {displayDate(form.joiningDate)}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
        <div className="form-actions">
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save staff"}
          </button>
          <button className="btn secondary" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Drawer>
  );
}
