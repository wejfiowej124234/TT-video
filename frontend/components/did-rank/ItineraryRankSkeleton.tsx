"use client";

import { useId } from "react";

type TFunc = (key: string) => string;

const TOP3_CARD = [
  "rounded-[var(--radius-md)] border-2 border-ref-cyan/58 bg-slate-900/42 p-2 sm:p-3 shadow-[0_0_28px_-6px_rgba(35,206,217,0.38)]",
  "rounded-[var(--radius-md)] border-2 border-ref-coral/52 bg-slate-900/42 p-2 sm:p-3 shadow-[0_0_26px_-6px_rgba(252,164,124,0.32)]",
  "rounded-[var(--radius-md)] border-2 border-ref-sun/50 bg-slate-900/42 p-2 sm:p-3 shadow-[0_0_24px_-6px_rgba(249,215,121,0.28)]",
] as const;

/** 与 `ItineraryRankBlock` 通栏壳 + Top10 栅格（2/3/5 列）互证；首屏 `isLoading` 时避免误显「无数据」 */
export default function ItineraryRankSkeleton({ t }: { t: TFunc }) {
  const titleId = useId();
  return (
    <section
      className="rounded-[var(--radius-lg)] border border-amber-500/35 bg-slate-900/58 backdrop-blur-md px-4 py-4 sm:px-6 sm:py-5 mt-8 shadow-[0_0_32px_-8px_rgba(251,191,36,0.12),0_0_28px_-6px_rgba(252,164,124,0.08)] ring-1 ring-ref-sun/15"
      aria-labelledby={titleId}
      aria-busy="true"
    >
      <h2 id={titleId} className="sr-only">
        {t("didRank_itineraryRank")}
      </h2>
      <div className="h-6 w-48 max-w-[70%] rounded-[var(--radius-sm)] bg-gradient-to-r from-ref-sun/30 to-fuchsia-500/25 animate-pulse" aria-hidden />
      <div className="h-3 w-full max-w-md mt-2 rounded-[var(--radius-sm)] bg-slate-600/40 animate-pulse" aria-hidden />
      <div className="h-3 w-52 max-w-[55%] mt-2 rounded-[var(--radius-sm)] bg-amber-500/20 animate-pulse" aria-hidden />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mt-4" aria-hidden>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`min-w-0 motion-sub animate-pulse ${i < 3 ? TOP3_CARD[i] : "rounded-[var(--radius-md)] border border-white/10 bg-slate-900/45 p-2 sm:p-3 ring-1 ring-ref-teal/10"}`}
          >
            <div className="mb-1 flex min-h-[30px] items-center justify-between gap-1">
              <div className="h-[30px] w-10 shrink-0 rounded-[var(--radius-sm)] bg-slate-600/55" />
              <div className="h-5 w-14 rounded-[var(--radius-sm)] bg-slate-600/35 hidden sm:block" />
            </div>
            <div className="h-16 sm:h-20 rounded-[var(--radius-md)] bg-slate-700/50 mb-2" />
            <div className="h-3 w-full rounded-[var(--radius-sm)] bg-slate-600/50 mb-1" />
            <div className="h-3 w-2/3 rounded-[var(--radius-sm)] bg-slate-600/40 mb-2" />
            <div className="h-3 w-full rounded-[var(--radius-sm)] bg-slate-600/35 mb-3" />
            <div className="min-h-[44px] w-full rounded-[var(--radius-md)] bg-slate-700/50" />
          </div>
        ))}
      </div>
    </section>
  );
}
