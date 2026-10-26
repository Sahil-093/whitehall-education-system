/** Saves a student JPEG into the Student photos folder. Deploy as a web app: execute as me, anyone. */
var FOLDER_ID = "1jlIb9ZTeJzZ2thvqbxzXH3wZqXN4J-O-";
var SHEET_ID = "1Zea1p4y7lbN7Jsh8Sx-vxmU9N-1Cv5emo9bOPXztls4";
var TOKEN = "wh-photo-7f3c9a";

function doGet() {
  return ContentService.createTextOutput("ok");
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
  var name = String(data.name || "student").replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim() || "student";
  if (!/\.jpg$/i.test(name)) name = name + ".jpg";
  var folder = DriveApp.getFolderById(FOLDER_ID);
  var existing = folder.getFilesByName(name);
  while (existing.hasNext()) existing.next().setTrashed(true);
  if (data.remove) {
    stampPhoto(name, "");
    return ContentService.createTextOutput("removed");
  }
  var image = String(data.image || "");
  var comma = image.indexOf(",");
  var b64 = comma >= 0 ? image.substring(comma + 1) : image;
  if (!b64) return ContentService.createTextOutput("missing");
  var file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(b64), "image/jpeg", name));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  stampPhoto(name, "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w640");
  return ContentService.createTextOutput("ok");
}

function stampPhoto(fileName, url) {
  if (!writePhotoCell(fileName, url)) {
    Utilities.sleep(2000);
    writePhotoCell(fileName, url);
  }
}

function writePhotoCell(fileName, url) {
  var match = String(fileName || "").match(/WHES-\d+/i);
  if (!match) return true;
  var reg = match[0].toUpperCase();
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var regs = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < regs.length; i++) {
    if (String(regs[i][0]).trim().toUpperCase() === reg) {
      sheet.getRange(i + 2, 33).setValue(url);
      return true;
    }
  }
  return false;
}
