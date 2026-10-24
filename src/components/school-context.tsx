"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { changeRegister, loadRegister, restoreRegister } from "@/lib/browser-register";
import { DEFAULT_SETTINGS } from "@/lib/format";
import type { ListResource, Row, SchoolPayload, SchoolSettings } from "@/lib/types";

type SchoolContextValue = SchoolPayload & {
  loading: boolean;
  refresh: () => Promise<void>;
  upsert: (resource: ListResource, records: Row[]) => Promise<void>;
  remove: (resource: ListResource, ids: string[]) => Promise<void>;
  saveSettings: (settings: SchoolSettings) => Promise<void>;
  restore: (raw: string) => Promise<void>;
};

const empty: SchoolPayload = {
  mode: "local",
  connected: false,
  spreadsheetUrl: "",
  serviceAccountEmail: "",
  error: null,
  settings: DEFAULT_SETTINGS,
  students: [],
  staff: [],
  classes: [],
  attendance: [],
  fees: [],
  exams: [],
  results: [],
};

const SchoolContext = createContext<SchoolContextValue | null>(null);

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SchoolPayload>(empty);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setData(loadRegister());
  }, []);

  useEffect(() => {
    refresh()
      .catch((error: Error) => {
        setData((current) => ({ ...current, error: error.message }));
      })
      .finally(() => setLoading(false));
  }, [refresh]);

  const upsert = useCallback(async (resource: ListResource, records: Row[]) => {
    setData(changeRegister({ resource, action: "upsert", records }));
  }, []);

  const remove = useCallback(async (resource: ListResource, ids: string[]) => {
    setData(changeRegister({ resource, action: "delete", ids }));
  }, []);

  const saveSettings = useCallback(async (settings: SchoolSettings) => {
    setData(changeRegister({ resource: "settings", action: "replace", settings }));
  }, []);

  const restore = useCallback(async (raw: string) => {
    setData(restoreRegister(raw));
  }, []);

  return (
    <SchoolContext.Provider value={{ ...data, loading, refresh, upsert, remove, saveSettings, restore }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const value = useContext(SchoolContext);
  if (!value) throw new Error("The school register is not ready.");
  return value;
}
