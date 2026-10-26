import type { ExamClass, ResultCorrection } from "./exam-sheet";
import { RESULT_SYNC_URL } from "./school-links";

export function resultSyncReady() {
  return Boolean(RESULT_SYNC_URL);
}

function sameMark(sheetValue: string, edited: string) {
  const left = sheetValue.trim();
  const right = edited.trim();
  if (left.toLowerCase() === right.toLowerCase()) return true;
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  return left !== "" && right !== "" && Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber === rightNumber;
}

export function postResultSync(classes: ExamClass[], edits: Record<string, ResultCorrection>) {
  if (!RESULT_SYNC_URL) return false;
  const payload = {
    classes: classes
      .filter((room) => room.students.some((student) => edits[student.sheetKey]))
      .map((room) => ({
        tab: room.tab,
        students: room.students.map((student) => {
          const [rollNo = "", name = ""] = student.sheetKey.split("\u001f").slice(1);
          const edit = edits[student.sheetKey];
          return {
            matchRoll: rollNo,
            matchName: name,
            position: student.position,
            ...(edit
              ? {
                  rollNo: student.rollNo,
                  name: student.name,
                  marks: Object.fromEntries(student.marks.map((mark) => [mark.subject, mark.value])),
                }
              : {}),
          };
        }),
      })),
  };
  if (payload.classes.length === 0) return false;

  const frameName = "whitehall-result-sync";
  let frame = document.getElementById(frameName) as HTMLIFrameElement | null;
  if (!frame) {
    frame = document.createElement("iframe");
    frame.id = frameName;
    frame.name = frameName;
    frame.hidden = true;
    frame.title = "Result sheet";
    document.body.appendChild(frame);
  }
  const form = document.createElement("form");
  form.method = "POST";
  form.action = RESULT_SYNC_URL;
  form.target = frameName;
  form.acceptCharset = "UTF-8";
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "payload";
  input.value = JSON.stringify(payload);
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  form.remove();
  return true;
}

export function editsAfterSync(edits: Record<string, ResultCorrection>, classes: ExamClass[]) {
  const next: Record<string, ResultCorrection> = {};
  for (const [key, edit] of Object.entries(edits)) {
    const [className = ""] = key.split("\u001f");
    const room = classes.find((item) => item.className === className);
    const wantedKey = [className, edit.rollNo.trim(), edit.name.trim()].join("\u001f");
    const found = room?.students.find((student) => student.sheetKey === wantedKey) || room?.students.find((student) => student.sheetKey === key);
    const marksLanded =
      found != null &&
      Object.entries(edit.marks).every(([subject, value]) => {
        const mark = found.marks.find((item) => item.subject === subject);
        return sameMark(mark?.value || "", value);
      });
    const nameLanded = found != null && found.rollNo.trim() === edit.rollNo.trim() && found.name.trim() === edit.name.trim();
    if (found && marksLanded && nameLanded) {
      if (edit.fatherName || edit.registrationNo || edit.dateOfIssue) {
        next[found.sheetKey] = {
          ...edit,
          name: found.name,
          rollNo: found.rollNo,
          marks: Object.fromEntries(found.marks.map((mark) => [mark.subject, mark.value])),
        };
      }
      continue;
    }
    next[key] = edit;
  }
  return next;
}
