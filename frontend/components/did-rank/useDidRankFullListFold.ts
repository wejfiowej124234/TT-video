"use client";

import { useCallback, useEffect, useState } from "react";
import type { Period } from "@/lib/didRankUtils";

/** 默认只展示 Top10；11～100 折叠。高亮在 11+ 或深链时自动展开 */
export function useDidRankFullListFold(
  listFrom11: ReadonlyArray<{ id: string }>,
  highlightId: string | null,
  period: Period,
) {
  const highlightInRest =
    highlightId != null && listFrom11.length > 0 && listFrom11.some((x) => x.id === highlightId);
  const [expanded, setExpanded] = useState(false);
  const [enterGeneration, setEnterGeneration] = useState(0);

  const bumpEnterGeneration = useCallback(() => {
    setEnterGeneration((g) => g + 1);
  }, []);

  useEffect(() => {
    if (highlightInRest) {
      setExpanded(true);
      bumpEnterGeneration();
    }
  }, [highlightInRest, period, bumpEnterGeneration]);

  const expand = useCallback(() => {
    setExpanded((prev) => {
      if (!prev) bumpEnterGeneration();
      return true;
    });
  }, [bumpEnterGeneration]);

  const collapse = useCallback(() => setExpanded(false), []);

  const toggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      if (!prev && next) bumpEnterGeneration();
      return next;
    });
  }, [bumpEnterGeneration]);

  const setExpandedTracked = useCallback(
    (next: boolean) => {
      setExpanded((prev) => {
        if (!prev && next) bumpEnterGeneration();
        return next;
      });
    },
    [bumpEnterGeneration],
  );

  return {
    expanded,
    setExpanded: setExpandedTracked,
    expand,
    collapse,
    toggle,
    highlightInRest,
    enterGeneration,
  };
}
