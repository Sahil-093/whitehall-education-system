/** Saves a student JPEG into the Student photos folder. Deploy as a web app: execute as me, anyone. */
var FOLDER_ID = "1jlIb9ZTeJzZ2thvqbxzXH3wZqXN4J-O-";
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
  if (data.remove) return ContentService.createTextOutput("removed");
  var image = String(data.image || "");
  var comma = image.indexOf(",");
  var b64 = comma >= 0 ? image.substring(comma + 1) : image;
  if (!b64) return ContentService.createTextOutput("missing");
  folder.createFile(Utilities.newBlob(Utilities.base64Decode(b64), "image/jpeg", name));
  return ContentService.createTextOutput("ok");
}
