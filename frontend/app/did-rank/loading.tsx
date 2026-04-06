"use client";

import { useId, useState } from "react";
import LoadingText from "@/components/LoadingText";
import { useTranslation } from "@/components/LocaleProvider";
import WarmRouteFieldBackdrop from "@/components/shell/WarmRouteFieldBackdrop";
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
  return (
    <main
      className="min-h-screen relative overflow-hidden bg-[#14100d]"
      role="status"
      aria-label={t("didRank_title")}
      aria-busy="true"
    >
      <WarmRouteFieldBackdrop />
      <div
        className="fixed inset-0 z-0 bg-web3-podium-spotlight opacity-[0.42] pointer-events-none"
        aria-hidden
      />
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-scifi-gradient-static opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ref-cyan/8 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_95%_55%_at_50%_-15%,rgba(249,215,121,0.12),transparent_52%),radial-gradient(circle_at_85%_12%,rgba(252,164,124,0.14),transparent_42%),radial-gradient(circle_at_10%_80%,rgba(35,206,217,0.07),transparent_40%)]" />
        <div className="absolute inset-0 bg-ref-silhouette-vignette opacity-[0.55]" />
      </div>

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
          className="rounded-[var(--radius-xl)] border border-white/18 bg-slate-950/55 backdrop-blur-md p-2 sm:p-3 shadow-[0_28px_80px_-32px_rgba(0,0,0,0.78),inset_0_1px_0_rgba(255,255,255,0.07)] flex flex-col lg:flex-row gap-3 lg:gap-0 lg:items-stretch"
          aria-busy="true"
        >
          <div
            className="flex flex-col gap-2 p-3 rounded-[var(--radius-lg)] border border-white/12 bg-gradient-to-b from-slate-900/92 to-slate-950/95 lg:w-[11.5rem] shrink-0 lg:rounded-r-none lg:border-r-2 lg:border-r-cyan-500/25 lg:shadow-[inset_-8px_0_20px_-10px_rgba(0,0,0,0.5)]"
            aria-hidden
          >
            <div className="h-12 w-full rounded-md bg-cyan-500/15 border border-cyan-400/30 animate-pulse" />
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
