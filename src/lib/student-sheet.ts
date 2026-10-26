import { cleanProfile, type AdmissionForm } from "./admission-form";
import { STUDENT_SHEET_TOKEN, STUDENT_SYNC_URL } from "./school-links";

export type StudentSheetRow = {
  registrationNo: string;
  studentName: string;
  fatherName: string;
  className: string;
  rollNo: string;
  profile?: AdmissionForm;
  photoName: string;
  photoPending?: boolean;
  editedBy: string;
  editedAt: string;
  remove?: boolean;
};

export type SharedStudent = {
  registrationNo: string;
  studentName: string;
  fatherName: string;
  className: string;
  rollNo: string;
  profile?: AdmissionForm;
  photo: string;
  editedBy: string;
  editedAt: string;
};

/** Posts one student into the Students sheet. The page cannot read the reply. */
export function storeStudentDetails(row: StudentSheetRow) {
  if (!STUDENT_SYNC_URL || !row.registrationNo.trim()) return;
  const frameName = "whitehall-student-sheet";
  let frame = document.getElementById(frameName) as HTMLIFrameElement | null;
  if (!frame) {
    frame = document.createElement("iframe");
    frame.id = frameName;
    frame.name = frameName;
    frame.hidden = true;
    frame.title = "Students sheet";
    document.body.appendChild(frame);
  }

  const element = document.createElement("form");
  element.method = "POST";
  element.action = STUDENT_SYNC_URL;
  element.target = frameName;
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "payload";
  input.value = JSON.stringify({ token: STUDENT_SHEET_TOKEN, ...row });
  element.appendChild(input);
  document.body.appendChild(element);
  element.submit();
  element.remove();
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readShared(value: unknown): SharedStudent | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<SharedStudent>;
  const registrationNo = text(row.registrationNo);
  if (!registrationNo) return null;
  return {
    registrationNo,
    studentName: text(row.studentName),
    fatherName: text(row.fatherName),
    className: text(row.className),
    rollNo: text(row.rollNo),
    profile: cleanProfile(row.profile),
    photo: text(row.photo),
    editedBy: text(row.editedBy),
    editedAt: text(row.editedAt),
  };
}

/** Reads every student from the Students sheet so each signed-in computer shows the same record. */
export function loadStudentSheet() {
  if (!STUDENT_SYNC_URL || typeof document === "undefined") return Promise.resolve([] as SharedStudent[]);
  return new Promise<SharedStudent[]>((resolve, reject) => {
    const callback = `whStudents_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const host = window as unknown as Record<string, ((payload: { students?: unknown }) => void) | undefined>;
    const script = document.createElement("script");
    let settled = false;
    const timer = window.setTimeout(() => finish(() => reject(new Error("The Students sheet did not load."))), 20000);

    function finish(done: () => void) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      script.remove();
      delete host[callback];
      done();
    }

    host[callback] = (payload) => {
      const list = Array.isArray(payload?.students) ? payload.students : [];
      finish(() => resolve(list.flatMap((item) => {
        const row = readShared(item);
        return row ? [row] : [];
      })));
    };
    script.onerror = () => finish(() => reject(new Error("The Students sheet did not load.")));
    script.src = `${STUDENT_SYNC_URL}?token=${encodeURIComponent(STUDENT_SHEET_TOKEN)}&list=1&callback=${callback}&_=${Date.now()}`;
    document.body.appendChild(script);
  });
}
