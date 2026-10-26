import { OFFICE_SHEET_TOKEN, OFFICE_SYNC_URL } from "./school-links";

export type OfficeSnapshot = {
  staff: Record<string, string>[];
  log: Record<string, string>[];
  recycle: Record<string, string>[];
  settings: Record<string, string> | null;
  fees: Record<string, string>[];
  attendance: Record<string, string>[];
  corrections: Record<string, string>[];
  attendanceId: string;
};

function textCell(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function rows(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row: Record<string, string> = {};
    for (const [key, cell] of Object.entries(item as Record<string, unknown>)) row[key] = textCell(cell);
    return [row];
  });
}

export function postOffice(
  book: string,
  action: "upsert" | "delete" | "replace",
  officeRows: Record<string, string>[] = [],
  ids: string[] = [],
) {
  if (!OFFICE_SYNC_URL || typeof document === "undefined") return;
  if (action !== "delete" && officeRows.length === 0 && action !== "replace") return;
  const frame = document.createElement("iframe");
  frame.hidden = true;
  frame.name = `whitehall-office-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  frame.title = "Office sheet";
  document.body.appendChild(frame);
  const form = document.createElement("form");
  form.method = "POST";
  form.action = OFFICE_SYNC_URL;
  form.target = frame.name;
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "payload";
  input.value = JSON.stringify({ token: OFFICE_SHEET_TOKEN, book, action, rows: officeRows, ids });
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  window.setTimeout(() => {
    form.remove();
    frame.remove();
  }, 20000);
}

/** Reads every office sheet so each signed-in computer can show the same records. */
export function fetchOffice(): Promise<OfficeSnapshot | null> {
  if (!OFFICE_SYNC_URL || typeof document === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const callback = `whOffice_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const host = window as unknown as Record<string, ((payload: unknown) => void) | undefined>;
    const script = document.createElement("script");
    let settled = false;
    const timer = window.setTimeout(() => finish(null), 20000);

    function finish(value: OfficeSnapshot | null) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      script.remove();
      delete host[callback];
      resolve(value);
    }

    host[callback] = (payload) => {
      const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
      const settings = body.settings && typeof body.settings === "object" ? rows([body.settings])[0] || null : null;
      finish({
        staff: rows(body.staff),
        log: rows(body.log),
        recycle: rows(body.recycle),
        settings,
        fees: rows(body.fees),
        attendance: rows(body.attendance),
        corrections: rows(body.corrections),
        attendanceId: textCell(body.attendanceId),
      });
    };
    script.onerror = () => finish(null);
    script.src = `${OFFICE_SYNC_URL}?token=${encodeURIComponent(OFFICE_SHEET_TOKEN)}&list=1&callback=${callback}&_=${Date.now()}`;
    document.body.appendChild(script);
  });
}
