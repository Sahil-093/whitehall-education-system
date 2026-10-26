/** Bound to "1st Term Exam - Result 2026". Deploy as a web app: execute as me, anyone. */
function doGet() {
  return ContentService.createTextOutput("ok");
}

function doPost(e) {
  var raw = (e.parameter && e.parameter.payload) || (e.postData && e.postData.contents) || "{}";
  var data = JSON.parse(raw);
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var classes = data.classes || [];
  classes.forEach(function (room) {
    var sheet = book.getSheetByName(room.tab);
    if (!sheet) return;
    writeClass(sheet, room.students || []);
  });
  return ContentService.createTextOutput("ok");
}

function writeClass(sheet, students) {
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
  var positionCol = headers.findIndex(function (label) {
    return /^positions?$/i.test(label);
  });

  students.forEach(function (student) {
    var row = -1;
    for (var i = headerIndex + 1; i < grid.length; i++) {
      var roll = String(grid[i][rollCol] == null ? "" : grid[i][rollCol]).trim();
      var name = String(grid[i][nameCol] == null ? "" : grid[i][nameCol]).trim();
      if (roll === String(student.matchRoll).trim() && name.toLowerCase() === String(student.matchName).trim().toLowerCase()) {
        row = i;
        break;
      }
    }
    if (row < 0) return;
    if (student.marks) {
      if (rollCol >= 0) sheet.getRange(row + 1, rollCol + 1).setValue(student.rollNo || "");
      if (nameCol >= 0) sheet.getRange(row + 1, nameCol + 1).setValue(student.name || "");
      Object.keys(student.marks).forEach(function (subject) {
        var col = headers.findIndex(function (label) {
          return label.toLowerCase() === String(subject).trim().toLowerCase();
        });
        if (col < 0 || /^total$/i.test(headers[col]) || /^percentage$/i.test(headers[col])) return;
        sheet.getRange(row + 1, col + 1).setValue(cellValue(student.marks[subject]));
      });
      grid[row][rollCol] = student.rollNo || "";
      grid[row][nameCol] = student.name || "";
    }
    if (positionCol >= 0 && student.position) {
      sheet.getRange(row + 1, positionCol + 1).setValue(student.position);
    }
  });
}

function cellValue(value) {
  var text = String(value == null ? "" : value).trim();
  if (!text) return "";
  if (/^absent$/i.test(text)) return "Absent";
  var number = Number(text);
  return Number.isFinite(number) ? number : text;
}
