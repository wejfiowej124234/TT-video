"use client";

import { useId } from "react";

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
      className={`rounded-[var(--radius-lg)] border border-cyan-400/30 bg-slate-900/65 backdrop-blur-md px-4 py-4 sm:px-6 sm:py-5${mb} shadow-[0_0_36px_-10px_rgba(35,206,217,0.12),0_0_32px_-8px_rgba(217,70,239,0.08)] ring-1 ring-fuchsia-400/20 motion-sub`}
      aria-labelledby={titleId}
      aria-busy="true"
    >
      <h2 id={titleId} className="sr-only">
        {t("didRank_prizePool")}
      </h2>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" aria-hidden>
        <div className="min-w-0 flex-1">
          <div className="h-7 w-56 max-w-full rounded-[var(--radius-sm)] bg-gradient-to-r from-cyan-500/25 to-fuchsia-500/20 animate-pulse" />
          <div className="h-3 w-full max-w-md mt-2 rounded-[var(--radius-sm)] bg-slate-600/45 animate-pulse" />
        </div>
        <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
          <div className="rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 px-4 py-2 sm:px-5 sm:py-2.5 min-w-[10rem] animate-pulse">
            <div className="h-3 w-24 rounded bg-amber-500/20 mb-2" />
            <div className="h-8 w-36 rounded bg-amber-500/15" />
          </div>
          <div className="h-3 w-40 max-w-xs rounded bg-slate-600/35 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
