/**
 * Promo 双卡 / 热榜 · L5 展示 ViewModel（①）
 * Domain：`CommunityPost` + `communityFeedHotDestinationRows` → Presentation → View（PromoSlots）
 */

import type { CommunityPost } from "@/lib/communityMockData";
import { DESTINATION_LABEL_KEYS } from "./communityFeedConstants";
import { communityFeedMasonryDisplayTitle } from "./communityFeedDisplayText";
import {
  communityFeedDistanceLabel,
  communityFeedPromoScoreLabel,
  communityFeedStableDistanceKm,
} from "./communityFeedLocationDistance";
import { communityFeedMasonryDistanceDisplay } from "./communityFeedMasonryDistanceDisplay";
import {
  communityFeedPromoActivityHref,
  communityFeedHotDestinationRows,
  communityFeedPromoStillThumbSrc,
  type CommunityFeedHotDestinationRow,
} from "./communityFeedPromoMedia";
import {
  communityFeedPromoHotCheckins,
  communityFeedPromoHotScore,
} from "./communityFeedMasonryAspect";

export type CommunityFeedPromoActivityViewModel = {
  headline: string;
  subline: string;
  thumbSrc: string | undefined;
  href: string;
  eyebrow: string;
  moreLabel: string;
  distanceIsPlaceholder: boolean;
};

export type CommunityFeedPromoHotRowViewModel = {
  destination: string;
  label: string;
  href: string;
  thumbSrc: string | undefined;
  rank: number;
  scoreLabel: string;
  checkinsLabel: string;
  distanceLabel: string;
  distanceIsPlaceholder: boolean;
};

export type CommunityFeedPromoHotRankViewModel = {
  title: string;
  moreHref: string;
  moreLabel: string;
  rows: CommunityFeedPromoHotRowViewModel[];
  emptyHint: string;
};

function resolveDestinationLabel(t: (key: string) => string, dest: string | undefined): string | null {
  if (!dest) return null;
  const key = DESTINATION_LABEL_KEYS[dest];
  return key ? t(key) : dest;
}

export function communityFeedPromoActivityViewModel(
  t: (key: string) => string,
  previewPost: CommunityPost | undefined,
): CommunityFeedPromoActivityViewModel {
  const dash = t("ui_em_dash");
  const thumbSrc = communityFeedPromoStillThumbSrc(previewPost);
  const headlineRaw = communityFeedMasonryDisplayTitle(
    { title: previewPost?.title, content: previewPost?.content, type: previewPost?.type },
    t,
  );
  const headline = headlineRaw !== dash ? headlineRaw : t("community_feed_promo_activity");
  const destLine = resolveDestinationLabel(t, previewPost?.destination);
  const distanceKm = previewPost?.distanceM != null
    ? (previewPost.distanceM / 1000).toFixed(1)
    : communityFeedStableDistanceKm(previewPost?.id ?? "promo-activity");
  const distanceIsPlaceholder = previewPost?.distanceM == null;
  const distanceLabelRaw = communityFeedDistanceLabel(t, distanceKm);
  const distanceLabel = communityFeedMasonryDistanceDisplay({
    distanceLabel: distanceLabelRaw,
    distanceIsPlaceholder,
  });
  const checkinLine = `${t("community_feed_promo_checkin_badge")} | ${headline.slice(0, 18)}`;
  const subline = destLine
    ? `${checkinLine} · ${destLine} ${distanceLabel}`
    : `${checkinLine} · ${distanceLabel}`;

  return {
    headline,
    subline,
    thumbSrc,
    href: communityFeedPromoActivityHref(previewPost),
    eyebrow: t("community_feed_promo_activity"),
    moreLabel: t("community_feed_promo_more"),
    distanceIsPlaceholder,
  };
}

function hotRowToViewModel(
  row: CommunityFeedHotDestinationRow,
  rank: number,
  t: (key: string) => string,
): CommunityFeedPromoHotRowViewModel {
  const labelKey = DESTINATION_LABEL_KEYS[row.destination];
  const label = labelKey ? t(labelKey) : row.destination;
  const checkinsIsPlaceholder = !row.checkinsFromFeedInteraction;
  const scoreIsPlaceholder = !row.scoreFromFeedInteraction;
  const prefix = (s: string, ph: boolean) => (ph ? `~${s}` : s);
  return {
    destination: row.destination,
    label,
    href: row.href,
    thumbSrc: row.thumbSrc,
    rank,
    scoreLabel: prefix(communityFeedPromoScoreLabel(t, row.score), scoreIsPlaceholder),
    checkinsLabel: prefix(
      t("community_feed_promo_checkin_count").replace("{{count}}", String(row.checkins)),
      checkinsIsPlaceholder,
    ),
    distanceLabel: communityFeedMasonryDistanceDisplay({
      distanceLabel: communityFeedDistanceLabel(t, row.distanceKm),
      distanceIsPlaceholder: !row.distanceFromFeedGeo,
    }),
    distanceIsPlaceholder: !row.distanceFromFeedGeo,
  };
}

export function communityFeedPromoHotRankViewModel(
  t: (key: string) => string,
  hotDestinations: readonly string[],
  feedPosts: readonly CommunityPost[],
  limit = 3,
): CommunityFeedPromoHotRankViewModel {
  const rows = communityFeedHotDestinationRows(hotDestinations, feedPosts, limit);
  return {
    title: t("community_feed_promo_hot_badge"),
    moreHref: "/community/explore#explore-destinations",
    moreLabel: t("community_feed_promo_more"),
    emptyHint: t("community_feed_promo_hot_empty"),
    rows: rows.map((row, i) => hotRowToViewModel(row, i + 1, t)),
  };
}

/** Aside / 移动热榜复用 · 稳定评分/打卡（与 aspect 同源） */
export function communityFeedAsideHotRowMetrics(rankIndex: number): {
  score: string;
  checkins: number;
} {
  return {
    score: communityFeedPromoHotScore(rankIndex),
    checkins: communityFeedPromoHotCheckins(rankIndex),
  };
}
