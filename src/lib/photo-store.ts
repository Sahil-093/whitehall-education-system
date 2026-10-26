import { PHOTO_STORE_TOKEN, PHOTO_STORE_URL } from "./school-links";

export function photoFileName(fileName: string) {
  const safe = fileName.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim() || "student";
  return /\.jpg$/i.test(safe) ? safe : `${safe}.jpg`;
}

/** Posts the JPEG into Student photos. The page cannot read the reply, so the folder is the record. */
export function storeStudentPhoto(fileName: string, image: string) {
  if (!PHOTO_STORE_URL) return;
  const frameName = "whitehall-photo-store";
  let frame = document.getElementById(frameName) as HTMLIFrameElement | null;
  if (!frame) {
    frame = document.createElement("iframe");
    frame.id = frameName;
    frame.name = frameName;
    frame.hidden = true;
    frame.title = "Student photos";
    document.body.appendChild(frame);
  }

  const element = document.createElement("form");
  element.method = "POST";
  element.action = PHOTO_STORE_URL;
  element.target = frameName;
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "payload";
  input.value = JSON.stringify({
    token: PHOTO_STORE_TOKEN,
    name: photoFileName(fileName),
    image,
    remove: !image,
  });
  element.appendChild(input);
  document.body.appendChild(element);
  element.submit();
  element.remove();
}
