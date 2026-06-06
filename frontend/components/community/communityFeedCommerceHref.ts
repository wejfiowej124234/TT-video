import type { CommunityPost } from "@/lib/communityMockData";

/** 瀑布卡商链 CTA · 按 showcase kind 路由（① · mapper 同源） */
export function communityFeedCommerceListingHref(
  post: Pick<CommunityPost, "commerceMarketListingId" | "commerceShowcaseKind">,
): string | undefined {
  const id = post.commerceMarketListingId?.trim();
  if (!id) return undefined;
  const enc = encodeURIComponent(id);
  switch (post.commerceShowcaseKind) {
    case "acquisition_led":
      return `/market/acquisition/${enc}`;
    case "lodging_led":
    case "itinerary_led":
    case "general_led":
      return `/market/provider/showcase/${enc}`;
    default:
      return `/market?listing=${enc}`;
  }
}
