"use client";

import { useEffect, useState } from "react";
import { loadExamBook, type ExamClass } from "@/lib/exam-sheet";

export function useExamSheet() {
  const [classes, setClasses] = useState<ExamClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    loadExamBook()
      .then((next) => {
        if (active) setClasses(next);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "The result sheet did not load.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { classes, loading, error };
}
