"use client";

import React from "react";
import Link from "next/link";
import { trackDidRankEvent } from "@/lib/analytics";
import { isDidRankCommunityProfileId } from "@/lib/didRankUtils";
import type { DidRankListColumn } from "@/lib/didRankColumnTheme";
import { deepShellInlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { DidRankRankDeltaBadge } from "@/components/did-rank/DidRankRankDeltaBadge";
import { didRankRankRowSurfaceClass } from "@/lib/didRankListRow";
import type { DidRankSecondaryRow } from "@/components/did-rank/useDidRankSecondaryBoard";

type TFunc = (key: string) => string;

function formatMetric(v: number | undefined, t: TFunc): string {
  return typeof v === "number" && Number.isFinite(v) ? String(v) : t("ui_em_dash");
}

export const DidRankSecondaryRankBlockRow = React.memo(function DidRankSecondaryRankBlockRow({
  item,
  board,
  column,
  listSize,
  rowIndex,
  isHighlight,
  t,
}: {
  item: DidRankSecondaryRow;
  board: "provider" | "acquisition";
  column: DidRankListColumn;
  listSize: number;
  rowIndex: number;
  isHighlight: boolean;
  t: TFunc;
}) {
  const fulfillment = formatMetric(item.completed_fulfillment_orders, t);
  const listings = formatMetric(item.published_listings, t);

  return (
    <div
      id={`${board}-row-${item.id}`}
      role="listitem"
      aria-posinset={item.rank}
      aria-setsize={listSize}
      className={`grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[2.75rem_1fr_auto_auto] items-center gap-2 sm:gap-3 px-2 py-1.5 sm:px-3 sm:py-2 ${didRankRankRowSurfaceClass(rowIndex, isHighlight, column)}`}
    >
      <span className="flex items-center justify-end gap-1 text-meta font-mono font-medium text-slate-300 tabular-nums">
        <span>{item.rank}</span>
        <DidRankRankDeltaBadge delta={item.rank_delta} column={column} />
      </span>
      <div className="min-w-0">
        {isDidRankCommunityProfileId(item.id) ? (
          <Link
            href={`/community/user/${item.id}`}
            onClick={() =>
              trackDidRankEvent("did_rank_community_profile_open", { userId: item.id, role: board })
            }
            className={`${touchTargetLink44Classes} text-meta font-medium text-slate-200 truncate hover:text-ref-coral motion-sub rounded-sm ${deepShellInlineLinkFocusClasses} !justify-start`}
          >
            {item.nickname}
          </Link>
        ) : (
          <span className="text-meta font-medium text-slate-200 truncate block">{item.nickname}</span>
        )}
      </div>
      <span className="text-meta text-slate-400 tabular-nums shrink-0 hidden sm:block">
        {fulfillment} / {listings}
      </span>
      <span className="text-meta text-slate-400 tabular-nums shrink-0 sm:hidden col-span-2 text-right">
        {t("didRank_secondaryFulfillmentOrders")} {fulfillment}
      </span>
    </div>
  );
});
