/** Reads and writes one sheet per office section. Deploy as a web app: execute as me, anyone. */
var TOKEN = "wh-office-6b2d4e";
var FOLDER_ID = "1MqhtgWR04gmvcxbko_sv0Z0aYOJMR8R3";
var STAFF_ID = "1NO6subXMaR29fJORPBvKiW73j94_T_jMZybsd5tg9TY";
var LOG_ID = "1d1-faLPhDIO5_9gOeEexQ1vwTn6YEmE0KSW9VrZN-Y8";
var SETTINGS_ID = "1qUv-JEraNnD85rVYkI2LNmKC-sUZWIiD7tYSMo0_PGk";
var FEES_ID = "1SXAqRVZXqstvDf9zATjNIYC4YO_ACeXhKIDimZNtYBU";
var CORRECTIONS_ID = "1lctcfaAz85VXeMwyzguQN4486IGHD1c79iYNURBUonk";
var ATTENDANCE_ID = "1_sB4eTHjlII3yJT1w-HZ86OoroTfhoRY4rAVCoHw7rY";
var EXAM_ID = "1AaPJW2upNFvO9i-qdxZuiMbe_FHwagP6eg8vaKN3QO4";

var RECYCLE_HEADERS = ["Id", "Kind", "Name", "Detail", "Removed at", "Removed by", "Payload"];
var ATTEND_HEADERS = ["Id", "Date", "Student id", "Admission no", "Student name", "Class", "Section", "Status"];

function doGet(e) {
  var params = (e && e.parameter) || {};
  if (params.token !== TOKEN || String(params.list || "") !== "1") {
    return ContentService.createTextOutput("ok");
  }
  var attendance = "";
  try { attendance = attendanceId(); } catch (err) { attendance = ""; }
  var payload = {
    staff: readSheet(STAFF_ID, "Staff"),
    log: readSheet(LOG_ID, "Whitehall Log"),
    recycle: readSheet(LOG_ID, "Recycle"),
    settings: readSheet(SETTINGS_ID, "Whitehall Settings")[0] || null,
    fees: readSheet(FEES_ID, "Whitehall Fees"),
    attendance: attendance ? readSheet(attendance, "Whitehall Attendance") : [],
    corrections: readSheet(CORRECTIONS_ID, "Whitehall Result corrections"),
    attendanceId: attendance,
  };
  var callback = String(params.callback || "whOffice");
  if (!/^[A-Za-z0-9_]+$/.test(callback)) callback = "whOffice";
  return ContentService.createTextOutput(callback + "(" + JSON.stringify(payload) + ")")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(e) {
  var raw = (e.parameter && e.parameter.payload) || (e.postData && e.postData.contents) || "{}";
  var data = {};
  try { data = JSON.parse(raw); } catch (err) { return ContentService.createTextOutput("bad"); }
  if (data.token !== TOKEN) return ContentService.createTextOutput("no");
  var book = String(data.book || "");
  if (book === "result") {
    writeResultCells(data.rows || []);
    return ContentService.createTextOutput("ok");
  }
  var sheet = sheetFor(book);
  if (!sheet) return ContentService.createTextOutput("book");
  var action = String(data.action || "upsert");
  if (action === "delete") {
    removeIds(sheet, book === "corrections" ? "Key" : book === "settings" ? "School name" : "Id", data.ids || []);
    return ContentService.createTextOutput("ok");
  }
  if (action === "replace") clearRows(sheet);
  var rows = data.rows || [];
  for (var i = 0; i < rows.length; i++) putRow(sheet, book, rows[i], action === "replace");
  return ContentService.createTextOutput("ok");
}

function sheetFor(book) {
  if (book === "staff") return openTab(STAFF_ID, "Staff");
  if (book === "log") return openTab(LOG_ID, "Whitehall Log");
  if (book === "recycle") return openTab(LOG_ID, "Recycle", RECYCLE_HEADERS);
  if (book === "settings") return openTab(SETTINGS_ID, "Whitehall Settings");
  if (book === "fees") return openTab(FEES_ID, "Whitehall Fees");
  if (book === "attendance") return openTab(attendanceId(), "Whitehall Attendance", ATTEND_HEADERS);
  if (book === "corrections") return openTab(CORRECTIONS_ID, "Whitehall Result corrections");
  return null;
}

function attendanceId() {
  if (ATTENDANCE_ID) return ATTENDANCE_ID;
  var stored = PropertiesService.getScriptProperties().getProperty("attendanceId");
  if (stored) return stored;
  var folder = DriveApp.getFolderById(FOLDER_ID);
  var found = folder.getFilesByName("Whitehall Attendance");
  var id = found.hasNext() ? found.next().getId() : "";
  if (!id) {
    var book = SpreadsheetApp.create("Whitehall Attendance");
    var file = DriveApp.getFileById(book.getId());
    file.moveTo(folder);
    book.getSheets()[0].setName("Whitehall Attendance");
    book.getSheets()[0].getRange(1, 1, 1, ATTEND_HEADERS.length).setValues([ATTEND_HEADERS]);
    id = book.getId();
  }
  PropertiesService.getScriptProperties().setProperty("attendanceId", id);
  ATTENDANCE_ID = id;
  return id;
}

function openTab(id, name, headers) {
  if (!id) return null;
  var book = SpreadsheetApp.openById(id);
  var sheet = book.getSheetByName(name);
  if (!sheet && name === "Recycle") {
    sheet = book.insertSheet("Recycle");
    sheet.getRange(1, 1, 1, RECYCLE_HEADERS.length).setValues([RECYCLE_HEADERS]);
    return sheet;
  }
  if (!sheet) sheet = book.getSheets()[0];
  if (headers && String(sheet.getRange(1, 1).getValue() || "") === "") {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  if (name === "Staff" && String(sheet.getRange(1, 11).getValue() || "") !== "Id") {
    sheet.getRange(1, 11).setValue("Id");
  }
  return sheet;
}

function readSheet(id, name) {
  try {
    var sheet = openTab(id, name, name === "Recycle" ? RECYCLE_HEADERS : name === "Whitehall Attendance" ? ATTEND_HEADERS : null);
    if (!sheet) return [];
    var values = sheet.getDataRange().getDisplayValues();
    if (values.length < 2) return [];
    var headers = values[0];
    var out = [];
    for (var r = 1; r < values.length; r++) {
      var obj = {};
      var any = false;
      for (var c = 0; c < headers.length; c++) {
        var key = String(headers[c] || "").trim();
        if (!key) continue;
        obj[key] = String(values[r][c] || "");
        if (obj[key]) any = true;
      }
      if (any) out.push(obj);
    }
    return out;
  } catch (err) {
    return [];
  }
}

function headerMap(sheet) {
  var width = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, width).getValues()[0];
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    var key = String(headers[i] || "").trim();
    if (key) map[key] = i + 1;
  }
  return map;
}

function putRow(sheet, book, row, appendOnly) {
  if (!row || typeof row !== "object") return;
  delete row.password;
  delete row.passwordHash;
  var map = headerMap(sheet);
  var keyName = book === "corrections" ? "Key" : book === "settings" ? "School name" : "Id";
  var key = String(row[keyName] || "");
  var at = 0;
  if (!appendOnly && key && map[keyName]) at = findKey(sheet, map[keyName], key);
  if (!at && book === "staff" && row.Email && map.Email) at = findKey(sheet, map.Email, String(row.Email));
  if (!at) at = Math.max(sheet.getLastRow(), 1) + 1;
  var keys = Object.keys(row);
  for (var i = 0; i < keys.length; i++) {
    if (!map[keys[i]]) continue;
    sheet.getRange(at, map[keys[i]]).setValue(row[keys[i]] == null ? "" : String(row[keys[i]]));
  }
}

function findKey(sheet, column, key) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var values = sheet.getRange(2, column, last - 1, 1).getValues();
  var wanted = String(key).trim().toLowerCase();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0] || "").trim().toLowerCase() === wanted) return i + 2;
  }
  return 0;
}

function removeIds(sheet, keyName, ids) {
  var map = headerMap(sheet);
  if (!map[keyName]) return;
  var wanted = {};
  for (var i = 0; i < ids.length; i++) wanted[String(ids[i]).trim().toLowerCase()] = true;
  var last = sheet.getLastRow();
  if (last < 2) return;
  var values = sheet.getRange(2, map[keyName], last - 1, 1).getValues();
  for (var r = values.length - 1; r >= 0; r--) {
    if (wanted[String(values[r][0] || "").trim().toLowerCase()]) sheet.deleteRow(r + 2);
  }
}

function clearRows(sheet) {
  var last = sheet.getLastRow();
  if (last > 1) sheet.getRange(2, 1, last - 1, Math.max(sheet.getLastColumn(), 1)).clearContent();
}

function writeResultCells(rows) {
  var book = SpreadsheetApp.openById(EXAM_ID);
  var byTab = {};
  for (var i = 0; i < rows.length; i++) {
    var tab = String(rows[i].tab || "");
    if (!tab) continue;
    if (!byTab[tab]) byTab[tab] = [];
    byTab[tab].push(rows[i]);
  }
  for (var name in byTab) {
    if (!Object.prototype.hasOwnProperty.call(byTab, name)) continue;
    var sheet = book.getSheetByName(name);
    if (sheet) writeClassCells(sheet, byTab[name]);
  }
}

function writeClassCells(sheet, students) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return;
  var grid = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headerIndex = -1;
  for (var r = 0; r < Math.min(grid.length, 8); r++) {
    for (var c = 0; c < grid[r].length; c++) {
      if (String(grid[r][c]).trim().toLowerCase() === "roll no") headerIndex = r;
    }
    if (headerIndex >= 0) break;
  }
  if (headerIndex < 0) return;
  var headers = grid[headerIndex].map(function (cell) {
    return String(cell).trim();
  });
  var rollCol = headers.findIndex(function (label) {
    return label.toLowerCase() === "roll no";
  });
  var nameCol = headers.findIndex(function (label) {
    return /student name/i.test(label);
  });
  if (rollCol < 0 || nameCol < 0) return;

  students.forEach(function (student) {
    var row = -1;
    for (var i = headerIndex + 1; i < grid.length; i++) {
      var roll = String(grid[i][rollCol] == null ? "" : grid[i][rollCol]).trim();
      var name = String(grid[i][nameCol] == null ? "" : grid[i][nameCol]).trim();
      if (roll === String(student.matchRoll || "").trim() && name.toLowerCase() === String(student.matchName || "").trim().toLowerCase()) {
        row = i;
        break;
      }
    }
    if (row < 0) return;
    if (student.name) sheet.getRange(row + 1, nameCol + 1).setValue(String(student.name));
    var marks = student.marks || {};
    Object.keys(marks).forEach(function (subject) {
      var col = headers.findIndex(function (label) {
        return label.toLowerCase() === String(subject).trim().toLowerCase();
      });
      if (col < 0) return;
      var header = headers[col];
      if (/^total$/i.test(header) || /^percentage$/i.test(header) || /^positions?$/i.test(header)) return;
      sheet.getRange(row + 1, col + 1).setValue(resultCell(marks[subject]));
    });
  });
}

function resultCell(value) {
  var text = String(value == null ? "" : value).trim();
  if (!text) return "";
  if (/^absent$/i.test(text)) return "Absent";
  var number = Number(text);
  return isFinite(number) ? number : text;
}
