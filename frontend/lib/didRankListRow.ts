import type { DidRankListColumn } from "@/lib/didRankColumnTheme";
import { didRankColumnTheme } from "@/lib/didRankColumnTheme";
import { TT_MARKETING_DID_RANK_SURFACE } from "@/lib/marketingUi";

/** 11～100 行：行卡 + 斑马纹 + 列主题 hover（index 为列表内 0-based） */
export function didRankRankRowSurfaceClass(
  rowIndex: number,
  isHighlight: boolean,
  column: DidRankListColumn = "traveler",
): string {
  const theme = didRankColumnTheme(column);
  const zebra =
    rowIndex % 2 === 0
      ? TT_MARKETING_DID_RANK_SURFACE.rankRowZebraEven
      : TT_MARKETING_DID_RANK_SURFACE.rankRowZebraOdd;
  const highlight = isHighlight
    ? `${TT_MARKETING_DID_RANK_SURFACE.rankRowHighlight} ${theme.listRowHighlightRing} ${TT_MARKETING_DID_RANK_SURFACE.rankTop10HighlightOnce}`
    : "";
  return `${TT_MARKETING_DID_RANK_SURFACE.rankListRowCard} ${TT_MARKETING_DID_RANK_SURFACE.rankRow} ${theme.listRowHoverInset} ${zebra} ${highlight}`.trim();
}
