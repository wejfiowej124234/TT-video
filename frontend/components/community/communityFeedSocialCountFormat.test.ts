import { describe, expect, it } from "vitest";
import { communityFeedSocialCountFormat } from "./communityFeedSocialCountFormat";

describe("communityFeedSocialCountFormat", () => {
  it("formats k and w abbreviations", () => {
    expect(communityFeedSocialCountFormat(0)).toBe("0");
    expect(communityFeedSocialCountFormat(999)).toBe("999");
    expect(communityFeedSocialCountFormat(1200)).toBe("1.2k");
    expect(communityFeedSocialCountFormat(10000)).toBe("1w");
    expect(communityFeedSocialCountFormat(12500)).toBe("1.3w");
  });
});
