import type { AdmissionForm } from "./admission-form";
import { STUDENT_SHEET_TOKEN, STUDENT_SYNC_URL } from "./school-links";

export type StudentSheetRow = {
  registrationNo: string;
  studentName: string;
  fatherName: string;
  className: string;
  rollNo: string;
  profile?: AdmissionForm;
  photoName: string;
  editedBy: string;
  editedAt: string;
  remove?: boolean;
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
