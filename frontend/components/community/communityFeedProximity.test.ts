import { describe, expect, it } from "vitest";
import type { CommunityPost } from "@/lib/communityMockData";
import {
  communityFeedEnrichPostsForAnchor,
  communityFeedFilterByProximity,
  communityFeedProximityMaxM,
} from "./communityFeedProximity";

function post(id: string, partial: Partial<CommunityPost> = {}): CommunityPost {
  return {
    id,
    type: "photo",
    content: "",
    tags: [],
    media_url: "",
    author: { id: "u1", nickname: "U", avatar_url: null, role: "traveler" },
    likes: 0,
    comments: 0,
    collects: 0,
    created_at: "2026-01-01T00:00:00Z",
    ...partial,
  };
}

describe("communityFeedProximity", () => {
  it("caps synthetic distance for 1km filter bucket", () => {
    const enriched = communityFeedEnrichPostsForAnchor(
      [post("a"), post("b")],
      "hotel_lavande",
      null,
      "nearby_1km",
    );
    for (const p of enriched) {
      expect(p.distanceM).toBeLessThanOrEqual(1000);
    }
  });

  it("filters posts within proximity max", () => {
    const enriched = communityFeedEnrichPostsForAnchor(
      [post("near"), post("far", { distanceM: 12000 })],
      "hotel_lavande",
      null,
      "nearby_1km",
    );
    const filtered = communityFeedFilterByProximity(enriched, "nearby_1km", "hotel_lavande");
    expect(filtered.some((p) => p.id === "near")).toBe(true);
    expect(filtered.some((p) => p.id === "far")).toBe(false);
  });

  it("exposes geo query max distance", () => {
    expect(communityFeedProximityMaxM("nearby_1km")).toBe(1000);
    expect(communityFeedProximityMaxM("nearby")).toBe(5000);
    expect(communityFeedProximityMaxM("none")).toBeNull();
  });

  it("preserves API distance when server already filtered", () => {
    const apiPost = post("api-1", { distanceM: 450 });
    const enriched = communityFeedEnrichPostsForAnchor([apiPost], "hotel_lavande", null, "nearby_1km");
    expect(enriched[0]?.distanceM).toBe(450);
  });
});
