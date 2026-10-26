/** Writes student details into "Whitehall Students". Deploy as a web app: execute as me, anyone. */
var SHEET_ID = "1Zea1p4y7lbN7Jsh8Sx-vxmU9N-1Cv5emo9bOPXztls4";
var RESULT_ID = "1AaPJW2upNFvO9i-qdxZuiMbe_FHwagP6eg8vaKN3QO4";
var TOKEN = "wh-student-4c8e1b";

var TABS = [
  ["P.G", "Pre-Nursery"],
  ["Nursery", "Nursery"],
  ["PREP", "Prep"],
  ["1st ", "1st"],
  ["2nd", "2nd"],
  ["3rd", "3rd"],
  ["4th", "4th"],
  ["5th", "5th"],
  ["6th", "6th"],
  ["7th", "7th"],
];

var HEADERS = [
  "Registration no",
  "Student name",
  "Father name",
  "Class",
  "Roll no",
  "Gender",
  "Date of birth",
  "Form-B",
  "Place of birth",
  "Nationality",
  "Religion",
  "Language",
  "Age",
  "Father CNIC",
  "Occupation",
  "Guardian",
  "Guardian CNIC",
  "Monthly income",
  "Address",
  "Phone",
  "Emergency phone",
  "Last school",
  "Last class",
  "City",
  "Last grade",
  "Reason for leaving",
  "Blood group",
  "Allergies",
  "Disability",
  "Admission fee",
  "Tuition fee",
  "Remarks",
  "Photo file",
  "Edited by",
  "Edited at",
];

function doGet(e) {
  var params = (e && e.parameter) || {};
  if (params.token !== TOKEN || String(params.list || "") !== "1") {
    return ContentService.createTextOutput("ok");
  }
  var sheet = studentsSheet();
  var values = sheet.getDataRange().getDisplayValues();
  var students = [];
  for (var i = 1; i < values.length; i++) {
    var line = values[i];
    var reg = String(line[0] || "").trim();
    if (!reg) continue;
    students.push({
      registrationNo: reg,
      studentName: String(line[1] || ""),
      fatherName: String(line[2] || ""),
      className: String(line[3] || ""),
      rollNo: String(line[4] || ""),
      profile: {
        studentName: String(line[1] || ""),
        fatherName: String(line[2] || ""),
        gender: String(line[5] || ""),
        dateOfBirth: String(line[6] || ""),
        formB: String(line[7] || ""),
        classOfAdmission: String(line[3] || ""),
        placeOfBirth: String(line[8] || ""),
        nationality: String(line[9] || ""),
        religion: String(line[10] || ""),
        language: String(line[11] || ""),
        age: String(line[12] || ""),
        parentFatherName: String(line[2] || ""),
        fatherCnic: String(line[13] || ""),
        occupation: String(line[14] || ""),
        guardianName: String(line[15] || ""),
        guardianCnic: String(line[16] || ""),
        income: String(line[17] || ""),
        address: String(line[18] || ""),
        phone: String(line[19] || ""),
        emergency: String(line[20] || ""),
        lastSchool: String(line[21] || ""),
        lastClass: String(line[22] || ""),
        city: String(line[23] || ""),
        lastGrade: String(line[24] || ""),
        reason: String(line[25] || ""),
        bloodGroup: String(line[26] || ""),
        allergies: String(line[27] || ""),
        disability: String(line[28] || ""),
        admissionFee: String(line[29] || ""),
        tuitionFee: String(line[30] || ""),
        remarks: String(line[31] || ""),
      },
      photo: String(line[32] || ""),
      editedBy: String(line[33] || ""),
      editedAt: String(line[34] || ""),
    });
  }
  var body = JSON.stringify({ students: students });
  var callback = String(params.callback || "whStudents");
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(callback)) callback = "whStudents";
  return ContentService
    .createTextOutput(callback + "(" + body + ")")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(e) {
  var raw = (e.parameter && e.parameter.payload) || (e.postData && e.postData.contents) || "{}";
  var data = {};
  try {
    data = JSON.parse(raw);
  } catch (err) {
    return ContentService.createTextOutput("bad");
  }
  if (data.token !== TOKEN) return ContentService.createTextOutput("no");
  var sheet = studentsSheet();
  var rows = data.students || [data];
  rows.forEach(function (row) {
    writeStudent(sheet, row);
  });
  return ContentService.createTextOutput("ok");
}

function studentsSheet() {
  var book = SpreadsheetApp.openById(SHEET_ID);
  var sheet = book.getSheets()[0];
  if (String(sheet.getRange(1, 1).getValue()) !== HEADERS[0]) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  sheet.setFrozenRows(1);
  return sheet;
}

function writeStudent(sheet, data) {
  var reg = String(data.registrationNo || "").trim();
  if (!reg) return;
  var row = findRow(sheet, reg);
  if (data.remove) {
    if (row > 1) sheet.deleteRow(row);
    return;
  }
  var profile = data.profile || {};
  var values = [
    reg,
    String(data.studentName || data.name || profile.studentName || ""),
    String(data.fatherName || profile.fatherName || ""),
    String(data.className || profile.classOfAdmission || ""),
    String(data.rollNo || ""),
    String(profile.gender || ""),
    String(profile.dateOfBirth || ""),
    String(profile.formB || ""),
    String(profile.placeOfBirth || ""),
    String(profile.nationality || ""),
    String(profile.religion || ""),
    String(profile.language || ""),
    String(profile.age || ""),
    String(profile.fatherCnic || ""),
    String(profile.occupation || ""),
    String(profile.guardianName || ""),
    String(profile.guardianCnic || ""),
    String(profile.income || ""),
    String(profile.address || ""),
    String(profile.phone || ""),
    String(profile.emergency || ""),
    String(profile.lastSchool || ""),
    String(profile.lastClass || ""),
    String(profile.city || ""),
    String(profile.lastGrade || ""),
    String(profile.reason || ""),
    String(profile.bloodGroup || ""),
    String(profile.allergies || ""),
    String(profile.disability || ""),
    String(profile.admissionFee || ""),
    String(profile.tuitionFee || ""),
    String(profile.remarks || ""),
    photoValue(sheet, row, data),
    String(data.editedBy || ""),
    String(data.editedAt || ""),
  ];
  if (row > 1) sheet.getRange(row, 1, 1, HEADERS.length).setValues([values]);
  else sheet.appendRow(values);
}

function photoValue(sheet, row, data) {
  var incoming = String(data.photoName || "");
  if (!data.photoPending || row < 2) return incoming;
  var current = String(sheet.getRange(row, 33).getValue() || "");
  return current || incoming;
}

function findRow(sheet, reg) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var regs = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < regs.length; i++) {
    if (String(regs[i][0]).trim() === reg) return i + 2;
  }
  return 0;
}

function rollValue(rollNo) {
  var trimmed = String(rollNo || "").trim();
  if (!trimmed) return 9007199254740991;
  var value = Number(trimmed.replace(/[^0-9.]/g, ""));
  return isFinite(value) ? value : 9007199254740991;
}

function formatRoll(className, place) {
  var number = ("0" + place).slice(-2);
  if (className === "Pre-Nursery") return "PN" + number;
  if (className === "Nursery") return "N" + number;
  if (className === "Prep") return "P" + number;
  var classNo = { "1st": 1, "2nd": 2, "3rd": 3, "4th": 4, "5th": 5, "6th": 6, "7th": 7 }[className];
  if (classNo) return String(classNo * 100 + place);
  return number;
}

/** Copies the current result-sheet names once, with the same registration numbers as the website. */
function seedFromResults() {
  var sheet = studentsSheet();
  if (sheet.getLastRow() > 1) return "already";
  var book = SpreadsheetApp.openById(RESULT_ID);
  var groups = {};
  TABS.forEach(function (pair) {
    var tab = book.getSheetByName(pair[0]);
    if (!tab) return;
    var values = tab.getDataRange().getValues();
    var header = -1;
    var nameCol = -1;
    var rollCol = -1;
    for (var r = 0; r < Math.min(values.length, 8); r++) {
      for (var c = 0; c < values[r].length; c++) {
        var label = String(values[r][c] || "").trim().toLowerCase();
        if (label.indexOf("student name") !== -1) {
          header = r;
          nameCol = c;
        }
        if (label === "roll no") rollCol = c;
      }
      if (header >= 0 && rollCol >= 0) break;
    }
    if (header < 0 || nameCol < 0) return;
    var list = [];
    for (var i = header + 1; i < values.length; i++) {
      var name = String(values[i][nameCol] || "").trim();
      if (!name || name.toLowerCase() === "student name") continue;
      list.push({
        name: name,
        roll: rollCol >= 0 ? String(values[i][rollCol] || "").trim() : "",
      });
    }
    groups[pair[1]] = list;
  });
  var serial = 1;
  var rows = [];
  TABS.forEach(function (pair) {
    var list = (groups[pair[1]] || []).slice().sort(function (a, b) {
      return rollValue(a.roll) - rollValue(b.roll) || a.name.localeCompare(b.name);
    });
    list.forEach(function (student, index) {
      var line = HEADERS.map(function () {
        return "";
      });
      line[0] = "WHES-" + ("00" + serial).slice(-3);
      line[1] = student.name;
      line[3] = pair[1];
      line[4] = formatRoll(pair[1], index + 1);
      rows.push(line);
      serial++;
    });
  });
  if (rows.length) sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
  return rows.length;
}
