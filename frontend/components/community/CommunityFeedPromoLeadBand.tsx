"use client";

import type { CommunityPost } from "@/lib/communityMockData";
import {
  CommunityFeedPromoActivitySlot,
  CommunityFeedPromoHotRankSlot,
} from "./CommunityFeedPromoSlots";
import { TT_COMMUNITY_FEED_L5 } from "@/lib/marketingUi";

export interface CommunityFeedPromoLeadBandProps {
  t: (key: string) => string;
  hotDestinations: readonly string[];
  feedPosts?: readonly CommunityPost[];
  previewPost?: CommunityPost;
}

/** 推荐首屏 · 美团式双卡顶栏（独立于三列瀑布，避免列内错位） */
export function CommunityFeedPromoLeadBand({
  t,
  hotDestinations,
  feedPosts = [],
  previewPost,
}: CommunityFeedPromoLeadBandProps) {
  return (
    <div className={TT_COMMUNITY_FEED_L5.promoLeadBand} data-testid="community-feed-promo-lead-band">
      <CommunityFeedPromoActivitySlot t={t} previewPost={previewPost} />
      <CommunityFeedPromoHotRankSlot t={t} hotDestinations={[...hotDestinations]} feedPosts={feedPosts} />
    </div>
  );
}
