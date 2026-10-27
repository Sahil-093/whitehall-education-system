"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { readActor } from "@/lib/admin-auth";
import { purgeBin } from "@/lib/recycle-bin";
import { DRIVE_FOLDER_URL, STAFF_SHEET_URL } from "@/lib/school-links";
import { ACCESS_AREAS, areasForStaff, pathAllowed, type AccessId } from "@/lib/staff-access";
import { Empty } from "./ui";
import { useAdminLogout } from "./admin-gate";
import { useSchool } from "./school-context";

const LINKS = [
  ["/", "Overview"],
  ["/admission", "Admission"],
  ["/students", "Students"],
  ["/classes", "Classes"],
  ["/staff", "Staff"],
  ["/results", "Results"],
  ["/log", "Log"],
  ["/settings", "Settings"],
];

function normalize(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname || "/";
}

function linkAllowed(href: string, areas: AccessId[] | "all") {
  if (areas === "all") return true;
  if (href === "/staff" || href === "/settings") return false;
  const area = ACCESS_AREAS.find((item) => item.href === href);
  return Boolean(area && areas.includes(area.id));
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
  const [actorEmail, setActorEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    setActorEmail(readActor().email);
    purgeBin();
  }, []);
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);
  const { settings } = school;
  const areas = actorEmail == null ? "all" : areasForStaff(actorEmail, school.staff);
  const links = LINKS.filter(([href]) => linkAllowed(href, areas));
  const showDrive = areas === "all" || areas.includes("drive");
  const path = normalize(pathname);
  const allowed = pathAllowed(path, areas);
  const home = areas === "all" ? "/" : (ACCESS_AREAS.find((area) => area.href && areas.includes(area.id))?.href ?? "");

  return (
    <div className="shell">
      <aside className={menuOpen ? "sidebar menu-open" : "sidebar"}>
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
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="office-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
        <nav id="office-nav" className="nav" aria-label="Register">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={active(pathname, href) ? "nav-link active" : "nav-link"}
              aria-current={active(pathname, href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
          {showDrive ? (
            <a className="nav-link" href={DRIVE_FOLDER_URL} target="_blank" rel="noreferrer">
              Drive
            </a>
          ) : null}
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
        {!school.loading && allowed && path !== "/settings" ? (
          <p className="notice">
            {normalize(pathname) === "/admission" ? (
              "This admission is saved on the Google Sheet. Papers stay in the school Drive folder. "
            ) : normalize(pathname) === "/results" || normalize(pathname) === "/students" || normalize(pathname) === "/classes" ? (
              "Students, classes, and the result list are read from the school sheets. "
            ) : normalize(pathname) === "/staff" ? (
              <>
                The staff list is saved on the{" "}
                <a href={STAFF_SHEET_URL} target="_blank" rel="noreferrer">
                  Staff
                </a>{" "}
                sheet.{" "}
              </>
            ) : normalize(pathname) === "/log" ? (
              "The log and recycle bin are saved on the Log sheet. "
            ) : (
              "The register stays in this browser. It is not stored on GitHub. "
            )}
            {areas === "all" ? (
              <>
                <Link href="/settings">School files and backup</Link>.
              </>
            ) : (
              " Your checklist decides which sections you can open."
            )}
          </p>
        ) : null}
        {!school.loading && school.error ? <p className="notice warn">{school.error}</p> : null}
        {school.loading ? (
          <p className="opening">Opening the register…</p>
        ) : allowed ? (
          children
        ) : (
          <Empty
            title="This section is not on your checklist"
            text="The office chooses which parts of the register you can open. Ask them to tick this section on your staff record."
            action={home ? <Link className="btn" href={home}>Open your sections</Link> : undefined}
          />
        )}
      </div>
    </div>
  );
}
