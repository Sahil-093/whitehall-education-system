"use client";

import { SchoolProvider } from "./school-context";
import { Shell } from "./shell";

export function OfficeFrame({ children }: { children: React.ReactNode }) {
  return (
    <SchoolProvider>
      <Shell>{children}</Shell>
    </SchoolProvider>
  );
}
