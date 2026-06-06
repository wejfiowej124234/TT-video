"use client";

import { DidRankTop10Skeleton } from "@/components/did-rank/DidRankTop10Skeleton";
import { TT_MARKETING_DID_RANK_SURFACE } from "@/lib/marketingUi";

type TFunc = (key: string) => string;

/** 首屏/切换 period：单榜骨架（领奖台同构 + 11～100 列表） */
export default function DidRankSkeleton({ t }: { t: TFunc }) {
  const s = TT_MARKETING_DID_RANK_SURFACE;
  return (
    <section className={s.skeletonBoardInner} aria-hidden>
      <div className={s.skeletonHeader}>
        <div className="h-5 w-40 rounded-[var(--radius-sm)] bg-ink-700/50 animate-pulse" />
        <div className="mt-1.5 h-3 w-72 max-w-full rounded-[var(--radius-sm)] bg-ink-700/40 animate-pulse" />
      </div>
      <div className="p-3 sm:p-4">
        <div className="mb-1.5 h-4 w-24 rounded-[var(--radius-sm)] bg-ink-700/35 animate-pulse" />
        <DidRankTop10Skeleton />
        <div className="mb-1.5 mt-0.5 h-4 w-28 rounded-[var(--radius-sm)] bg-ink-700/35 animate-pulse" />
        <div className={s.skeletonList}>
          <div className={s.rankListStickyHeader} aria-hidden>
            <span className="h-3 w-4 rounded bg-ink-700/40 animate-pulse" />
            <span className="h-3 w-16 rounded bg-ink-700/40 animate-pulse" />
            <span className="h-3 w-12 rounded bg-ink-700/40 animate-pulse ml-auto" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`grid grid-cols-[2.5rem_1fr_auto] items-center gap-2 px-2 py-2 sm:px-3 ${
                i % 2 === 0 ? "bg-ink-900/22" : ""
              } border-b border-ref-sun/10 last:border-b-0`}
            >
              <div className="h-4 w-5 justify-self-end rounded-[var(--radius-sm)] bg-ink-700/50 animate-pulse" />
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-11 w-11 shrink-0 rounded-full bg-ink-700/50 animate-pulse" />
                <div className="h-4 flex-1 max-w-[88px] rounded-[var(--radius-sm)] bg-ink-700/50 animate-pulse" />
              </div>
              <div className="h-4 w-12 rounded-[var(--radius-sm)] bg-ink-700/50 animate-pulse" />
            </div>
          ))}
          <div className={s.skeletonListFooter}>
            <span>{t("didRank_loading")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
