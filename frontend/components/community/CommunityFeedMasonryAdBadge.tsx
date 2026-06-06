"use client";

import { TT_COMMUNITY_FEED_L5 } from "@/lib/marketingUi";

/** 赞助/广告角标（美团式「广告」） */
export function CommunityFeedMasonryAdBadge({ label }: { label: string }) {
  return (
    <span className={TT_COMMUNITY_FEED_L5.masonryAdBadge} aria-label={label}>
      {label}
    </span>
  );
}
