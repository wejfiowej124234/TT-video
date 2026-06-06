import { describe, expect, it } from "vitest";

import {
  COMMUNITY_FEED_MASONRY_TINY_IMAGE_MAX_PX,
  communityFeedMasonryImageIsTiny,
} from "./communityFeedMasonryMediaDisplay";

describe("communityFeedMasonryMediaDisplay", () => {
  it("treats 1x1 smoke PNG as tiny", () => {
    expect(communityFeedMasonryImageIsTiny(1, 1)).toBe(true);
  });

  it("treats normal feed thumbs as not tiny", () => {
    expect(communityFeedMasonryImageIsTiny(800, 600)).toBe(false);
    expect(communityFeedMasonryImageIsTiny(COMMUNITY_FEED_MASONRY_TINY_IMAGE_MAX_PX + 1, 100)).toBe(
      false,
    );
  });
});
