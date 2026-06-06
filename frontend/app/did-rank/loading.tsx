"use client";

import { useId, useState } from "react";
import LoadingText from "@/components/LoadingText";
import { useTranslation } from "@/components/LocaleProvider";
import { DidRankRouteAmbientDecor } from "@/components/did-rank/DidRankRouteAmbientDecor";
import { darkRoutePageShellClass, resolveDidRankBackdropSurface } from "@/lib/marketingDarkPremiumBg";
import { TT_MARKETING_DID_RANK_BOARD_SHELL, TT_MARKETING_DID_RANK_TABLIST } from "@/lib/uiSystem";
import DidRankPrizePoolSkeleton from "@/components/did-rank/DidRankPrizePoolSkeleton";
import DidRankHeaderSkeleton from "@/components/did-rank/DidRankHeaderSkeleton";
import DidRankSkeleton from "@/components/did-rank/DidRankSkeleton";
import type { Period } from "@/lib/didRankUtils";

/** 与 `page.tsx` 书页式脊签 + 单榜骨架互证，减路由闪白 */
export default function DidRankLoading() {
  const { t } = useTranslation();
  const rankTabPanelId = useId();
  const rankTabIdPrefix = useId();
  const [periodTab, setPeriodTab] = useState<Period>("week");
  const didRankSurface = resolveDidRankBackdropSurface();
  return (
    <main
      className={`${darkRoutePageShellClass(didRankSurface)} overflow-hidden`}
      data-tt-did-rank-dark-surface={didRankSurface}
      role="status"
      aria-label={t("didRank_title")}
      aria-busy="true"
    >
      <DidRankRouteAmbientDecor />

      <div className="relative z-10 max-w-7xl mx-auto px-3 py-6 sm:px-4 sm:py-8 lg:py-12">
        <DidRankPrizePoolSkeleton t={t} />
        <DidRankHeaderSkeleton
          t={t}
          timeRange={periodTab}
          setTimeRange={setPeriodTab}
          showMeHint={false}
          rankTabPanelId={rankTabPanelId}
          rankTabIdPrefix={rankTabIdPrefix}
        />

        <div
          id={rankTabPanelId}
          role="presentation"
          aria-labelledby={`${rankTabIdPrefix}-${periodTab}`}
          className={TT_MARKETING_DID_RANK_BOARD_SHELL}
          aria-busy="true"
        >
          <div className={TT_MARKETING_DID_RANK_TABLIST} aria-hidden>
            <div className="h-12 w-full rounded-md bg-ref-sun/12 border border-ref-sun/25 animate-pulse" />
            <div className="h-12 w-full rounded-md bg-slate-800/60 animate-pulse" />
            <div className="h-12 w-full rounded-md bg-slate-800/60 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0 lg:pl-2 flex flex-col">
            <div className="relative flex-1 min-h-[min(520px,72vh)] overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-slate-900/35 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] p-1 sm:p-2 overflow-y-auto">
              <DidRankSkeleton t={t} />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <LoadingText className="text-slate-300" />
        </div>
      </div>
    </main>
  );
}
