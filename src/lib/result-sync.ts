import type { ExamClass, ResultCorrection } from "./exam-sheet";
import { postOffice } from "./office-post";

export function resultSyncReady() {
  return true;
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
  const rows = classes.flatMap((room) =>
    room.students.flatMap((student) => {
      const edit = edits[student.sheetKey];
      if (!edit) return [];
      const [, rollNo = "", name = ""] = student.sheetKey.split("\u001f");
      return [
        {
          tab: room.tab,
          matchRoll: rollNo,
          matchName: name,
          name: edit.name,
          marks: edit.marks,
        },
      ];
    }),
  );
  if (rows.length === 0) return false;
  postOffice("result", "cells", rows);
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
