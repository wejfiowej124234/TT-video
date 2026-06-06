"use client";

import type { DidRankSecondaryRow } from "@/components/did-rank/useDidRankSecondaryBoard";
import type { DidRankListColumn } from "@/lib/didRankColumnTheme";
import { DidRankRankDeltaBadge } from "@/components/did-rank/DidRankRankDeltaBadge";
import { didRankRankRowSurfaceClass } from "@/lib/didRankListRow";
import { TT_MARKETING_DID_RANK_SURFACE } from "@/lib/marketingUi";

/** 商家 / 收购副榜列表（有数据时与主榜行面同构，①） */
export function DidRankSecondaryBoardList({
  items,
  accentClass,
  column = "provider",
  listingsLabel,
  myRankLabel,
  highlightUserId = null,
}: {
  items: DidRankSecondaryRow[];
  accentClass: string;
  column?: DidRankListColumn;
  listingsLabel?: string;
  /** 已登录且 `is_me` 时展示；由父组件传入 `t("didRank_myRank")` */
  myRankLabel?: string;
  /** `?me=provider-*` / `?me=acquisition-*` 或登录 `is_me` 行高亮 */
  highlightUserId?: string | null;
}) {
  const s = TT_MARKETING_DID_RANK_SURFACE;
  const showListingsCol = items.some((r) => typeof r.published_listings === "number");
  return (
    <ol className="space-y-2 mb-4" aria-label="Leaderboard">
      {showListingsCol && listingsLabel ? (
        <li className="flex items-center gap-3 px-3 text-meta text-slate-500" aria-hidden>
          <span className="w-8" />
          <span className="flex-1" />
          <span className="shrink-0">{listingsLabel}</span>
        </li>
      ) : null}
      {items.map((row, index) => (
        <li
          key={row.id}
          id={`did-rank-secondary-row-${column}-${row.id}`}
          className={`${didRankRankRowSurfaceClass(index, row.id === highlightUserId, column)} ${accentClass} flex items-center gap-3 px-3 py-2.5`}
        >
          <span className={`font-mono font-bold tabular-nums w-8 text-center ${s.rankCardTextCrisp}`}>
            {row.rank}
          </span>
          <DidRankRankDeltaBadge delta={row.rank_delta} column={column} />
          <span className={`text-body font-medium truncate flex-1 min-w-0 ${s.rankCardTextCrisp}`}>
            {row.nickname}
            {row.is_me && myRankLabel ? (
              <span className={`ml-2 ${s.myRankBadge}`}>{myRankLabel}</span>
            ) : null}
          </span>
          {typeof row.published_listings === "number" ? (
            <span className="text-meta text-slate-400 tabular-nums shrink-0">
              {row.published_listings}
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
