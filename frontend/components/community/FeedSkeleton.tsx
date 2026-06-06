"use client";

import { TT_COMMUNITY_FEED_ACTION, TT_COMMUNITY_FEED_LAYOUT, TT_COMMUNITY_FEED_L5 } from "@/lib/marketingUi";

const SKELETON_ASPECTS = ["aspect-[4/5]", "aspect-[3/4]", "aspect-square", "aspect-[5/6]"] as const;

/** 三列瀑布骨架（L5 · promo 顶栏 + 瀑布） */
export function FeedGridSkeleton({ t }: { t: (k: string) => string }) {
  return (
    <div aria-label={t("common_loading")}>
      <div className={`${TT_COMMUNITY_FEED_L5.promoLeadBand} hidden md:grid`} role="presentation">
        <div className={`${TT_COMMUNITY_FEED_L5.promoLeadCell} ${TT_COMMUNITY_FEED_L5.skeletonPromoActivity}`}>
          <div className="h-[4.75rem] w-[4.75rem] shrink-0 rounded-[var(--radius-sm)] bg-ink-800/70 animate-pulse" />
          <div className="flex flex-1 flex-col justify-between py-1">
            <div className="space-y-1.5">
              <div className="h-2.5 w-16 rounded-[var(--radius-sm)] bg-ink-800/70 animate-pulse" />
              <div className="h-3 w-full rounded-[var(--radius-sm)] bg-ink-800/60 animate-pulse" />
            </div>
            <div className="h-2 w-10 rounded-[var(--radius-sm)] bg-ink-800/50 animate-pulse" />
          </div>
        </div>
        <div className={`${TT_COMMUNITY_FEED_L5.promoLeadCell} ${TT_COMMUNITY_FEED_L5.skeletonPromoHot}`}>
          <div className="h-3 w-20 rounded-[var(--radius-sm)] bg-ink-800/70 animate-pulse" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-10 w-10 shrink-0 rounded-[var(--radius-sm)] bg-ink-800/70 animate-pulse" />
              <div className="h-3 flex-1 rounded-[var(--radius-sm)] bg-ink-800/60 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className={TT_COMMUNITY_FEED_LAYOUT.masonry}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`${TT_COMMUNITY_FEED_ACTION.masonryCardShell} break-inside-avoid animate-pulse`}
            role="presentation"
          >
            <div
              className={`${SKELETON_ASPECTS[i % SKELETON_ASPECTS.length]} ${TT_COMMUNITY_FEED_ACTION.masonryCardMediaShimmer}`}
            />
            <div className={`${TT_COMMUNITY_FEED_L5.masonryCardBody} space-y-2`}>
              <div className="h-3.5 rounded-[var(--radius-sm)] bg-ink-800/80" />
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-full bg-ink-800/80" />
                <div className="h-3 flex-1 rounded-[var(--radius-sm)] bg-ink-800/70" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 31 §5.3：Feed 骨架卡（列表） */
export function FeedSkeleton({ count, t }: { count: number; t: (k: string) => string }) {
  return (
    <div className="space-y-4" aria-label={t("common_loading")}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={TT_COMMUNITY_FEED_ACTION.skeletonCard} role="presentation">
          <div className="aspect-[4/3] bg-slate-800/80 animate-pulse" />
          <div className="p-3 sm:p-4 space-y-2">
            <div className="h-4 bg-slate-700/60 rounded-[var(--radius-sm)] w-3/4 animate-pulse" />
            <div className="h-3 bg-slate-700/50 rounded-[var(--radius-sm)] w-full animate-pulse" />
            <div className="h-3 bg-slate-700/50 rounded-[var(--radius-sm)] w-1/2 animate-pulse" />
            <div className="flex gap-4 pt-2">
              <div className="min-h-[44px] h-11 min-w-[44px] w-16 bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse" />
              <div className="min-h-[44px] h-11 min-w-[44px] w-16 bg-slate-700/50 rounded-[var(--radius-sm)] animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
