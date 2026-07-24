/**
 * Feed 附近锚点（生产级 · HU-015）
 * 可见项：GPS 当前位置 · 当前城市。遗留 id 仍可解析（兼容 localStorage / API）。
 */

export type CommunityFeedAnchorPoiId = "gps" | "hotel_lavande" | "city_beijing" | "city_current";

export type CommunityFeedAnchorPoi = {
  id: CommunityFeedAnchorPoiId;
  labelKey: string;
};

/** UI 下拉仅生产项 */
export const COMMUNITY_FEED_ANCHOR_POIS: readonly CommunityFeedAnchorPoi[] = [
  { id: "gps", labelKey: "community_anchor_gps" },
  { id: "city_current", labelKey: "community_anchor_city_current" },
] as const;

const LEGACY_ANCHOR_IDS: readonly CommunityFeedAnchorPoiId[] = [
  "gps",
  "city_current",
  "city_beijing",
  "hotel_lavande",
] as const;

export const COMMUNITY_FEED_ANCHOR_STORAGE_KEY = "tt_community_feed_anchor_poi_v1";

export function communityFeedDefaultAnchorPoiId(): CommunityFeedAnchorPoiId {
  return "gps";
}

export function communityFeedAnchorPoiLabel(
  id: CommunityFeedAnchorPoiId,
  t: (key: string) => string,
): string {
  const row =
    COMMUNITY_FEED_ANCHOR_POIS.find((p) => p.id === id) ??
    ({
      gps: { id: "gps" as const, labelKey: "community_anchor_gps" },
      city_current: { id: "city_current" as const, labelKey: "community_anchor_city_current" },
      city_beijing: { id: "city_beijing" as const, labelKey: "community_anchor_city_beijing" },
      hotel_lavande: { id: "hotel_lavande" as const, labelKey: "community_anchor_hotel_lavande" },
    }[id]);
  return row ? t(row.labelKey) : t("community_anchor_poi_label");
}

export function communityFeedParseAnchorPoiId(raw: string | null | undefined): CommunityFeedAnchorPoiId {
  if (raw && (LEGACY_ANCHOR_IDS as readonly string[]).includes(raw)) {
    // Migrate debug hotel default → GPS
    if (raw === "hotel_lavande") return communityFeedDefaultAnchorPoiId();
    return raw as CommunityFeedAnchorPoiId;
  }
  return communityFeedDefaultAnchorPoiId();
}
