"use client";

import { AdminGate } from "./admin-gate";
import { SchoolProvider } from "./school-context";
import { Shell } from "./shell";

export function OfficeFrame({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <SchoolProvider>
        <Shell>{children}</Shell>
      </SchoolProvider>
    </AdminGate>
  );
}
