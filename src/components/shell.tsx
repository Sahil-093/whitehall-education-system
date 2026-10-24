"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSchool } from "./school-context";

const LINKS = [
  ["/", "Overview"],
  ["/students", "Students"],
  ["/attendance", "Attendance"],
  ["/fees", "Fees"],
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
  const { settings } = school;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            W
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
        </nav>
        <p className="side-foot">
          {school.loading ? "Opening the register" : "Saved in this browser"}
          <span>{settings.academicYear}</span>
        </p>
      </aside>
      <div className="main">
        {!school.loading && normalize(pathname) !== "/settings" ? (
          <p className="notice">
            The register stays in this browser. It is not stored on GitHub.{" "}
            <Link href="/settings">Download a backup</Link> before clearing the browser.
          </p>
        ) : null}
        {!school.loading && school.error ? <p className="notice warn">{school.error}</p> : null}
        {school.loading ? <p className="opening">Opening the register…</p> : children}
      </div>
    </div>
  );
}
