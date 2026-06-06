/**
 * Feed 附近锚点 POI（① 本地预设 · ② 接 geo / 酒店 API）
 * View 层只消费 id + label；距离排序留给后续 API。
 */

export type CommunityFeedAnchorPoiId = "gps" | "hotel_lavande" | "city_beijing" | "city_current";

export type CommunityFeedAnchorPoi = {
  id: CommunityFeedAnchorPoiId;
  labelKey: string;
};

export const COMMUNITY_FEED_ANCHOR_POIS: readonly CommunityFeedAnchorPoi[] = [
  { id: "gps", labelKey: "community_anchor_gps" },
  { id: "hotel_lavande", labelKey: "community_anchor_hotel_lavande" },
  { id: "city_beijing", labelKey: "community_anchor_city_beijing" },
  { id: "city_current", labelKey: "community_anchor_city_current" },
] as const;

export const COMMUNITY_FEED_ANCHOR_STORAGE_KEY = "tt_community_feed_anchor_poi_v1";

export function communityFeedDefaultAnchorPoiId(): CommunityFeedAnchorPoiId {
  return "hotel_lavande";
}

export function communityFeedAnchorPoiLabel(
  id: CommunityFeedAnchorPoiId,
  t: (key: string) => string,
): string {
  const row = COMMUNITY_FEED_ANCHOR_POIS.find((p) => p.id === id);
  return row ? t(row.labelKey) : t("community_anchor_poi_label");
}

export function communityFeedParseAnchorPoiId(raw: string | null | undefined): CommunityFeedAnchorPoiId {
  const hit = COMMUNITY_FEED_ANCHOR_POIS.find((p) => p.id === raw);
  return hit?.id ?? communityFeedDefaultAnchorPoiId();
}
