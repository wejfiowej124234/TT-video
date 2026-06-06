import { describe, expect, it } from "vitest";
import {
  communityFeedMasonryLocationParts,
  communityFeedStableDistanceKm,
} from "./communityFeedLocationDistance";

const t = (key: string) => key;

describe("communityFeedLocationDistance", () => {
  it("returns stable km for same seed", () => {
    expect(communityFeedStableDistanceKm("post-abc")).toBe(communityFeedStableDistanceKm("post-abc"));
    expect(communityFeedStableDistanceKm("post-abc")).not.toBe(communityFeedStableDistanceKm("post-xyz"));
  });

  it("builds masonry location parts from destination", () => {
    const parts = communityFeedMasonryLocationParts({
      id: "p1",
      destination: "京都",
      destinationLabel: "京都",
      type: "photo",
      t,
    });
    expect(parts?.name).toBe("京都");
    expect(parts?.distanceKm).toMatch(/^\d\.\d$/);
  });

  it("falls back to tag when no destination", () => {
    const parts = communityFeedMasonryLocationParts({
      id: "p2",
      tags: ["foodie"],
      type: "photo",
      t,
    });
    expect(parts?.name).toBe("#foodie");
  });

  it("uses type label for staging tags", () => {
    const parts = communityFeedMasonryLocationParts({
      id: "p3",
      tags: ["c5-img-1780266240"],
      type: "photo",
      t,
    });
    expect(parts?.name).toBe("community_type_photo");
  });
});
