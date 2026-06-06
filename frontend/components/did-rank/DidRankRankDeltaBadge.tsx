"use client";

import type { DidRankListColumn } from "@/lib/didRankColumnTheme";
import { didRankColumnTheme } from "@/lib/didRankColumnTheme";

/** 名次变化：列主题色；静态展示，避免与名次数字同时 motion 导致重影 */
export function DidRankRankDeltaBadge({
  delta,
  column = "traveler",
}: {
  delta?: number;
  column?: DidRankListColumn;
}) {
  if (delta == null || delta === 0) return null;

  const up = delta > 0;
  const theme = didRankColumnTheme(column);
  const label = `${up ? "↑" : "↓"}${Math.abs(delta)}`;

  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-meta font-mono font-semibold tabular-nums animate-did-rank-delta-pop motion-reduce:animate-none ${
        up ? theme.deltaUp : theme.deltaDown
      }`}
      aria-label={label}
    >
      {label}
    </span>
  );
}
