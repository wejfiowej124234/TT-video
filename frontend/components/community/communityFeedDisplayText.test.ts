import { describe, expect, it } from "vitest";
import {
  communityFeedIsStagingSlug,
  communityFeedMasonryDisplayTitle,
  communityFeedMasonryLocationDisplayName,
  communityFeedSanitizeStagingLabel,
} from "./communityFeedDisplayText";

const t = (key: string) => key;

describe("communityFeedDisplayText", () => {
  it("detects staging slugs", () => {
    expect(communityFeedIsStagingSlug("c5-img-1780266240")).toBe(true);
    expect(communityFeedIsStagingSlug("京都")).toBe(false);
  });

  it("prefers destination over generic type for staging titles", () => {
    expect(
      communityFeedMasonryDisplayTitle(
        { title: "c5-staging-x", type: "photo", destination: "京都" },
        t,
      ),
    ).toBe("京都");
    expect(
      communityFeedMasonryDisplayTitle(
        { title: "c5-staging-x", type: "video", authorNickname: "C4 Video" },
        t,
      ),
    ).toBe("community_type_video");
    expect(
      communityFeedMasonryDisplayTitle(
        { title: "c5-staging-x", type: "photo", venueName: "丽枫酒店", destination: "北京" },
        t,
      ),
    ).toBe("丽枫酒店");
  });

  it("uses type fallback for location when tag is staging", () => {
    expect(
      communityFeedMasonryLocationDisplayName({
        tags: ["c5-img-1780266240"],
        type: "food",
        t,
      }),
    ).toBe("community_type_food");
  });
});
