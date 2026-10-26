import { readActor } from "./admin-auth";
import { uid } from "./format";
import { postOffice } from "./office-post";
import { recordLog } from "./office-log";

export type BinKind = "roster" | "register-student" | "staff";

export type BinItem = {
  id: string;
  kind: BinKind;
  name: string;
  detail: string;
  removedAt: string;
  removedBy: string;
  payload: unknown;
};

const STORAGE_KEY = "whitehall-recycle-bin-v1";
const KEEP_MS = 14 * 24 * 60 * 60 * 1000;

function readBin(): BinItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Partial<BinItem>;
      if (!row.id || !row.kind || !row.name || !row.removedAt) return [];
      if (row.kind !== "roster" && row.kind !== "register-student" && row.kind !== "staff") return [];
      return [
        {
          id: String(row.id),
          kind: row.kind,
          name: String(row.name),
          detail: String(row.detail || ""),
          removedAt: String(row.removedAt),
          removedBy: String(row.removedBy || "Admin"),
          payload: row.payload,
        },
      ];
    });
  } catch {
    return [];
  }
}

function writeBin(items: BinItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function sharedPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const copy = { ...(payload as Record<string, unknown>) };
  delete copy.password;
  delete copy.passwordHash;
  if (typeof copy.photo === "string" && copy.photo.startsWith("data:")) delete copy.photo;
  const text = JSON.stringify(copy);
  return text.length > 40000 ? JSON.stringify({ id: copy.id, name: copy.name }) : text;
}

export function recycleRow(item: BinItem) {
  return {
    Id: item.id,
    Kind: item.kind,
    Name: item.name,
    Detail: item.detail,
    "Removed at": item.removedAt,
    "Removed by": item.removedBy,
    Payload: sharedPayload(item.payload),
  };
}

export function replaceBin(items: BinItem[]) {
  writeBin(items);
}

export function daysLeft(removedAt: string) {
  const end = new Date(removedAt).getTime() + KEEP_MS;
  if (Number.isNaN(end)) return 0;
  return Math.max(0, Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000)));
}

export function loadBin() {
  return readBin().filter((item) => daysLeft(item.removedAt) > 0);
}

export function purgeBin() {
  const items = readBin();
  const kept: BinItem[] = [];
  const dropped: BinItem[] = [];
  for (const item of items) {
    if (daysLeft(item.removedAt) > 0) kept.push(item);
    else dropped.push(item);
  }
  if (dropped.length) {
    writeBin(kept);
    postOffice("recycle", "delete", [], dropped.map((item) => item.id));
    for (const item of dropped) recordLog("Recycle bin", `${item.name} left the recycle bin after 14 days.`);
  }
  return kept;
}

export function holdItem(input: { kind: BinKind; name: string; detail: string; payload: unknown }) {
  const item: BinItem = {
    id: uid(),
    kind: input.kind,
    name: input.name,
    detail: input.detail,
    removedAt: new Date().toISOString(),
    removedBy: readActor().name,
    payload: input.payload,
  };
  writeBin([item, ...loadBin()]);
  postOffice("recycle", "upsert", [recycleRow(item)]);
  return item;
}

export function takeBinItem(id: string) {
  const items = loadBin();
  const item = items.find((row) => row.id === id) || null;
  if (!item) return null;
  writeBin(items.filter((row) => row.id !== id));
  postOffice("recycle", "delete", [], [id]);
  return item;
}
