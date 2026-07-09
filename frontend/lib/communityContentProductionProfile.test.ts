import { describe, expect, it } from "vitest";
import {
  communityContentReadinessViolations,
  filterCommunityProductionReadyPosts,
} from "./communityContentProductionProfile";
import { isCommunityContentProductionProfile, isLegacyDemoCommunityMediaUrl } from "./communityContentProfile";

describe("communityContentProductionProfile", () => {
  it("detects legacy demo media hosts", () => {
    expect(isLegacyDemoCommunityMediaUrl("https://images.unsplash.com/photo-1")).toBe(true);
    expect(isLegacyDemoCommunityMediaUrl("https://www.w3schools.com/html/mov_bbb.mp4")).toBe(true);
    expect(isLegacyDemoCommunityMediaUrl("/api/v1/media/local.jpg")).toBe(false);
  });

  it("filters showcase ids and unsplash from API posts", () => {
    const posts = [
      { id: "tt-showcase-post-001", author: { id: "tt-demo-mei" }, media_url: "https://x/y.jpg" },
      { id: "real-1", author: { id: "u1" }, media_urls: ["https://images.unsplash.com/x"] },
      { id: "real-2", author: { id: "u2" }, media_url: "https://api.example/media/a.jpg" },
    ];
    const filtered = filterCommunityProductionReadyPosts(posts);
    expect(filtered.map((p) => p.id)).toEqual(["real-2"]);
    expect(communityContentReadinessViolations(posts).length).toBeGreaterThan(0);
  });

  it("production profile on NODE_ENV=production", () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    expect(isCommunityContentProductionProfile()).toBe(true);
    process.env.NODE_ENV = prev;
  });
});
