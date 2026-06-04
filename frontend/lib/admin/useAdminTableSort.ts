"use client";

import { useCallback, useMemo, useState } from "react";

export type AdminTableSortDir = "asc" | "desc";

export type AdminTableSortState<K extends string> = {
  key: K;
  dir: AdminTableSortDir;
};

export function useAdminTableSort<K extends string>(
  defaultKey: K,
  defaultDir: AdminTableSortDir = "desc",
) {
  const [state, setState] = useState<AdminTableSortState<K>>({ key: defaultKey, dir: defaultDir });

  const toggle = useCallback((key: K) => {
    setState((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === defaultKey ? defaultDir : "asc" },
    );
  }, [defaultKey, defaultDir]);

  const ariaSort = useCallback(
    (key: K): "ascending" | "descending" | "none" => {
      if (state.key !== key) return "none";
      return state.dir === "asc" ? "ascending" : "descending";
    },
    [state],
  );

  return { sort: state, toggle, ariaSort };
}

function compareSortValues(
  av: string | number | null | undefined,
  bv: string | number | null | undefined,
  dir: AdminTableSortDir,
): number {
  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;
  if (typeof av === "number" && typeof bv === "number") {
    return dir === "asc" ? av - bv : bv - av;
  }
  const as = String(av);
  const bs = String(bv);
  const cmp = as.localeCompare(bs, undefined, { numeric: true, sensitivity: "base" });
  return dir === "asc" ? cmp : -cmp;
}

export function sortRowsByKey<T>(
  rows: T[],
  key: string,
  dir: AdminTableSortDir,
  accessor: (row: T, key: string) => string | number | null | undefined,
): T[] {
  const copy = [...rows];
  copy.sort((a, b) => compareSortValues(accessor(a, key), accessor(b, key), dir));
  return copy;
}
