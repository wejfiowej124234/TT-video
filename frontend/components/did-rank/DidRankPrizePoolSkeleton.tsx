"use client";

import { useId } from "react";
import { TT_MARKETING_DID_RANK_SURFACE } from "@/lib/marketingUi";

type TFunc = (key: string) => string;

/** 与 `DidRankPrizePoolSection` 同壳；首屏 `isLoading` 时避免静态文案与真数据抢视觉焦点 */
export default function DidRankPrizePoolSkeleton({
  t,
  omitBottomMargin = false,
}: {
  t: TFunc;
  omitBottomMargin?: boolean;
}) {
  const titleId = useId();
  const mb = omitBottomMargin ? "" : " mb-4 sm:mb-6";
  return (
    <section
      className={`${TT_MARKETING_DID_RANK_SURFACE.prizePoolShell}${mb}`}
      aria-labelledby={titleId}
      aria-busy="true"
    >
      <h2 id={titleId} className="sr-only">
        {t("didRank_prizePool")}
      </h2>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" aria-hidden>
        <div className="min-w-0 flex-1">
          <div className="h-7 w-56 max-w-full rounded-[var(--radius-sm)] bg-gradient-to-r from-ref-sun/25 to-ref-coral/20 animate-pulse" />
          <div className={`h-3 w-full max-w-md mt-2 rounded-[var(--radius-sm)] ${TT_MARKETING_DID_RANK_SURFACE.skeletonPulseSoft}`} />
        </div>
        <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
          <div className={`${TT_MARKETING_DID_RANK_SURFACE.prizePoolMetric} min-w-[10rem] animate-pulse`}>
            <div className={`h-3 w-24 rounded mb-2 ${TT_MARKETING_DID_RANK_SURFACE.skeletonPulseSoft}`} />
            <div className="h-8 w-36 rounded bg-ink-700/50 animate-pulse" />
          </div>
          <div className={`h-3 w-40 max-w-xs rounded ${TT_MARKETING_DID_RANK_SURFACE.skeletonPulseSoft}`} />
        </div>
      </div>
    </section>
  );
}
