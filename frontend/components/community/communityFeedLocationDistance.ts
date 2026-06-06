/** ① 本地 · 稳定占位距离（无 GPS 真源时 · 美团式 pill 展示） */

export function communityFeedStableDistanceKm(
  seed: string,
  opts?: { min?: number; max?: number },
): string {
  const trimmed = seed.trim();
  if (!trimmed) return "1.0";
  const min = opts?.min ?? 0.3;
  const max = opts?.max ?? 9.9;
  let h = 0;
  for (let i = 0; i < trimmed.length; i++) {
    h = (Math.imul(31, h) + trimmed.charCodeAt(i)) >>> 0;
  }
  const raw = min + ((h % 1000) / 1000) * (max - min);
  return raw.toFixed(1);
}

export function communityFeedDistanceLabel(t: (key: string) => string, km: string): string {
  return t("community_feed_distance_km").replace("{{km}}", km);
}

export function communityFeedPromoScoreLabel(t: (key: string) => string, score: string): string {
  return t("community_feed_score_star").replace("{{score}}", score);
}

import {
  communityFeedMasonryLocationDisplayName,
} from "./communityFeedDisplayText";
import type { CommunityPostType } from "@/lib/communityMockData";

/** 帖子定位 pill · 名称 + 距离（目的地优先 · 过滤 staging slug） */
export function communityFeedMasonryLocationParts(post: {
  id: string;
  destination?: string | null;
  tags?: string[] | null;
  destinationLabel?: string | null;
  type?: CommunityPostType;
  t?: (key: string) => string;
}): { name: string; distanceKm: string } | null {
  const name = post.t
    ? communityFeedMasonryLocationDisplayName({
        destinationLabel: post.destinationLabel,
        destination: post.destination,
        tags: post.tags,
        type: post.type,
        t: post.t,
      })
    : post.destinationLabel?.trim() ||
      post.destination?.trim() ||
      (post.tags?.[0] && !/^(c\d+[-_]|staging)/i.test(post.tags[0]) ? `#${post.tags[0]}` : null);

  if (!name) return null;
  return {
    name,
    distanceKm: communityFeedStableDistanceKm(`${post.id}:${name}`),
  };
}
