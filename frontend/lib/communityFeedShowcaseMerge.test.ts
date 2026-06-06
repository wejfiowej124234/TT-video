import { describe, expect, it } from "vitest";
import {
  filterProductionCommunityPosts,
  injectShowcaseVideosIntoFeed,
  isAutomationCommunityPostBody,
  resolveCommunityFeedAppendPosts,
  resolveCommunityFeedDisplayPosts,
} from "./communityFeedShowcaseMerge";

describe("communityFeedShowcaseMerge", () => {
  it("detects automation bodies", () => {
    expect(isAutomationCommunityPostBody("e2e-comment-flow-1")).toBe(true);
    expect(isAutomationCommunityPostBody("pi1-fe-text-9")).toBe(true);
    expect(isAutomationCommunityPostBody("清晨的祇园石板路")).toBe(false);
    expect(isAutomationCommunityPostBody("11")).toBe(false);
  });

  it("filters automation from API posts", () => {
    const posts = [
      { id: "1", content: "e2e-x", type: "text" as const, author: { id: "a", nickname: "x" } },
      { id: "2", content: "京都赏樱", type: "text" as const, author: { id: "b", nickname: "y" } },
    ];
    expect(filterProductionCommunityPosts(posts as never)).toHaveLength(1);
  });

  it("falls back to showcase when only automation posts", () => {
    const prev = process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE;
    process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE = "1";
    try {
      const onlyTest = [
        { id: "1", content: "pi1-fe-1", type: "text" as const, author: { id: "a", nickname: "t" } },
      ];
      const resolved = resolveCommunityFeedDisplayPosts(onlyTest as never, "latest");
      expect(resolved.length).toBeGreaterThan(1);
      expect(resolved.some((p) => p.content.includes("祇园") || p.content.includes("京都"))).toBe(true);
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE;
      else process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE = prev;
    }
  });

  it("filters C4/C5 staging smoke and merges showcase when feed is thin", () => {
    const prev = process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE;
    process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE = "1";
    try {
      const staging = [
        {
          id: "s1",
          content: "c5-staging-image-delivery-123",
          type: "photo" as const,
          author: { id: "a", nickname: "C5 Image" },
        },
        {
          id: "s2",
          content: "c4-staging-video-playback-456",
          type: "video" as const,
          is_video: true,
          author: { id: "b", nickname: "C4 Video" },
        },
      ];
      const resolved = resolveCommunityFeedDisplayPosts(staging as never, "latest");
      expect(resolved.some((p) => p.author?.nickname === "C5 Image")).toBe(false);
      expect(resolved.some((p) => p.content.includes("祇园") || p.author?.nickname?.includes("Aurora"))).toBe(
        true,
      );
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE;
      else process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE = prev;
    }
  });

  it("injects showcase videos when API feed is thin", () => {
    const prev = process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE;
    process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE = "1";
    try {
      const apiOnlyPhotos = Array.from({ length: 5 }, (_, i) => ({
        id: `api-photo-${i}`,
        type: "photo" as const,
        content: `京都走拍 ${i}`,
        media_url: "https://example.com/a.jpg",
        author: { id: `u-${i}`, nickname: `User ${i}` },
        created_at: new Date().toISOString(),
        likes: 1,
        comments: 0,
        collects: 0,
      }));
      const resolved = resolveCommunityFeedDisplayPosts(apiOnlyPhotos as never, "latest");
      const videos = resolved.filter((p) => p.is_video || p.type === "video");
      expect(videos.length).toBeGreaterThanOrEqual(1);
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE;
      else process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE = prev;
    }
  });

  it("does not inject showcase videos when API feed is full", () => {
    const prev = process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE;
    process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE = "1";
    try {
      const apiOnlyPhotos = Array.from({ length: 10 }, (_, i) => ({
        id: `api-photo-${i}`,
        type: "photo" as const,
        content: `京都走拍 ${i}`,
        media_url: "https://example.com/a.jpg",
        author: { id: `u-${i}`, nickname: `User ${i}` },
        created_at: new Date().toISOString(),
        likes: 1,
        comments: 0,
        collects: 0,
      }));
      const resolved = resolveCommunityFeedDisplayPosts(apiOnlyPhotos as never, "latest");
      expect(resolved.filter((p) => p.id.startsWith("tt-showcase-post-"))).toHaveLength(0);
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE;
      else process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE = prev;
    }
  });

  it("filters PG seed duplicates when showcase personas overlap", () => {
    const prev = process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE;
    process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE = "1";
    try {
      const pgYuki = {
        id: "00000000-0000-4000-8000-000000000405",
        type: "photo" as const,
        content: "PG seed yuki post",
        author: { id: "pg-yuki", nickname: "Yuki 周末飞" },
        created_at: new Date().toISOString(),
        likes: 1,
        comments: 0,
        collects: 0,
      };
      const resolved = resolveCommunityFeedDisplayPosts([pgYuki] as never, "latest");
      expect(resolved.some((p) => p.author?.nickname === "Yuki 周末飞" && p.id.startsWith("tt-showcase"))).toBe(
        true,
      );
      expect(resolved.some((p) => p.id === pgYuki.id)).toBe(false);
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE;
      else process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE = prev;
    }
  });

  it("injectShowcaseVideosIntoFeed places videos at stable slots", () => {
    const photos = [{ id: "p1" }, { id: "p2" }, { id: "p3" }] as never[];
    const videos = [{ id: "v1", type: "video", is_video: true }] as never[];
    const out = injectShowcaseVideosIntoFeed(photos, videos);
    expect(out.map((p) => p.id)).toEqual(["p1", "v1", "p2", "p3"]);
  });

  it("resolveCommunityFeedAppendPosts filters without injecting showcase videos", () => {
    const prev = process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE;
    process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE = "1";
    try {
      const apiOnlyPhotos = Array.from({ length: 5 }, (_, i) => ({
        id: `api-photo-${i}`,
        type: "photo" as const,
        content: `京都走拍 ${i}`,
        media_url: "https://example.com/a.jpg",
        author: { id: `u-${i}`, nickname: `User ${i}` },
        created_at: new Date().toISOString(),
        likes: 1,
        comments: 0,
        collects: 0,
      }));
      const initial = resolveCommunityFeedDisplayPosts(apiOnlyPhotos as never, "latest");
      const append = resolveCommunityFeedAppendPosts(apiOnlyPhotos as never);
      expect(initial.filter((p) => p.id.startsWith("tt-showcase-post-")).length).toBeGreaterThan(0);
      expect(append.filter((p) => p.id.startsWith("tt-showcase-post-"))).toHaveLength(0);
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE;
      else process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE = prev;
    }
  });
});
