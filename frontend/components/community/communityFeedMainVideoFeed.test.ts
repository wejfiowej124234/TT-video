import { describe, expect, it } from "vitest";
import { buildCommunityVideoFeedItems } from "./communityFeedMainVideoFeed";
import type { CommunityPost } from "@/lib/communityMockData";

const basePost = (over: Partial<CommunityPost>): CommunityPost => ({
  id: "p-vid",
  type: "video",
  content: "clip",
  media_url: "https://cdn.example.test/v.mp4",
  tags: [],
  author: { id: "u1", nickname: "n1", avatar_url: null, role: "traveler" },
  likes: 0,
  comments: 0,
  collects: 0,
  created_at: "2026-05-16T00:00:00Z",
  is_video: true,
  ...over,
});

describe("buildCommunityVideoFeedItems", () => {
  it("passes primaryMediaAssetId into overlay feed items", () => {
    const posts = [
      basePost({
        id: "p1",
        primaryMediaAssetId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        media_url: "https://cdn.example.test/playback/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.mp4",
      }),
    ];
    const items = buildCommunityVideoFeedItems(posts);
    expect(items).toHaveLength(1);
    expect(items[0]?.primaryMediaAssetId).toBe("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    expect(items[0]?.videoUrl).toBe(
      "http://127.0.0.1:19000/traveltrust-community-media/community/media/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.mp4",
    );
  });

  it("omits primaryMediaAssetId when absent", () => {
    const items = buildCommunityVideoFeedItems([basePost({ id: "p2" })]);
    expect(items[0]?.primaryMediaAssetId).toBeUndefined();
  });

  it("passes social counts into overlay feed items", () => {
    const items = buildCommunityVideoFeedItems(
      [
        basePost({
          id: "p3",
          likes: 12,
          comments: 3,
          collects: 5,
          author: { id: "u1", nickname: "n1", avatar_url: "https://cdn.example.test/a.png", role: "traveler" },
        }),
      ],
    );
    expect(items[0]?.likes).toBe(12);
    expect(items[0]?.comments).toBe(3);
    expect(items[0]?.collects).toBe(5);
    expect(items[0]?.authorAvatarUrl).toContain("/a.png");
  });
});
