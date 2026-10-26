"use client";

import { useEffect, useState } from "react";
import { loadExamBook, reloadExamBook, type ExamClass } from "@/lib/exam-sheet";

export function useExamSheet() {
  const [classes, setClasses] = useState<ExamClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  async function refresh() {
    setRefreshing(true);
    setError("");
    try {
      const next = await reloadExamBook();
      setClasses(next);
      return next;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The result sheet did not load.";
      setError(message);
      throw caught;
    } finally {
      setRefreshing(false);
    }
  }

  return { classes, loading, refreshing, error, refresh };
}
