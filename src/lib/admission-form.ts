import { ADMISSION_FORM_ACTION } from "./school-links";

export const ADMISSION_CLASSES = [
  "Pre-Nursery",
  "Nursery",
  "Prep",
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
] as const;

export const LAST_CLASSES = ["Fresh", ...ADMISSION_CLASSES] as const;

export type AdmissionForm = {
  studentName: string;
  fatherName: string;
  gender: string;
  dateOfBirth: string;
  formB: string;
  classOfAdmission: string;
  placeOfBirth: string;
  nationality: string;
  religion: string;
  language: string;
  age: string;
  parentFatherName: string;
  fatherCnic: string;
  occupation: string;
  guardianName: string;
  guardianCnic: string;
  income: string;
  address: string;
  phone: string;
  emergency: string;
  lastSchool: string;
  lastClass: string;
  city: string;
  lastGrade: string;
  reason: string;
  bloodGroup: string;
  allergies: string;
  disability: string;
  admissionFee: string;
  tuitionFee: string;
  remarks: string;
};

export const blankAdmission = (): AdmissionForm => ({
  studentName: "",
  fatherName: "",
  gender: "",
  dateOfBirth: "",
  formB: "",
  classOfAdmission: "",
  placeOfBirth: "",
  nationality: "Pakistani",
  religion: "Islam",
  language: "Pashto",
  age: "",
  parentFatherName: "",
  fatherCnic: "",
  occupation: "",
  guardianName: "",
  guardianCnic: "",
  income: "",
  address: "",
  phone: "",
  emergency: "",
  lastSchool: "",
  lastClass: "",
  city: "",
  lastGrade: "",
  reason: "",
  bloodGroup: "",
  allergies: "",
  disability: "",
  admissionFee: "",
  tuitionFee: "",
  remarks: "",
});

const REGISTER_CLASS: Record<string, string> = {
  "1st": "Class 1",
  "2nd": "Class 2",
  "3rd": "Class 3",
  "4th": "Class 4",
  "5th": "Class 5",
  "6th": "Class 6",
  "7th": "Class 7",
};

export function registerClassName(label: string) {
  return REGISTER_CLASS[label] || label;
}

function append(body: URLSearchParams, entry: string, value: string) {
  const trimmed = value.trim();
  if (trimmed) body.append(entry, trimmed);
}

export function admissionBody(form: AdmissionForm) {
  const body = new URLSearchParams();
  append(body, "entry.1241582046", form.studentName);
  append(body, "entry.1638533813", form.fatherName);
  append(body, "entry.877995722", form.gender);
  if (form.dateOfBirth) {
    const [year, month, day] = form.dateOfBirth.split("-");
    if (year && month && day) {
      body.append("entry.1232889083_year", year);
      body.append("entry.1232889083_month", String(Number(month)));
      body.append("entry.1232889083_day", String(Number(day)));
    }
  }
  append(body, "entry.904269169", form.formB);
  append(body, "entry.1443516250", form.classOfAdmission);
  append(body, "entry.210123921", form.placeOfBirth);
  append(body, "entry.931419125", form.nationality);
  append(body, "entry.1584064321", form.religion);
  append(body, "entry.764637128", form.language);
  append(body, "entry.1450620571", form.age);
  append(body, "entry.1934893924", form.parentFatherName);
  append(body, "entry.894675658", form.fatherCnic);
  append(body, "entry.745730834", form.occupation);
  append(body, "entry.724199319", form.guardianName);
  append(body, "entry.249803269", form.guardianCnic);
  append(body, "entry.1870960514", form.income);
  append(body, "entry.1874859221", form.address);
  append(body, "entry.1511924041", form.phone);
  append(body, "entry.2104339808", form.emergency);
  append(body, "entry.1549262738", form.lastSchool);
  append(body, "entry.479076733", form.lastClass);
  append(body, "entry.2047226821", form.city);
  append(body, "entry.889159118", form.lastGrade);
  append(body, "entry.1862138886", form.reason);
  append(body, "entry.620475011", form.bloodGroup);
  append(body, "entry.483821159", form.allergies);
  append(body, "entry.297566766", form.disability);
  append(body, "entry.1606346983", form.admissionFee);
  append(body, "entry.262033460", form.tuitionFee);
  append(body, "entry.1748401179", form.remarks);
  body.append("fvv", "1");
  body.append("pageHistory", "0");
  return body;
}

export function submitAdmission(form: AdmissionForm) {
  const frameName = "whitehall-admission-sheet";
  let frame = document.getElementById(frameName) as HTMLIFrameElement | null;
  if (!frame) {
    frame = document.createElement("iframe");
    frame.id = frameName;
    frame.name = frameName;
    frame.hidden = true;
    frame.title = "Admission sheet";
    document.body.appendChild(frame);
  }

  const element = document.createElement("form");
  element.method = "POST";
  element.action = ADMISSION_FORM_ACTION;
  element.target = frameName;
  element.acceptCharset = "UTF-8";
  for (const [key, value] of admissionBody(form).entries()) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    element.appendChild(input);
  }
  document.body.appendChild(element);
  element.submit();
  element.remove();
}
