import { describe, expect, it } from "vitest";
import { communityFeedMasonryDistanceDisplay } from "./communityFeedMasonryDistanceDisplay";

describe("communityFeedMasonryDistanceDisplay", () => {
  it("prefixes approximate distances with tilde", () => {
    expect(
      communityFeedMasonryDistanceDisplay({
        distanceLabel: "2.5km",
        distanceIsPlaceholder: true,
      }),
    ).toBe("~2.5km");
    expect(
      communityFeedMasonryDistanceDisplay({
        distanceLabel: "1.1km",
        distanceIsPlaceholder: false,
      }),
    ).toBe("1.1km");
  });
});
