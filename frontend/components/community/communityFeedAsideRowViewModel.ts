/**
 * 侧栏 / 移动热榜行 · L5 ViewModel（与 promo 热榜同源）
 */

import { DESTINATION_LABEL_KEYS } from "./communityFeedConstants";
import { communityFeedDistanceLabel, communityFeedPromoScoreLabel } from "./communityFeedLocationDistance";
import { communityFeedMasonryDistanceDisplay } from "./communityFeedMasonryDistanceDisplay";
import type { CommunityFeedHotDestinationRow } from "./communityFeedPromoMedia";

export type CommunityFeedAsideHotRowViewModel = {
  destination: string;
  label: string;
  href: string;
  thumbSrc: string | undefined;
  rank: number;
  scoreLabel: string;
  checkinsLabel: string;
  distanceLabel: string;
  showMeta: boolean;
  distanceIsPlaceholder: boolean;
  checkinsIsPlaceholder: boolean;
  scoreIsPlaceholder: boolean;
};

function communityFeedHotMetricLabel(raw: string, isPlaceholder: boolean): string {
  return isPlaceholder ? `~${raw}` : raw;
}

export function communityFeedAsideHotRowViewModel(
  row: CommunityFeedHotDestinationRow,
  t: (key: string) => string,
  opts?: { showMeta?: boolean },
): CommunityFeedAsideHotRowViewModel {
  const labelKey = DESTINATION_LABEL_KEYS[row.destination];
  const label = labelKey ? t(labelKey) : row.destination;
  const distanceLabel = communityFeedDistanceLabel(t, row.distanceKm);
  const distanceIsPlaceholder = !row.distanceFromFeedGeo;
  const checkinsIsPlaceholder = !row.checkinsFromFeedInteraction;
  const scoreIsPlaceholder = !row.scoreFromFeedInteraction;
  const scoreLabel = communityFeedHotMetricLabel(
    communityFeedPromoScoreLabel(t, row.score),
    scoreIsPlaceholder,
  );
  const checkinsLabel = communityFeedHotMetricLabel(
    t("community_feed_promo_checkin_count").replace("{{count}}", String(row.checkins)),
    checkinsIsPlaceholder,
  );
  return {
    destination: row.destination,
    label,
    href: row.href,
    thumbSrc: row.thumbSrc,
    rank: row.rankIndex + 1,
    scoreLabel,
    checkinsLabel,
    distanceLabel: communityFeedMasonryDistanceDisplay({
      distanceLabel,
      distanceIsPlaceholder,
    }),
    showMeta: opts?.showMeta ?? true,
    distanceIsPlaceholder,
    checkinsIsPlaceholder,
    scoreIsPlaceholder,
  };
}
