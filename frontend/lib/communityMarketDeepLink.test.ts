import { describe, expect, it } from "vitest";
import { COMMUNITY_USER_MARKET_QUERY, marketHrefForCommunityUser } from "./communityMarketDeepLink";

describe("communityMarketDeepLink", () => {
  it("builds market URL with community user id and guides view", () => {
    const href = marketHrefForCommunityUser("550e8400-e29b-41d4-a716-446655440000");
    expect(href.startsWith("/market?")).toBe(true);
    const u = new URLSearchParams(href.slice("/market?".length));
    expect(u.get(COMMUNITY_USER_MARKET_QUERY)).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(u.get("view")).toBe("guides");
  });

  it("trims user id", () => {
    const href = marketHrefForCommunityUser("  abc  ");
    expect(new URLSearchParams(href.split("?")[1] ?? "").get(COMMUNITY_USER_MARKET_QUERY)).toBe("abc");
  });
});
