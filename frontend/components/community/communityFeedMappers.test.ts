import { describe, expect, it } from "vitest";
import { mapApiPostToCommunityPost, type ApiPostInput } from "./communityFeedMappers";

const base: ApiPostInput = {
  id: "p1",
  user_id: "00000000-0000-4000-8000-000000000001",
  body: "hello",
  post_type: "text",
  tags: [],
  media_urls: [],
  created_at: "2026-04-20T12:00:00Z",
};

describe("mapApiPostToCommunityPost", () => {
  it("maps commerce_showcase_kind and commerce_market_listing_id when valid", () => {
    const post = mapApiPostToCommunityPost({
      ...base,
      commerce_showcase_kind: "acquisition_led",
      commerce_market_listing_id: "00000000-0000-4000-8000-000000000099",
    });
    expect(post.commerceShowcaseKind).toBe("acquisition_led");
    expect(post.commerceMarketListingId).toBe("00000000-0000-4000-8000-000000000099");
  });

  it("ignores unknown commerce_showcase_kind", () => {
    const post = mapApiPostToCommunityPost({
      ...base,
      commerce_showcase_kind: "bogus_kind",
    });
    expect(post.commerceShowcaseKind).toBeUndefined();
  });

  it("trims commerce_market_listing_id", () => {
    const post = mapApiPostToCommunityPost({
      ...base,
      commerce_market_listing_id: "  00000000-0000-4000-8000-000000000099  ",
    });
    expect(post.commerceMarketListingId).toBe("00000000-0000-4000-8000-000000000099");
  });
});
