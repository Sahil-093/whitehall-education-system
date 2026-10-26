"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DRIVE_FOLDER_URL, STAFF_SHEET_URL } from "@/lib/school-links";
import { useAdminLogout } from "./admin-gate";
import { useSchool } from "./school-context";

const LINKS = [
  ["/", "Overview"],
  ["/admission", "Admission"],
  ["/students", "Students"],
  ["/classes", "Classes"],
  ["/staff", "Staff"],
  ["/results", "Results"],
  ["/settings", "Settings"],
];

function normalize(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname || "/";
}

function active(pathname: string, href: string) {
  const current = normalize(pathname);
  if (href === "/") return current === "/";
  return current === href || current.startsWith(`${href}/`);
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const school = useSchool();
  const logout = useAdminLogout();
  const { settings } = school;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/logo.png`} alt="" />
          </div>
          <div className="brand-copy">
            <strong>{settings.schoolName}</strong>
            <span>
              {settings.campus}, {settings.province}
            </span>
          </div>
        </div>
        <nav className="nav" aria-label="Register">
          {LINKS.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={active(pathname, href) ? "nav-link active" : "nav-link"}
              aria-current={active(pathname, href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
          <a className="nav-link" href={DRIVE_FOLDER_URL} target="_blank" rel="noreferrer">
            Drive
          </a>
          <button type="button" className="nav-link" onClick={logout}>
            Log out
          </button>
        </nav>
        <p className="side-foot">
          {school.loading ? "Opening the register" : "Admissions and results stay in the sheets"}
          <span>{settings.academicYear}</span>
        </p>
      </aside>
      <div className="main">
        {!school.loading && normalize(pathname) !== "/settings" ? (
          <p className="notice">
            {normalize(pathname) === "/admission" ? (
              "This admission is saved on the Google Sheet. Papers stay in the school Drive folder. "
            ) : normalize(pathname) === "/results" || normalize(pathname) === "/students" || normalize(pathname) === "/classes" ? (
              "Students, classes, and the result list are read from the 1st term result sheet. "
            ) : normalize(pathname) === "/staff" ? (
              <>
                Staff sign in with the email and password saved on their record. Their sheet is the{" "}
                <a href={STAFF_SHEET_URL} target="_blank" rel="noreferrer">
                  Staff
                </a>{" "}
                tab in Whitehall Education System.{" "}
              </>
            ) : (
              "The register stays in this browser. It is not stored on GitHub. "
            )}
            <Link href="/settings">School files and backup</Link>.
          </p>
        ) : null}
        {!school.loading && school.error ? <p className="notice warn">{school.error}</p> : null}
        {school.loading ? <p className="opening">Opening the register…</p> : children}
      </div>
    </div>
  );
}
