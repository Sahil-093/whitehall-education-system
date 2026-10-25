import { RESULTS_SHEET_GID, RESULTS_SHEET_ID } from "./school-links";

export type SheetResult = {
  timestamp: string;
  className: string;
  subject: string;
  name: string;
  obtained: string;
};

type GvizCell = { v?: unknown; f?: string } | null;

type GvizPayload = {
  status: string;
  table: {
    cols: { label: string }[];
    rows: { c: GvizCell[] }[];
  };
};

export function loadResultSheet() {
  return new Promise<SheetResult[]>((resolve, reject) => {
    const callbackName = `whResultSheet_${Date.now()}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("The results sheet took too long."));
    }, 15000);

    function cleanup() {
      window.clearTimeout(timeout);
      delete (window as unknown as Record<string, unknown>)[callbackName];
      script.remove();
    }

    (window as unknown as Record<string, (payload: GvizPayload) => void>)[callbackName] = (payload) => {
      cleanup();
      if (!payload || payload.status !== "ok") {
        reject(new Error("The results sheet could not be read."));
        return;
      }
      const labels = payload.table.cols.map((column) => column.label);
      const rows = payload.table.rows
        .map((row) => {
          const cell = (label: string) => {
            const item = row.c?.[labels.indexOf(label)];
            if (!item) return "";
            return String(item.f ?? item.v ?? "").trim();
          };
          return {
            timestamp: cell("Timestamp"),
            className: cell("Class"),
            subject: cell("Subject"),
            name: cell("Name"),
            obtained: cell("Obtained Marks"),
          };
        })
        .filter((row) => row.name || row.subject || row.className);
      resolve(rows);
    };

    const query = `out:json;responseHandler:${callbackName}`;
    script.src = `https://docs.google.com/spreadsheets/d/${RESULTS_SHEET_ID}/gviz/tq?tqx=${encodeURIComponent(query)}&gid=${RESULTS_SHEET_GID}&_=${Date.now()}`;
    script.onerror = () => {
      cleanup();
      reject(new Error("The results sheet did not load."));
    };
    document.body.appendChild(script);
  });
}
