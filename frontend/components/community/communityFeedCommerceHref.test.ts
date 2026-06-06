import { describe, expect, it } from "vitest";
import { communityFeedCommerceListingHref } from "./communityFeedCommerceHref";

describe("communityFeedCommerceListingHref", () => {
  it("routes acquisition listings", () => {
    expect(
      communityFeedCommerceListingHref({
        commerceMarketListingId: "abc-123",
        commerceShowcaseKind: "acquisition_led",
      }),
    ).toBe("/market/acquisition/abc-123");
  });

  it("routes provider showcase listings", () => {
    expect(
      communityFeedCommerceListingHref({
        commerceMarketListingId: "xyz",
        commerceShowcaseKind: "lodging_led",
      }),
    ).toBe("/market/provider/showcase/xyz");
  });

  it("returns undefined without listing id", () => {
    expect(communityFeedCommerceListingHref({})).toBeUndefined();
  });
});
