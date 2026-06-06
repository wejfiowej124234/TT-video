/**
 * Feed 附近 / 1km · ① 客户端距离 enrich + 筛选（② API `distance_m` / bbox 真源）
 */

import type { CommunityPost } from "@/lib/communityMockData";
import type { CommunityFeedAnchorPoiId } from "./communityFeedAnchorPoi";
import { communityFeedStableDistanceKm } from "./communityFeedLocationDistance";

export type CommunityFeedProximityFilter = "none" | "nearby" | "nearby_1km";

export type CommunityFeedGeoCoords = { lat: number; lng: number } | null;

/** 锚点 → 目的地 hint（城市锚点时优先同城帖） */
export function communityFeedAnchorDestinationHint(
  anchorPoiId: CommunityFeedAnchorPoiId,
): string | null {
  if (anchorPoiId === "city_beijing") return "北京";
  return null;
}

export function communityFeedProximityMaxM(filter: CommunityFeedProximityFilter): number | null {
  if (filter === "nearby_1km") return 1000;
  if (filter === "nearby") return 5000;
  return null;
}

function distanceSeed(
  post: CommunityPost,
  anchorPoiId: CommunityFeedAnchorPoiId,
  gps: CommunityFeedGeoCoords,
): string {
  const gpsPart = gps ? `${gps.lat.toFixed(4)},${gps.lng.toFixed(4)}` : "";
  const name = post.venueName?.trim() || post.destination?.trim() || post.id;
  return `${anchorPoiId}:${gpsPart}:${post.id}:${name}`;
}

/** ① 无 API `distance_m` 时 · 锚点稳定占位（米） */
export function communityFeedSyntheticDistanceM(
  post: CommunityPost,
  anchorPoiId: CommunityFeedAnchorPoiId,
  gps: CommunityFeedGeoCoords = null,
  proximityFilter: CommunityFeedProximityFilter = "none",
): number {
  const maxKm = proximityFilter === "nearby_1km" ? 0.95 : proximityFilter === "nearby" ? 4.8 : 9.5;
  const km = parseFloat(
    communityFeedStableDistanceKm(distanceSeed(post, anchorPoiId, gps), {
      min: 0.2,
      max: maxKm,
    }),
  );
  return Math.round(km * 1000);
}

export function communityFeedPostEffectiveDistanceM(
  post: CommunityPost,
  anchorPoiId: CommunityFeedAnchorPoiId,
  gps: CommunityFeedGeoCoords = null,
  proximityFilter: CommunityFeedProximityFilter = "none",
): number {
  if (post.distanceM != null && Number.isFinite(post.distanceM) && post.distanceM >= 0) {
    return post.distanceM;
  }
  return communityFeedSyntheticDistanceM(post, anchorPoiId, gps, proximityFilter);
}

/** Domain 帖 enrich · 写入可筛选 `distanceM`（不 mutate 入参） */
export function communityFeedEnrichPostsForAnchor(
  posts: readonly CommunityPost[],
  anchorPoiId: CommunityFeedAnchorPoiId,
  gps: CommunityFeedGeoCoords = null,
  proximityFilter: CommunityFeedProximityFilter = "none",
): CommunityPost[] {
  return posts.map((p) => {
    if (p.distanceM != null && Number.isFinite(p.distanceM)) return p;
    return {
      ...p,
      distanceM: communityFeedSyntheticDistanceM(p, anchorPoiId, gps, proximityFilter),
    };
  });
}

export function communityFeedFilterByProximity(
  posts: readonly CommunityPost[],
  filter: CommunityFeedProximityFilter,
  anchorPoiId: CommunityFeedAnchorPoiId,
  gps: CommunityFeedGeoCoords = null,
): CommunityPost[] {
  const maxM = communityFeedProximityMaxM(filter);
  if (maxM == null) return [...posts];

  const destHint = communityFeedAnchorDestinationHint(anchorPoiId);
  let list = posts.filter(
    (p) => communityFeedPostEffectiveDistanceM(p, anchorPoiId, gps, filter) <= maxM,
  );

  if (destHint) {
    const sameCity = list.filter((p) => p.destination === destHint);
    const other = list.filter((p) => p.destination !== destHint);
    list = [...sameCity, ...other];
  }

  list.sort(
    (a, b) =>
      communityFeedPostEffectiveDistanceM(a, anchorPoiId, gps, filter) -
      communityFeedPostEffectiveDistanceM(b, anchorPoiId, gps, filter),
  );
  return list;
}

export function communityFeedGeoQueryFromDiscovery(
  anchorPoiId: CommunityFeedAnchorPoiId,
  proximityFilter: CommunityFeedProximityFilter,
  gps: CommunityFeedGeoCoords,
): {
  anchor_poi_id?: string;
  max_distance_m?: number;
  anchor_lat?: number;
  anchor_lng?: number;
} {
  const maxM = communityFeedProximityMaxM(proximityFilter);
  const q: {
    anchor_poi_id?: string;
    max_distance_m?: number;
    anchor_lat?: number;
    anchor_lng?: number;
  } = { anchor_poi_id: anchorPoiId };
  if (maxM != null) q.max_distance_m = maxM;
  if (gps && Number.isFinite(gps.lat) && Number.isFinite(gps.lng)) {
    q.anchor_lat = gps.lat;
    q.anchor_lng = gps.lng;
  }
  return q;
}
