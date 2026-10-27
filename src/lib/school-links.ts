/** Admission responses, shared with sahilktk093@gmail.com. */
export const ADMISSION_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1xEAQ2b9bTNcKBEYVziacZ48cuXlMMcl0SuLMNvnMm5I/edit?gid=966990833#gid=966990833";

/** School Drive folder: Whitehall Education System. Owned by sahilktk093@gmail.com. */
export const DRIVE_FOLDER_ID = "1MqhtgWR04gmvcxbko_sv0Z0aYOJMR8R3";
export const DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${DRIVE_FOLDER_ID}?usp=sharing`;

/** Pictures taken or uploaded on a student record. */
export const DRIVE_PHOTOS_FOLDER_ID = "1jlIb9ZTeJzZ2thvqbxzXH3wZqXN4J-O-";
export const DRIVE_PHOTOS_URL = `https://drive.google.com/drive/folders/${DRIVE_PHOTOS_FOLDER_ID}?usp=sharing`;

/** Apps Script web app that writes each student JPEG into that folder. */
export const PHOTO_STORE_URL =
  "https://script.google.com/macros/s/AKfycbwlbB3Nen8kdjGkY97X47cCNNi1UjHihdP6sZXMiimLiJyikBnJaruuOmQromrjPH_y/exec";
export const PHOTO_STORE_TOKEN = "wh-photo-7f3c9a";

export const ADMISSION_ACCOUNT = "sahilktk093@gmail.com";

/** School office login. Staff emails are stored on each staff record. */
export const ADMIN_EMAIL = "thewhitehalleducationsystem@gmail.com";

/** Public Google Form that writes each admission into the sheet above. */
export const ADMISSION_FORM_ACTION =
  "https://docs.google.com/forms/d/e/1FAIpQLSfKe2isBcK9-u2uW-CfolD3b6MKovKautXLNTImpqAwr5g_0Q/formResponse";

/** 1st Term Exam - Result 2026. One tab per class, readable without a sign-in. */
export const EXAM_SHEET_ID = "1AaPJW2upNFvO9i-qdxZuiMbe_FHwagP6eg8vaKN3QO4";
export const EXAM_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1AaPJW2upNFvO9i-qdxZuiMbe_FHwagP6eg8vaKN3QO4/edit?gid=1288827159#gid=1288827159";
export const RESULTS_SHEET_URL = EXAM_SHEET_URL;

/** Unused. Result marks are written by the office web app into the class tabs. */
export const RESULT_SYNC_URL = "";

/** Student details for the Students section. Inside the school Drive folder. */
export const STUDENT_SHEET_ID = "1Zea1p4y7lbN7Jsh8Sx-vxmU9N-1Cv5emo9bOPXztls4";
export const STUDENT_SHEET_URL = `https://docs.google.com/spreadsheets/d/${STUDENT_SHEET_ID}/edit`;
export const STUDENT_SYNC_URL =
  "https://script.google.com/macros/s/AKfycbzqMVDhPqznuihg26xF6fbAJIu_qxwZfCkz9gflWAvBjuok_SwmhaVw-t_z8Bbm7XNv/exec";
export const STUDENT_SHEET_TOKEN = "wh-student-4c8e1b";

/** Staff sheet in sahilktk093@gmail.com Drive, inside the school folder. */
export const STAFF_SHEET_ID = "1NO6subXMaR29fJORPBvKiW73j94_T_jMZybsd5tg9TY";
export const STAFF_SHEET_GID = "0";
export const STAFF_SHEET_URL = `https://docs.google.com/spreadsheets/d/${STAFF_SHEET_ID}/edit`;

/** One workbook per remaining office section, in the same school Drive folder. */
export const LOG_SHEET_ID = "1d1-faLPhDIO5_9gOeEexQ1vwTn6YEmE0KSW9VrZN-Y8";
export const LOG_SHEET_URL = `https://docs.google.com/spreadsheets/d/${LOG_SHEET_ID}/edit`;
export const SETTINGS_SHEET_ID = "1qUv-JEraNnD85rVYkI2LNmKC-sUZWIiD7tYSMo0_PGk";
export const SETTINGS_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SETTINGS_SHEET_ID}/edit`;
export const FEES_SHEET_ID = "1SXAqRVZXqstvDf9zATjNIYC4YO_ACeXhKIDimZNtYBU";
export const FEES_SHEET_URL = `https://docs.google.com/spreadsheets/d/${FEES_SHEET_ID}/edit`;
export const ATTENDANCE_SHEET_ID = "1_sB4eTHjlII3yJT1w-HZ86OoroTfhoRY4rAVCoHw7rY";
export const ATTENDANCE_SHEET_URL = ATTENDANCE_SHEET_ID
  ? `https://docs.google.com/spreadsheets/d/${ATTENDANCE_SHEET_ID}/edit`
  : "";
export const RESULT_EDITS_SHEET_ID = "1lctcfaAz85VXeMwyzguQN4486IGHD1c79iYNURBUonk";
export const RESULT_EDITS_SHEET_URL = `https://docs.google.com/spreadsheets/d/${RESULT_EDITS_SHEET_ID}/edit`;

/** Apps Script web app that reads and writes the office sheets. */
export const OFFICE_SYNC_URL =
  "https://script.google.com/macros/s/AKfycbyEUSV_WZFbJ-JZ9M9w8r48ecdFAOxBELOd8Osbr21Hy-PtjSH2WAqPOYyaQUyZqe8o/exec";
export const OFFICE_SHEET_TOKEN = "wh-office-6b2d4e";
