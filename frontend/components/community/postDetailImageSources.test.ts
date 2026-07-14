import { describe, expect, it } from "vitest";
import type { CommunityPost } from "@/lib/communityMockData";
import { resolvePostDetailImageSources } from "./postDetailImageSources";

describe("resolvePostDetailImageSources", () => {
  it("falls back to cover_url when media list empty", () => {
    const post = {
      id: "p1",
      type: "photo",
      media_url: "",
      cover_url: "https://cdn.example/cover.jpg",
    } as CommunityPost;
    expect(resolvePostDetailImageSources(post)).toEqual(["https://cdn.example/cover.jpg"]);
  });

  it("aligns with feed grid thumb (cover before media_urls)", () => {
    const post = {
      id: "p2",
      type: "photo",
      media_urls: ["/a.jpg", "/b.jpg"],
      cover_url: "https://cdn.example/cover.jpg",
    } as CommunityPost;
    expect(resolvePostDetailImageSources(post)).toEqual([
      "https://cdn.example/cover.jpg",
      "/a.jpg",
      "/b.jpg",
    ]);
  });

  it("returns empty list for video posts", () => {
    const post = {
      id: "v1",
      type: "video",
      is_video: true,
      media_urls: ["/clip.mp4", "/cover.jpg"],
      cover_url: "https://cdn.example/cover.jpg",
    } as CommunityPost;
    expect(resolvePostDetailImageSources(post)).toEqual([]);
  });

  it("filters playable video urls from photo posts", () => {
    const post = {
      id: "p3",
      type: "photo",
      media_urls: ["/a.jpg", "/b.mp4", "/c.webp"],
    } as CommunityPost;
    expect(resolvePostDetailImageSources(post)).toEqual(["/a.jpg", "/c.webp"]);
  });
});
