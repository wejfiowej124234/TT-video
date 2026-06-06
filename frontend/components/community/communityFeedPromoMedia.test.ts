import { describe, expect, it } from "vitest";
import type { CommunityPost } from "@/lib/communityMockData";
import {
  communityFeedHotDestinationRows,
  communityFeedMasonryPostsExcludingPromoPreview,
  communityFeedPromoActivityHref,
  communityFeedPromoDestinationCheckins,
  communityFeedPromoDestinationHref,
  communityFeedPromoPostForDestination,
  communityFeedPromoPostHref,
  pickCommunityFeedPromoPreviewPost,
} from "./communityFeedPromoMedia";

function post(partial: Partial<CommunityPost> & Pick<CommunityPost, "id">): CommunityPost {
  return {
    type: "photo",
    content: "",
    media_url: "https://cdn.example.test/a.jpg",
    tags: [],
    author: { id: "u1", nickname: "U", avatar_url: null, role: "traveler" },
    likes: 10,
    comments: 2,
    collects: 0,
    created_at: "2026-01-01T00:00:00Z",
    ...partial,
  };
}

describe("communityFeedPromoMedia", () => {
  it("links activity card to post deep link when id exists", () => {
    expect(communityFeedPromoPostHref(post({ id: "p-99" }))).toBe("/community?post=p-99");
    expect(communityFeedPromoActivityHref(post({ id: "p-99", destination: "京都" }))).toBe(
      "/community?post=p-99",
    );
    expect(communityFeedPromoActivityHref(post({ id: "1", destination: "京都" }))).toContain("post=");
    expect(communityFeedPromoActivityHref(undefined)).toBe("/community/activity");
  });

  it("finds feed post for hot destination thumb", () => {
    const posts = [
      post({ id: "1", destination: "东京" }),
      post({ id: "2", destination: "京都", media_url: "https://cdn.example.test/kyoto.png" }),
    ];
    expect(communityFeedPromoPostForDestination(posts, "京都")?.id).toBe("2");
    expect(communityFeedPromoPostForDestination(posts, "大阪")).toBeUndefined();
  });

  it("aggregates checkins and builds hot destination rows", () => {
    const posts = [
      post({ id: "1", destination: "京都", likes: 20, comments: 5 }),
      post({ id: "2", destination: "京都", likes: 3, comments: 2 }),
    ];
    expect(communityFeedPromoDestinationCheckins(posts, "京都", 0)).toBe(30);
    expect(communityFeedPromoDestinationHref("京都")).toContain("destination=");
    const rows = communityFeedHotDestinationRows(["京都", "东京"], posts, 2);
    expect(rows[0].destination).toBe("京都");
    expect(rows[0].checkins).toBe(30);
    expect(rows[0].href).toContain("destination=");
    expect(rows[0].distanceKm).toMatch(/^\d+\.\d$/);
    expect(rows[0].distanceFromFeedGeo).toBe(false);
  });

  it("hot destination marks score/checkins placeholder when no feed interaction", () => {
    const rows = communityFeedHotDestinationRows(["京都"], [], 1);
    expect(rows[0].scoreFromFeedInteraction).toBe(false);
    expect(rows[0].checkinsFromFeedInteraction).toBe(false);
  });

  it("hot destination uses API distance_m when feed geo enriched", () => {
    const posts = [
      post({ id: "1", destination: "京都", likes: 1, comments: 0, distanceM: 1500 }),
      post({ id: "2", destination: "京都", likes: 0, comments: 0, distanceM: 800 }),
    ];
    const rows = communityFeedHotDestinationRows(["京都"], posts, 1);
    expect(rows[0].distanceFromFeedGeo).toBe(true);
    expect(rows[0].distanceKm).toBe("0.8");
    expect(rows[0].scoreFromFeedInteraction).toBe(true);
    expect(rows[0].checkinsFromFeedInteraction).toBe(true);
  });

  it("excludes promo preview post from masonry grid", () => {
    const posts = [post({ id: "a" }), post({ id: "b" })];
    expect(
      communityFeedMasonryPostsExcludingPromoPreview(posts, {
        showPromoSlots: true,
        previewPost: posts[0],
      }).map((p) => p.id),
    ).toEqual(["b"]);
    expect(
      communityFeedMasonryPostsExcludingPromoPreview(posts, { showPromoSlots: false, previewPost: posts[0] }),
    ).toHaveLength(2);
    expect(
      communityFeedMasonryPostsExcludingPromoPreview(posts, { showPromoSlots: true, previewPost: undefined }),
    ).toHaveLength(2);
  });

  it("promo preview prefers showcase only so user UGC stays in masonry", () => {
    const userVideo = post({ id: "real-111", type: "video", content: "111", is_video: true });
    const showcase = post({
      id: "tt-showcase-post-001",
      content: "祇园",
      media_url: "https://cdn.example.test/show.jpg",
    });
    const posts = [userVideo, showcase];
    expect(pickCommunityFeedPromoPreviewPost(posts)?.id).toBe("tt-showcase-post-001");
    expect(
      communityFeedMasonryPostsExcludingPromoPreview(posts, {
        showPromoSlots: true,
        previewPost: pickCommunityFeedPromoPreviewPost(posts),
      }).map((p) => p.id),
    ).toEqual(["real-111"]);
    expect(pickCommunityFeedPromoPreviewPost([userVideo])?.id).toBeUndefined();
  });
});
