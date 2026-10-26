export type Student = {
  id: string;
  admissionNo: string;
  name: string;
  fatherName: string;
  gender: string;
  dateOfBirth: string;
  className: string;
  section: string;
  rollNo: string;
  phone: string;
  address: string;
  admissionDate: string;
  monthlyFee: string;
  status: string;
  notes: string;
};

export type Staff = {
  id: string;
  name: string;
  designation: string;
  phone: string;
  email: string;
  passwordHash: string;
  subject: string;
  qualification: string;
  salary: string;
  joiningDate: string;
  status: string;
  /** Comma-separated sections this person may open. Blank until the office saves a checklist. */
  access: string;
};

export type SchoolClass = {
  id: string;
  className: string;
  section: string;
  classTeacher: string;
  monthlyFee: string;
  room: string;
};

export type AttendanceMark = {
  id: string;
  date: string;
  studentId: string;
  admissionNo: string;
  studentName: string;
  className: string;
  section: string;
  status: string;
};

export type Fee = {
  id: string;
  studentId: string;
  admissionNo: string;
  studentName: string;
  className: string;
  section: string;
  month: string;
  year: string;
  amount: string;
  paidAmount: string;
  status: string;
  paidDate: string;
  receiptNo: string;
  method: string;
};

export type Exam = {
  id: string;
  name: string;
  className: string;
  subject: string;
  examDate: string;
  totalMarks: string;
};

export type Result = {
  id: string;
  examId: string;
  examName: string;
  studentId: string;
  admissionNo: string;
  studentName: string;
  className: string;
  section: string;
  subject: string;
  obtained: string;
  totalMarks: string;
  grade: string;
};

export type SchoolSettings = {
  schoolName: string;
  campus: string;
  province: string;
  country: string;
  address: string;
  phone: string;
  currency: string;
  academicYear: string;
};

export type ListResource =
  | "students"
  | "staff"
  | "classes"
  | "attendance"
  | "fees"
  | "exams"
  | "results";

export type Row = Record<string, string>;

export type SchoolPayload = {
  mode: "local" | "sheets";
  connected: boolean;
  spreadsheetUrl: string;
  serviceAccountEmail: string;
  error: string | null;
  settings: SchoolSettings;
  students: Student[];
  staff: Staff[];
  classes: SchoolClass[];
  attendance: AttendanceMark[];
  fees: Fee[];
  exams: Exam[];
  results: Result[];
};

export type SaveBody = {
  resource: ListResource | "settings";
  action: "upsert" | "delete" | "replace";
  records?: Row[];
  ids?: string[];
  settings?: Partial<SchoolSettings>;
};
