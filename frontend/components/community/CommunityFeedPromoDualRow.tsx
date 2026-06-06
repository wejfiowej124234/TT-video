"use client";

/** @deprecated 从 `CommunityFeedPromoSlots` 导入；本文件仅保留 re-export 与 deprecated 包装 */
export {
  CommunityFeedPromoActivitySlot,
  CommunityFeedPromoHotRankSlot,
  type CommunityFeedPromoMasonrySlotsProps,
} from "./CommunityFeedPromoSlots";

import { TT_COMMUNITY_FEED_L5 } from "@/lib/marketingUi";
import {
  CommunityFeedPromoActivitySlot,
  CommunityFeedPromoHotRankSlot,
  type CommunityFeedPromoMasonrySlotsProps,
} from "./CommunityFeedPromoSlots";

/** @deprecated 宽屏双卡；推荐流改用 `CommunityFeedPromoLeadBand` */
export function CommunityFeedPromoDualRow({
  t,
  hotDestinations,
  previewPost,
  feedPosts,
}: CommunityFeedPromoMasonrySlotsProps) {
  return (
    <div
      className={TT_COMMUNITY_FEED_L5.promoLeadBand}
      data-testid="community-feed-promo-dual-row"
      aria-label={t("community_feed_promo_row_aria")}
    >
      <CommunityFeedPromoActivitySlot t={t} previewPost={previewPost} />
      <CommunityFeedPromoHotRankSlot t={t} hotDestinations={hotDestinations} feedPosts={feedPosts} />
    </div>
  );
}
