import type { ResultCorrection } from "./exam-sheet";
import { postOffice } from "./office-post";

const STORAGE_KEY = "whitehall-result-edits-v1";

export function loadResultEdits(): Record<string, ResultCorrection> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, ResultCorrection>;
  } catch {
    return {};
  }
}

export function correctionRow(key: string, edit: ResultCorrection) {
  return {
    Key: key,
    Name: edit.name,
    "Roll no": edit.rollNo,
    "Father name": edit.fatherName,
    "Registration no": edit.registrationNo,
    "Date of issue": edit.dateOfIssue,
    Marks: JSON.stringify(edit.marks || {}),
  };
}

export function saveResultEdits(edits: Record<string, ResultCorrection>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
  postOffice("corrections", "replace", Object.entries(edits).map(([key, edit]) => correctionRow(key, edit)));
}

export function replaceResultEdits(edits: Record<string, ResultCorrection>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
}
