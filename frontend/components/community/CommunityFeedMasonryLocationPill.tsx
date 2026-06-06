"use client";

import { TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";
import type { CommunityFeedMasonryLocationViewModel } from "@/components/community/communityFeedMasonryCardViewModel";
import { communityFeedMasonryDistanceDisplay } from "@/components/community/communityFeedMasonryDistanceDisplay";

function LocationPinIcon() {
  return (
    <svg
      className={TT_COMMUNITY_FEED_ACTION.masonryLocationPillIcon}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
    </svg>
  );
}

/** 瀑布 / 紧凑网格共用 · 美团式左下定位 pill（仅消费 ViewModel） */
export function CommunityFeedMasonryLocationPill({
  location,
  approxHint,
}: {
  location: CommunityFeedMasonryLocationViewModel;
  /** i18n · 占位距离 tooltip / aria */
  approxHint?: string;
}) {
  const distanceText = communityFeedMasonryDistanceDisplay(location);
  const isApprox = location.distanceIsPlaceholder;

  return (
    <span
      className={TT_COMMUNITY_FEED_ACTION.masonryLocationPill}
      title={isApprox ? approxHint : undefined}
      aria-label={
        isApprox && approxHint ? `${location.name}, ${distanceText}, ${approxHint}` : undefined
      }
    >
      <LocationPinIcon />
      <span className={TT_COMMUNITY_FEED_ACTION.masonryLocationPillName}>{location.name}</span>
      <span className={TT_COMMUNITY_FEED_ACTION.masonryLocationPillSep} aria-hidden>
        |
      </span>
      <span className={TT_COMMUNITY_FEED_ACTION.masonryLocationPillDistance}>{distanceText}</span>
      {isApprox ? (
        <span className="sr-only">{approxHint}</span>
      ) : null}
    </span>
  );
}
