"use client";

import Link from "next/link";
import type { CommunityPost } from "@/lib/communityMockData";
import { CommunityFeedPromoThumb } from "@/components/community/CommunityFeedPromoThumb";
import { communityFeedHotDestinationRows } from "./communityFeedPromoMedia";
import { communityFeedAsideHotRowViewModel } from "./communityFeedAsideRowViewModel";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_FEED_L5 } from "@/lib/marketingUi";

export interface CommunityFeedMobileHotStripProps {
  t: (key: string) => string;
  hotDestinations: readonly string[];
  feedPosts?: readonly CommunityPost[];
}

/** 移动端正文热榜条 · 侧栏不可见时 L5 发现补充（与瀑布热榜同源） */
export function CommunityFeedMobileHotStrip({
  t,
  hotDestinations,
  feedPosts = [],
}: CommunityFeedMobileHotStripProps) {
  const rows = communityFeedHotDestinationRows(hotDestinations, feedPosts, 3);
  if (rows.length === 0) return null;

  return (
    <div className={TT_COMMUNITY_FEED_L5.mobileHotStrip} data-testid="community-feed-mobile-hot-strip">
      <p className="mb-1.5 text-[0.62rem] font-medium text-ref-sun/80">{t("community_feed_promo_hot_badge")}</p>
      <div className={TT_COMMUNITY_FEED_L5.mobileHotStripScroll}>
        {rows.map((row) => {
          const vm = communityFeedAsideHotRowViewModel(row, t);
          return (
            <Link
              key={row.destination}
              href={row.href}
              className={`${TT_COMMUNITY_FEED_L5.mobileHotChip} ${TT_COMMUNITY_FEED_L5.promoCardFocus} ${communityCardLinkFocus}`}
            >
              <span className={TT_COMMUNITY_FEED_L5.mobileHotChipThumb}>
                <CommunityFeedPromoThumb
                  src={row.thumbSrc}
                  sizes="36px"
                  fallback={
                    !row.thumbSrc ? (
                      <span className="absolute inset-0 flex items-center justify-center text-[0.65rem] font-bold text-ref-sun/90">
                        {vm.rank}
                      </span>
                    ) : null
                  }
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className={TT_COMMUNITY_FEED_L5.mobileHotChipTitle}>{vm.label}</span>
                <span className={TT_COMMUNITY_FEED_L5.mobileHotChipMeta}>
                  {vm.scoreLabel} · {vm.checkinsLabel} · {vm.distanceLabel}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
