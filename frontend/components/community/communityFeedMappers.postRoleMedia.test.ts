import { describe, expect, it } from "vitest";
import {
  communityPostGridThumbRaw,
  mapApiPostToCommunityPost,
  resolveCommunityPostPlayableVideoUrl,
} from "./communityFeedMappers";
import { COMMUNITY_MAPPERS_TEST_API_POST_BASE } from "./communityFeedMappers.vitestShared";

const base = COMMUNITY_MAPPERS_TEST_API_POST_BASE;

describe("mapApiPostToCommunityPost", () => {
  it("sets is_video when post_type is video", () => {
    const post = mapApiPostToCommunityPost({
      ...base,
      post_type: "video",
      media_urls: ["https://cdn.example.com/a.mp4"],
    });
    expect(post.is_video).toBe(true);
    expect(post.type).toBe("video");
  });

  it("maps visibility_status hidden for author-facing lists", () => {
    const post = mapApiPostToCommunityPost({
      ...base,
      visibility_status: "hidden",
    });
    expect(post.visibilityStatus).toBe("hidden");
  });

  it("maps commerce_showcase_kind when present (04 · A1)", () => {
    const post = mapApiPostToCommunityPost({
      ...base,
      commerce_showcase_kind: "acquisition_led",
    });
    expect(post.commerceShowcaseKind).toBe("acquisition_led");
  });

  it("maps primary_media_asset_id when present (04 · A1)", () => {
    const withAsset = mapApiPostToCommunityPost({
      ...base,
      post_type: "video",
      media_urls: ["https://cdn.example.com/a.mp4"],
      primary_media_asset_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    });
    expect(withAsset.primaryMediaAssetId).toBe("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    const without = mapApiPostToCommunityPost({ ...base, primary_media_asset_id: null });
    expect("primaryMediaAssetId" in without).toBe(false);
  });

  it("maps venue / geo / sponsored fields when present (Feed L5 · ① forward compat)", () => {
    const full = mapApiPostToCommunityPost({
      ...base,
      venue_name: "Test Bistro",
      venue_lat: 39.9,
      venue_lng: 116.4,
      distance_m: 1500,
      is_sponsored: true,
    });
    expect(full.venueName).toBe("Test Bistro");
    expect(full.venueLat).toBe(39.9);
    expect(full.distanceM).toBe(1500);
    expect(full.isSponsored).toBe(true);
  });

  it("maps liked_by_me / collected_by_me / author_followed_by_me when boolean (04 · A3)", () => {
    const full = mapApiPostToCommunityPost({
      ...base,
      like_count: 3,
      collect_count: 2,
      liked_by_me: true,
      collected_by_me: false,
      author_followed_by_me: true,
    });
    expect(full.likedByMe).toBe(true);
    expect(full.collectedByMe).toBe(false);
    expect(full.authorFollowedByMe).toBe(true);
    expect(full.likes).toBe(3);
    expect(full.collects).toBe(2);
    const bare = mapApiPostToCommunityPost({ ...base, like_count: 1 });
    expect("likedByMe" in bare).toBe(false);
    expect("collectedByMe" in bare).toBe(false);
    expect("authorFollowedByMe" in bare).toBe(false);
  });
});

describe("mapApiPostToCommunityPost OCS durable media", () => {
  it("remaps OCS author avatar and media_urls away from legacy uploads path", () => {
    const post = mapApiPostToCommunityPost({
      ...base,
      author_avatar_url: "/api/v1/uploads/community-posts/ocs-tokyo-photo-official-guide-cover.jpg",
      media_urls: ["/api/v1/uploads/community-posts/ocs-tokyo-photo-official-guide-cover.jpg"],
      cover_url: "/api/v1/uploads/community-posts/ocs-tokyo-photo-official-guide-cover.jpg",
    });
    expect(post.author.avatar_url).toContain("official-cold-start/v1/ocs-tokyo-photo-official-guide-cover.jpg");
    expect(post.author.avatar_url).not.toMatch(/\/api\/v1\/uploads\/community-posts\/ocs-/);
    expect(post.media_url).toContain("official-cold-start/v1/");
    expect(post.cover_url).toContain("official-cold-start/v1/");
  });
});

describe("communityPostGridThumbRaw", () => {
  it("prefers cover_url for video posts", () => {
    expect(
      communityPostGridThumbRaw(
        mapApiPostToCommunityPost({
          ...base,
          post_type: "video",
          media_urls: ["/api/v1/uploads/community-posts/x.mp4"],
          cover_url: "/api/v1/uploads/community-posts/cover.jpg",
        }),
      ),
    ).toBe("/api/v1/uploads/community-posts/cover.jpg");
  });

  it("uses first still image in media_urls when video has no cover", () => {
    expect(
      communityPostGridThumbRaw(
        mapApiPostToCommunityPost({
          ...base,
          post_type: "video",
          media_urls: ["/api/v1/uploads/community-posts/a.mp4", "/api/v1/uploads/community-posts/p.png"],
        }),
      ),
    ).toBe("/api/v1/uploads/community-posts/p.png");
  });

  it("falls back to media_url when media_urls empty", () => {
    expect(
      communityPostGridThumbRaw(
        mapApiPostToCommunityPost({
          ...base,
          post_type: "photo",
          media_urls: ["/api/x.jpg"],
        }),
      ),
    ).toBe("/api/x.jpg");
  });

  it("does not use mp4 as grid thumb when cover is absent", () => {
    const id = "35bebf2b-4cef-4d64-b9ac-40291914cd6e";
    expect(
      communityPostGridThumbRaw(
        mapApiPostToCommunityPost({
          ...base,
          post_type: "video",
          media_urls: [`https://cdn.example.test/playback/${id}.mp4`],
        }),
      ),
    ).toBe("");
  });
});

describe("resolveCommunityPostPlayableVideoUrl", () => {
  it("picks first .mp4 in media_urls when poster is first", () => {
    const url = resolveCommunityPostPlayableVideoUrl({
      type: "video",
      is_video: true,
      media_url: "https://x.example.com/poster.jpg",
      media_urls: ["https://x.example.com/poster.jpg", "https://x.example.com/clip.mp4"],
    });
    expect(url).toBe("https://x.example.com/clip.mp4");
  });

  it("uses media_url when it is the playable file", () => {
    const url = resolveCommunityPostPlayableVideoUrl({
      type: "video",
      is_video: true,
      media_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/a.mp4",
      media_urls: undefined,
    });
    expect(url).toContain(".mp4");
  });

  it("returns undefined for non-video posts", () => {
    expect(
      resolveCommunityPostPlayableVideoUrl({
        type: "photo",
        is_video: false,
        media_url: "https://x.example.com/a.jpg",
        media_urls: ["https://x.example.com/a.jpg"],
      }),
    ).toBeUndefined();
  });

  it("falls back to primary_media_asset_id playback URL for video without media_urls", () => {
    const url = resolveCommunityPostPlayableVideoUrl({
      type: "video",
      is_video: true,
      media_url: "",
      media_urls: [],
      primaryMediaAssetId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    });
    expect(url).toContain("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    expect(url).toMatch(/playback|\.mp4/i);
  });

  it("builds MinIO community-media/v1 path when author id + asset id only", () => {
    const url = resolveCommunityPostPlayableVideoUrl({
      type: "video",
      is_video: true,
      media_url: "",
      media_urls: [],
      primaryMediaAssetId: "9d0e1496-20e5-40ea-8006-f5a538f1ef38",
      author: { id: "e45c2796-df2e-4833-8f81-ae1d497b858b", nickname: "C4", avatar_url: null, role: "tourist" },
    });
    expect(url).toBe(
      "http://127.0.0.1:19000/traveltrust-community-media/community-media/v1/e45c2796-df2e-4833-8f81-ae1d497b858b/9d0e1496-20e5-40ea-8006-f5a538f1ef38.mp4",
    );
  });
});
