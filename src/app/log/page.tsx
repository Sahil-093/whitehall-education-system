"use client";

import { useEffect, useState } from "react";
import { useSchool } from "@/components/school-context";
import { Empty, PageHead } from "@/components/ui";
import { formatWhen, loadLog, recordLog, type LogEntry } from "@/lib/office-log";
import { loadOfficeBooks } from "@/lib/office-adopt";
import { daysLeft, loadBin, takeBinItem, type BinItem } from "@/lib/recycle-bin";
import { loadStudentStore, saveStudentStore, type AddedStudent } from "@/lib/student-roster";
import type { Staff, Student } from "@/lib/types";

const KIND_LABEL: Record<BinItem["kind"], string> = {
  roster: "Student",
  "register-student": "Admission",
  staff: "Staff",
};

export default function LogPage() {
  const school = useSchool();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [bin, setBin] = useState<BinItem[]>([]);

  function refresh() {
    setEntries(loadLog());
    setBin(loadBin());
  }

  useEffect(() => {
    let alive = true;
    void loadOfficeBooks().finally(() => {
      if (!alive) return;
      refresh();
    });
    return () => {
      alive = false;
    };
  }, []);

  async function restore(id: string) {
    const item = takeBinItem(id);
    if (!item || !item.payload || typeof item.payload !== "object") return;
    if (item.kind === "roster") {
      const student = item.payload as AddedStudent;
      const store = loadStudentStore();
      if (student.id && student.name && !store.added.some((row) => row.id === student.id)) {
        saveStudentStore({ ...store, added: [...store.added, student] });
      }
    } else if (item.kind === "register-student") {
      await school.upsert("students", [item.payload as Student]);
    } else {
      await school.upsert("staff", [item.payload as Staff]);
    }
    recordLog("Restored", `${item.name} from the recycle bin`);
    refresh();
  }

  return (
    <>
      <PageHead
        kicker="Office"
        title="Log"
        lede="Every sign-in, save, update, and removal is written to the Log sheet. A removed record stays in the recycle bin for 14 days, then it is cleared."
      />
      {entries.length === 0 ? (
        <Empty title="No steps yet" text="Saves, edits, and removals will appear in this list." />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>When</th>
                <th>By</th>
                <th>Step</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatWhen(entry.at, true)}</td>
                  <td>{entry.actor}</td>
                  <td>{entry.action}</td>
                  <td>{entry.detail || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="section-title">Recycle bin</h2>
      <p className="edit-note">Removed students and staff stay here for 14 days. Restore puts the record back.</p>
      {bin.length === 0 ? (
        <Empty title="Recycle bin is empty" text="Removed records will wait here for 14 days." />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Record</th>
                <th>Removed by</th>
                <th>Removed</th>
                <th>Days left</th>
                <th className="no-print"> </th>
              </tr>
            </thead>
            <tbody>
              {bin.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    {item.detail ? <div>{item.detail}</div> : null}
                  </td>
                  <td>{KIND_LABEL[item.kind]}</td>
                  <td>{item.removedBy}</td>
                  <td>{formatWhen(item.removedAt, true)}</td>
                  <td className="num">{daysLeft(item.removedAt)}</td>
                  <td className="no-print">
                    <button type="button" className="text-btn" onClick={() => void restore(item.id)}>
                      Restore
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
