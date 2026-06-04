"use client";

import type { ReactNode } from "react";
import { ADMIN_TABLE_TH_CELL_CLASS } from "@/lib/adminUi";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** O10 · 可排序表头（aria-sort · 44px 触达）。 */
export function AdminSortableTh(props: {
  label: ReactNode;
  ariaSort: "ascending" | "descending" | "none";
  onToggle: () => void;
  className?: string;
}) {
  const { label, ariaSort, onToggle, className = "" } = props;
  const indicator =
    ariaSort === "ascending" ? " ↑" : ariaSort === "descending" ? " ↓" : " ⇅";

  return (
    <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} ${className}`.trim()} aria-sort={ariaSort}>
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex min-h-[44px] w-full items-center gap-1 text-left font-medium text-ink-800 hover:text-ink-900 ${travelFocusRingOffset2Classes}`}
      >
        <span>{label}</span>
        <span className="text-meta text-ink-400" aria-hidden>
          {indicator}
        </span>
      </button>
    </th>
  );
}
