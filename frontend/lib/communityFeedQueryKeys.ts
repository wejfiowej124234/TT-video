import type { CommunityFeedApiMode } from "@/components/community/useCommunityFeedApi";
import type { CommunityFeedGeoQuery } from "@/components/community/communityFeedGeoQuery";

export const FEED_API_PAGE_SIZE = 20;
export const COMMUNITY_FEED_STALE_MS = 30_000;

export function communityFeedGeoKey(geo?: CommunityFeedGeoQuery): string {
  return JSON.stringify(geo ?? {});
}

export function communityFeedQueryKey(
  mode: CommunityFeedApiMode,
  tag: string | null,
  geoKey: string,
  geoRevision: number,
  textQ: string | null = null,
): readonly ["community", "feed", CommunityFeedApiMode, string, string, number, string] {
  return ["community", "feed", mode, tag ?? "", geoKey, geoRevision, textQ ?? ""] as const;
}

export function buildCommunityFeedParams(
  mode: CommunityFeedApiMode,
  tag: string | null,
  geo?: CommunityFeedGeoQuery,
  cursor?: string,
  textQ?: string | null,
) {
  const q = textQ?.trim().slice(0, 64);
  return {
    limit: FEED_API_PAGE_SIZE,
    mode,
    ...(cursor ? { cursor } : {}),
    ...(tag ? { tag } : {}),
    ...(q && q.length > 0 ? { q } : {}),
    ...(geo?.anchor_poi_id ? { anchor_poi_id: geo.anchor_poi_id } : {}),
    ...(geo?.max_distance_m != null ? { max_distance_m: geo.max_distance_m } : {}),
    ...(geo?.anchor_lat != null ? { anchor_lat: geo.anchor_lat } : {}),
    ...(geo?.anchor_lng != null ? { anchor_lng: geo.anchor_lng } : {}),
  };
}
