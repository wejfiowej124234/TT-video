/** Public Operations statistics → admin list drill-down hrefs. */

export type PublicOperationsStatsTrack =
  | "guides"
  | "orders"
  | "market_listings"
  | "community_posts";

export function publicOperationsDrillDownHref(
  track: PublicOperationsStatsTrack,
  dataOrigin: string,
): string | null {
  const origin = dataOrigin.trim();
  if (!origin) return null;
  const q = `data_origin=${encodeURIComponent(origin)}`;
  switch (track) {
    case "guides":
      return `/admin/guides?${q}`;
    case "orders":
      return `/admin/orders?${q}`;
    case "community_posts":
      return `/admin/community/reports?${q}`;
    case "market_listings":
      return null;
    default:
      return null;
  }
}
