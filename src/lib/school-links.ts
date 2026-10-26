/** Admission responses, shared with sahilktk093@gmail.com. */
export const ADMISSION_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1xEAQ2b9bTNcKBEYVziacZ48cuXlMMcl0SuLMNvnMm5I/edit?gid=966990833#gid=966990833";

/** School Drive folder: Whitehall Education System. Owned by sahilktk093@gmail.com. */
export const DRIVE_FOLDER_ID = "1MqhtgWR04gmvcxbko_sv0Z0aYOJMR8R3";
export const DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${DRIVE_FOLDER_ID}?usp=sharing`;

/** Pictures taken or uploaded on a student record. */
export const DRIVE_PHOTOS_FOLDER_ID = "1jlIb9ZTeJzZ2thvqbxzXH3wZqXN4J-O-";
export const DRIVE_PHOTOS_URL = `https://drive.google.com/drive/folders/${DRIVE_PHOTOS_FOLDER_ID}?usp=sharing`;

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

/**
 * Apps Script web app that writes result corrections back into the class tabs.
 * Empty until the sheet owner deploys the script in scripts/result-sync.gs.
 */
export const RESULT_SYNC_URL = "";

/** Staff sheet in sahilktk093@gmail.com Drive, inside the school folder. */
export const STAFF_SHEET_ID = "1NO6subXMaR29fJORPBvKiW73j94_T_jMZybsd5tg9TY";
export const STAFF_SHEET_GID = "0";
export const STAFF_SHEET_URL = `https://docs.google.com/spreadsheets/d/${STAFF_SHEET_ID}/edit`;
