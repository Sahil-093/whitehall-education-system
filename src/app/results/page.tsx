"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Empty, PageHead } from "@/components/ui";
import { gradeFor } from "@/lib/format";
import { loadResultSheet, type SheetResult } from "@/lib/results-sheet";
import { RESULTS_SHEET_URL } from "@/lib/school-links";

export default function ResultsPage() {
  const [rows, setRows] = useState<SheetResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    loadResultSheet()
      .then((next) => {
        if (active) setRows(next);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "The results sheet did not load.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const classes = useMemo(
    () => Array.from(new Set(rows.map((row) => row.className).filter(Boolean))).sort(),
    [rows],
  );
  const subjects = useMemo(
    () => Array.from(new Set(rows.map((row) => row.subject).filter(Boolean))).sort(),
    [rows],
  );
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (className && row.className !== className) return false;
        if (subject && row.subject !== subject) return false;
        if (!needle) return true;
        return `${row.name} ${row.className} ${row.subject}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => a.className.localeCompare(b.className) || a.subject.localeCompare(b.subject) || a.name.localeCompare(b.name));
  }, [rows, className, subject, query]);

  return (
    <>
      <PageHead
        kicker="October 2026"
        title="Results"
        lede="Marks on this page come from the Result October 2026 sheet. Grades use 100 as the total: A+ from 90, then A, B, C, D, and F below 50."
        action={
          <a className="btn secondary" href={RESULTS_SHEET_URL} target="_blank" rel="noreferrer">
            Open sheet
          </a>
        }
      />
      <div className="filters no-print">
        <input
          className="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search student, class, subject"
          aria-label="Search results"
        />
        <select className="select" value={className} onChange={(event) => setClassName(event.target.value)} aria-label="Filter by class">
          <option value="">All classes</option>
          {classes.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        <select className="select" value={subject} onChange={(event) => setSubject(event.target.value)} aria-label="Filter by subject">
          <option value="">All subjects</option>
          {subjects.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        <button type="button" className="btn secondary" onClick={() => window.print()}>
          Print
        </button>
      </div>
      {loading ? <p className="opening">Opening the results sheet…</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {!loading && !error && shown.length === 0 ? (
        <Empty
          title={rows.length === 0 ? "No marks on the sheet yet" : "Nothing matches"}
          text={
            rows.length === 0
              ? "Add a row on the Result October 2026 sheet. This page will show it."
              : "Try another class or subject."
          }
        />
      ) : null}
      {shown.length > 0 ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Obtained</th>
                <th>Grade</th>
                <th>Entered</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row, index) => (
                <tr key={`${row.timestamp}-${row.name}-${row.subject}-${index}`}>
                  <td>
                    <strong>{row.name || "—"}</strong>
                  </td>
                  <td>{row.className || "—"}</td>
                  <td>{row.subject || "—"}</td>
                  <td className="num">{row.obtained || "—"}</td>
                  <td>{row.obtained ? <Badge value={gradeFor(row.obtained, "100")} /> : "—"}</td>
                  <td>{row.timestamp || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
