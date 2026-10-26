import type { ResultCorrection } from "./exam-sheet";

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

export function saveResultEdits(edits: Record<string, ResultCorrection>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
}
