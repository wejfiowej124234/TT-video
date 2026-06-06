"use client";

import { useId } from "react";
import { ITIN_TOP3_STYLE } from "@/components/did-rank/itineraryRankBlockTop3Styles";
import { TT_MARKETING_DID_RANK_PATH, TT_MARKETING_DID_RANK_SURFACE } from "@/lib/marketingUi";

type TFunc = (key: string) => string;

const TOP3_CARD = [ITIN_TOP3_STYLE[1].card, ITIN_TOP3_STYLE[2].card, ITIN_TOP3_STYLE[3].card] as const;

/** 与 `ItineraryRankBlock` 通栏壳 + Top10 栅格（2/3/5 列）互证；首屏 `isLoading` 时避免误显「无数据」 */
export default function ItineraryRankSkeleton({ t }: { t: TFunc }) {
  const titleId = useId();
  return (
    <section
      className={`${TT_MARKETING_DID_RANK_SURFACE.rankSectionShell} mt-8`}
      aria-labelledby={titleId}
      aria-busy="true"
    >
      <h2 id={titleId} className="sr-only">
        {t("didRank_itineraryRank")}
      </h2>
      <div className={`h-6 w-48 max-w-[70%] rounded-[var(--radius-sm)] animate-pulse ${TT_MARKETING_DID_RANK_PATH.skeletonTitleShimmer}`} aria-hidden />
      <div className={`h-3 w-full max-w-md mt-2 rounded-[var(--radius-sm)] ${TT_MARKETING_DID_RANK_SURFACE.skeletonPulseSoft}`} aria-hidden />
      <div className="h-3 w-52 max-w-[55%] mt-2 rounded-[var(--radius-sm)] bg-amber-500/20 animate-pulse" aria-hidden />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mt-4" aria-hidden>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`min-w-0 motion-sub animate-pulse ${i < 3 ? TOP3_CARD[i] : TT_MARKETING_DID_RANK_SURFACE.rankCard}`}
          >
            <div className="mb-1 flex min-h-[30px] items-center justify-between gap-1">
              <div className={`h-[30px] w-10 shrink-0 rounded-[var(--radius-sm)] ${TT_MARKETING_DID_RANK_SURFACE.skeletonPulse}`} />
              <div className={`h-5 w-14 rounded-[var(--radius-sm)] ${TT_MARKETING_DID_RANK_SURFACE.skeletonPulseSoft} hidden sm:block`} />
            </div>
            <div className={`h-16 sm:h-20 rounded-[var(--radius-md)] ${TT_MARKETING_DID_RANK_SURFACE.skeletonPulse} mb-2`} />
            <div className={`h-3 w-full rounded-[var(--radius-sm)] ${TT_MARKETING_DID_RANK_SURFACE.skeletonPulse} mb-1`} />
            <div className={`h-3 w-2/3 rounded-[var(--radius-sm)] ${TT_MARKETING_DID_RANK_SURFACE.skeletonPulseSoft} mb-2`} />
            <div className={`h-3 w-full rounded-[var(--radius-sm)] ${TT_MARKETING_DID_RANK_SURFACE.skeletonPulseSoft} mb-3`} />
            <div className={`min-h-[44px] w-full rounded-[var(--radius-md)] ${TT_MARKETING_DID_RANK_SURFACE.skeletonPulse}`} />
          </div>
        ))}
      </div>
    </section>
  );
}
