"use client";

import type { GuideLeaderboardSort } from "@/lib/didRankUtils";
import {
  TT_MARKETING_DID_RANK_PERIOD_TAB_ACTIVE,
  TT_MARKETING_DID_RANK_PERIOD_TAB_IDLE,
} from "@/lib/marketingUi";

type TFunc = (key: string) => string;

const SORT_OPTIONS: { id: GuideLeaderboardSort; labelKey: string }[] = [
  { id: "weighted", labelKey: "didRank_guideSortWeighted" },
  { id: "reception", labelKey: "didRank_guideSortReception" },
  { id: "reviews", labelKey: "didRank_guideSortReviews" },
];

export function DidRankGuideSortControls({
  guideSort,
  onSelectSort,
  t,
  sortGroupId,
}: {
  guideSort: GuideLeaderboardSort;
  onSelectSort: (sort: GuideLeaderboardSort) => void;
  t: TFunc;
  sortGroupId: string;
}) {
  return (
    <div
      className="mt-3 flex flex-wrap items-center gap-2"
      role="group"
      aria-labelledby={sortGroupId}
    >
      <span id={sortGroupId} className="text-meta text-slate-400 shrink-0">
        {t("didRank_guideSortGroupLabel")}
      </span>
      {SORT_OPTIONS.map((opt) => {
        const active = guideSort === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            className={
              active
                ? TT_MARKETING_DID_RANK_PERIOD_TAB_ACTIVE
                : TT_MARKETING_DID_RANK_PERIOD_TAB_IDLE
            }
            onClick={() => onSelectSort(opt.id)}
          >
            {t(opt.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
