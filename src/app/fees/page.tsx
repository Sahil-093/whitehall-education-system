"use client";

import { useState } from "react";
import { useSchool } from "@/components/school-context";
import { Badge, Drawer, Empty, Field, PageHead, StatStrip } from "@/components/ui";
import { classLabel, compareClass, displayDate, money, MONTHS, nextSerial, num, todayParts } from "@/lib/format";
import type { Fee } from "@/lib/types";

export default function FeesPage() {
  const school = useSchool();
  const today = todayParts();
  const [month, setMonth] = useState(today.month);
  const [year, setYear] = useState(today.year);
  const [classFilter, setClassFilter] = useState("");
  const [receiving, setReceiving] = useState<Fee | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const slips = school.fees
    .filter((fee) => fee.month === month && fee.year === year)
    .filter((fee) => !classFilter || `${fee.className}|${fee.section}` === classFilter)
    .sort((a, b) => compareClass(a, b) || a.studentName.localeCompare(b.studentName));

  const billed = slips.reduce((sum, fee) => sum + num(fee.amount), 0);
  const collected = slips.reduce((sum, fee) => sum + num(fee.paidAmount), 0);
  const due = slips.reduce((sum, fee) => sum + Math.max(0, num(fee.amount) - num(fee.paidAmount)), 0);
  const classNames = Array.from(new Set(school.students.map((student) => `${student.className}|${student.section}`))).sort();

  async function createSlips() {
    setSaving(true);
    setError("");
    try {
      const existing = new Set(
        school.fees.filter((fee) => fee.month === month && fee.year === year).map((fee) => fee.studentId),
      );
      const records = school.students
        .filter((student) => student.status !== "Left" && !existing.has(student.id))
        .map((student) => ({
          id: `${student.id}-${year}-${month}`,
          studentId: student.id,
          admissionNo: student.admissionNo,
          studentName: student.name,
          className: student.className,
          section: student.section,
          month,
          year,
          amount: student.monthlyFee || "0",
          paidAmount: "0",
          status: "Unpaid",
          paidDate: "",
          receiptNo: "",
          method: "",
        }));
      if (records.length === 0) {
        setError(`Every active student already has a ${month} ${year} slip.`);
        return;
      }
      await school.upsert("fees", records);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Fee slips were not created.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHead
        kicker="Accounts"
        title="Fees"
        lede="Create one slip per student for the month, then receive cash, bank, JazzCash, or EasyPaisa. Slips are saved on the Fees sheet."
        action={
          <button type="button" className="btn secondary" onClick={() => window.print()}>
            Print
          </button>
        }
      />
      <div className="filters no-print">
        <select className="select" value={month} onChange={(event) => setMonth(event.target.value)} aria-label="Month">
          {MONTHS.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        <input className="search" value={year} onChange={(event) => setYear(event.target.value)} aria-label="Year" inputMode="numeric" />
        <select className="select" value={classFilter} onChange={(event) => setClassFilter(event.target.value)} aria-label="Class">
          <option value="">All classes</option>
          {classNames.map((key) => {
            const [className, section] = key.split("|");
            return (
              <option key={key} value={key}>
                {classLabel(className, section)}
              </option>
            );
          })}
        </select>
        <button type="button" className="btn" onClick={createSlips} disabled={saving}>
          {saving ? "Creating…" : `Create ${month} dues`}
        </button>
      </div>
      <StatStrip
        items={[
          { label: "Billed", value: money(billed) },
          { label: "Collected", value: money(collected) },
          { label: "Still due", value: money(due) },
          { label: "Slips", value: String(slips.length) },
        ]}
      />
      {error ? <p className="form-error">{error}</p> : null}
      {slips.length === 0 ? (
        <Empty
          title={`No ${month} slips`}
          text="Create the month's dues from each student's monthly fee. You can still change a single slip when there is a concession."
        />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Adm no</th>
                <th>Student</th>
                <th>Class</th>
                <th>Fee</th>
                <th>Paid</th>
                <th>Status</th>
                <th className="no-print"> </th>
              </tr>
            </thead>
            <tbody>
              {slips.map((fee) => (
                <tr key={fee.id}>
                  <td className="num">{fee.admissionNo}</td>
                  <td>
                    <strong>{fee.studentName}</strong>
                    <div>{fee.receiptNo || "No receipt yet"}</div>
                  </td>
                  <td>{classLabel(fee.className, fee.section)}</td>
                  <td className="num">{money(fee.amount)}</td>
                  <td className="num">{money(fee.paidAmount)}</td>
                  <td>
                    <Badge value={fee.status} />
                  </td>
                  <td className="no-print">
                    <button type="button" className="text-btn" onClick={() => setReceiving(fee)}>
                      Receive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {receiving ? (
        <ReceiveDrawer key={receiving.id} fee={receiving} onClose={() => setReceiving(null)} />
      ) : null}
    </>
  );
}

function ReceiveDrawer({ fee, onClose }: { fee: Fee; onClose: () => void }) {
  const school = useSchool();
  const [amount, setAmount] = useState(fee.amount);
  const [paidAmount, setPaidAmount] = useState(num(fee.paidAmount) > 0 ? fee.paidAmount : fee.amount);
  const [method, setMethod] = useState(fee.method || "Cash");
  const [paidDate, setPaidDate] = useState(fee.paidDate || todayParts().iso);
  const [receiptNo, setReceiptNo] = useState(fee.receiptNo);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Fee | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const nextReceipt = receiptNo || nextSerial(school.fees.map((item) => item.receiptNo), "R-", 4);
      const next: Fee = {
        ...fee,
        amount,
        paidAmount,
        method,
        paidDate: num(paidAmount) > 0 ? paidDate : "",
        receiptNo: num(paidAmount) > 0 ? nextReceipt : "",
      };
      await school.upsert("fees", [next]);
      setReceiptNo(next.receiptNo);
      setSaved(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Payment was not saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer title="Receive fee" onClose={onClose}>
      {saved ? (
        <div className="stack">
          <div className="receipt">
            <p className="page-kicker">Fee receipt {saved.receiptNo || "—"}</p>
            <h3>{school.settings.schoolName}</h3>
            <p>{school.settings.address}</p>
            <p>
              {saved.studentName} · {saved.admissionNo}
            </p>
            <p>
              {classLabel(saved.className, saved.section)} · {saved.month} {saved.year}
            </p>
            <p>Fee {money(saved.amount)}</p>
            <p>
              <strong>Received {money(saved.paidAmount)}</strong>
            </p>
            <p>
              {saved.method || "—"} · {saved.paidDate ? displayDate(saved.paidDate) : "—"}
            </p>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn"
              onClick={() => {
                document.body.classList.add("printing-receipt");
                const cleanup = () => document.body.classList.remove("printing-receipt");
                window.addEventListener("afterprint", cleanup, { once: true });
                window.print();
              }}
            >
              Print receipt
            </button>
            <button type="button" className="btn secondary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <p>
            <strong>{fee.studentName}</strong> · {fee.month} {fee.year}
          </p>
          <Field label="Fee for this month (Rs)">
            <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" required />
          </Field>
          <Field label="Total paid (Rs)">
            <input value={paidAmount} onChange={(event) => setPaidAmount(event.target.value)} inputMode="numeric" required />
          </Field>
          <Field label="Method">
            <select value={method} onChange={(event) => setMethod(event.target.value)}>
              <option>Cash</option>
              <option>Bank transfer</option>
              <option>JazzCash</option>
              <option>EasyPaisa</option>
            </select>
          </Field>
          <Field label="Paid on">
            <input type="date" value={paidDate} onChange={(event) => setPaidDate(event.target.value)} />
          </Field>
          <Field label="Receipt no">
            <input
              value={receiptNo}
              placeholder="Left blank, the next R- number is used"
              onChange={(event) => setReceiptNo(event.target.value)}
            />
          </Field>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="form-actions">
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save payment"}
            </button>
            <button className="btn secondary" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </Drawer>
  );
}
