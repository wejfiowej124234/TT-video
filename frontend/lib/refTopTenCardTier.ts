import { refTopThreeTier, type RefTopThreeTier } from "@/lib/refTopThreeStyles";
import type { DidRankListColumn } from "@/lib/didRankColumnTheme";

function topTenPaletteColumn(column: DidRankListColumn): "traveler" | "guide" {
  return column === "guide" ? "guide" : "traveler";
}

/** 4～10：幽灵条，弱化「方框墙」 */
const ROW_TRAVELER: RefTopThreeTier = {
  shell:
    "rounded-[var(--radius-md)] border border-transparent bg-ink-900/42 backdrop-blur-sm ring-1 ring-inset ring-white/[0.06]",
  hover: "hover:bg-ink-900/55 hover:ring-ref-sun/12",
  rankText: "text-slate-400",
  avatarRing: "ring-1 ring-ref-sun/18",
  avatarPlaceholder: "bg-ref-sun/8 text-ref-sun/80",
};

const ROW_GUIDE: RefTopThreeTier = {
  ...ROW_TRAVELER,
  shell:
    "rounded-[var(--radius-md)] border border-transparent bg-ink-900/42 backdrop-blur-sm ring-1 ring-inset ring-fuchsia-500/10",
  hover: "hover:bg-ink-900/55 hover:ring-fuchsia-500/18",
  rankText: "text-fuchsia-300/80",
  avatarRing: "ring-1 ring-fuchsia-400/22",
  avatarPlaceholder: "bg-fuchsia-500/10 text-fuchsia-200/85",
};

export type DidRankTop10CardVariant = "podium" | "row";

export function refTopTenCardTier(rank: number, column: DidRankListColumn = "traveler"): RefTopThreeTier {
  const col = topTenPaletteColumn(column);
  if (rank <= 3) return refTopThreeTier(rank, col);
  return col === "guide" ? ROW_GUIDE : ROW_TRAVELER;
}
