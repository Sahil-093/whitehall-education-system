"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadStudentSheet, type SharedStudent } from "@/lib/student-sheet";

export function useSharedStudents() {
  const [rows, setRows] = useState<SharedStudent[]>([]);
  const alive = useRef(true);

  const reload = useCallback(() => {
    return loadStudentSheet()
      .then((next) => {
        if (alive.current) setRows(next);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    alive.current = true;
    void reload();
    return () => {
      alive.current = false;
    };
  }, [reload]);

  return { rows, reload };
}
