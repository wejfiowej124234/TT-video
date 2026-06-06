import { describe, expect, it } from "vitest";
import {
  COMMUNITY_ME_POSTS_VIS_TABS,
  communityMePostsVisFilterLabelKey,
  parseCommunityMePostsVisQuery,
} from "./communityMePostsVisFilters";

describe("communityMePostsVisFilters", () => {
  it("parseCommunityMePostsVisQuery accepts known keys only", () => {
    expect(parseCommunityMePostsVisQuery(null)).toBe("all");
    expect(parseCommunityMePostsVisQuery("public")).toBe("public");
    expect(parseCommunityMePostsVisQuery("PRIVATE")).toBe("private");
    expect(parseCommunityMePostsVisQuery("nope")).toBe("all");
  });

  it("label key resolves for each tab", () => {
    for (const { key } of COMMUNITY_ME_POSTS_VIS_TABS) {
      expect(communityMePostsVisFilterLabelKey(key)).toMatch(/^community_me_posts_filter_/);
    }
  });
});
