import { describe, expect, it } from "vitest";
import {
  communityFeedMasonryMediaAspectClass,
  communityFeedPromoHotCheckins,
  communityFeedPromoHotScore,
} from "./communityFeedMasonryAspect";

const VIDEO_ASPECTS = ["aspect-[9/16]", "aspect-[4/5]", "aspect-[3/4]"];
const FOOD_ASPECTS = ["aspect-square", "aspect-[4/5]", "aspect-[3/4]"];
const PHOTO_ASPECTS = ["aspect-[3/4]", "aspect-[4/5]", "aspect-[5/6]"];
const TRAVEL_ASPECTS = ["aspect-[5/6]", "aspect-[4/5]", "aspect-[3/4]"];

describe("communityFeedMasonryAspect", () => {
  it("maps post types to aspect pools (id-stable stagger)", () => {
    const video = communityFeedMasonryMediaAspectClass({
      id: "post-video-1",
      type: "video",
      is_video: true,
    });
    expect(VIDEO_ASPECTS).toContain(video);

    const food = communityFeedMasonryMediaAspectClass({
      id: "post-food-1",
      type: "food",
      is_video: false,
    });
    expect(FOOD_ASPECTS).toContain(food);

    const photo = communityFeedMasonryMediaAspectClass({
      id: "post-photo-1",
      type: "photo",
      is_video: false,
    });
    expect(PHOTO_ASPECTS).toContain(photo);

    const travel = communityFeedMasonryMediaAspectClass({
      id: "post-travel-1",
      type: "travel",
      is_video: false,
    });
    expect(TRAVEL_ASPECTS).toContain(travel);
  });

  it("keeps aspect stable for same post id", () => {
    const post = { id: "stable-id-abc", type: "photo" as const, is_video: false };
    expect(communityFeedMasonryMediaAspectClass(post)).toBe(
      communityFeedMasonryMediaAspectClass(post),
    );
  });

  it("derives stable hot-rank display metrics", () => {
    expect(communityFeedPromoHotScore(0)).toBe("4.9");
    expect(communityFeedPromoHotScore(1)).toBe("4.8");
    expect(communityFeedPromoHotCheckins(0)).toBeGreaterThan(communityFeedPromoHotCheckins(1));
  });
});
