import { afterEach, describe, expect, it, vi } from "vitest";

import {
  communityMediaPlaybackUrlForRender,
  communityMediaS3PublicBaseUrl,
  remapCommunityTestCdnPlaybackPath,
} from "./communityMediaClientUrl";

describe("remapCommunityTestCdnPlaybackPath", () => {
  it("maps test CDN playback URL to MinIO object layout", () => {
    const id = "35bebf2b-4cef-4d64-b9ac-40291914cd6e";
    expect(remapCommunityTestCdnPlaybackPath(`https://cdn.example.test/playback/${id}.mp4`)).toBe(
      `http://127.0.0.1:19000/traveltrust-community-media/community/media/${id}.mp4`,
    );
    expect(
      remapCommunityTestCdnPlaybackPath(`https://cdn-staging.example.test/playback/${id}.mp4`),
    ).toBe(`http://127.0.0.1:19000/traveltrust-community-media/community/media/${id}.mp4`);
  });
});

describe("communityMediaPlaybackUrlForRender", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rewrites loopback MinIO public base to direct URL (Q-07 · CORS)", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL",
      "http://127.0.0.1:19000/traveltrust-community-media",
    );
    const raw = "http://127.0.0.1:19000/traveltrust-community-media/community-media/v1/a.mp4";
    expect(communityMediaPlaybackUrlForRender(raw)).toBe(raw);
  });

  it("remaps cdn.example.test to loopback MinIO in dev", () => {
    vi.stubEnv("NODE_ENV", "development");
    const id = "35bebf2b-4cef-4d64-b9ac-40291914cd6e";
    expect(
      communityMediaPlaybackUrlForRender(`https://cdn.example.test/playback/${id}.mp4`),
    ).toBe(`http://127.0.0.1:19000/traveltrust-community-media/community/media/${id}.mp4`);
  });

  it("remaps cdn.example.test even when NODE_ENV is production (fake .test host)", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL", "");
    const id = "35bebf2b-4cef-4d64-b9ac-40291914cd6e";
    expect(
      communityMediaPlaybackUrlForRender(`https://cdn.example.test/playback/${id}.mp4`),
    ).toBe(`http://127.0.0.1:19000/traveltrust-community-media/community/media/${id}.mp4`);
  });

  it("remaps community/media path on test CDN host", () => {
    const id = "35bebf2b-4cef-4d64-b9ac-40291914cd6e";
    expect(
      remapCommunityTestCdnPlaybackPath(`https://cdn-staging.example.test/community/media/${id}.mp4`),
    ).toBe(`http://127.0.0.1:19000/traveltrust-community-media/community/media/${id}.mp4`);
  });

  it("uses /tt-community-s3 proxy for non-loopback CDN base", () => {
    vi.stubEnv("NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL", "https://cdn.example.com/bucket");
    const raw = "https://cdn.example.com/bucket/community-media/v1/a.mp4";
    expect(communityMediaPlaybackUrlForRender(raw)).toBe("/tt-community-s3/community-media/v1/a.mp4");
  });

  it("leaves /api upload paths on API origin", () => {
    vi.stubEnv("NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL", "http://127.0.0.1:19000/bucket");
    expect(communityMediaPlaybackUrlForRender("/api/v1/uploads/community-posts/x.mp4")).toContain(
      "/api/v1/uploads/community-posts/x.mp4",
    );
  });

  it("communityMediaS3PublicBaseUrl strips trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL", "https://cdn.example.com/bucket/");
    expect(communityMediaS3PublicBaseUrl()).toBe("https://cdn.example.com/bucket");
  });

  it("communityMediaAssetPlaybackUrlFromIds builds community-media/v1 path", async () => {
    const { communityMediaAssetPlaybackUrlFromIds } = await import("./communityMediaClientUrl");
    expect(
      communityMediaAssetPlaybackUrlFromIds(
        "e45c2796-df2e-4833-8f81-ae1d497b858b",
        "9d0e1496-20e5-40ea-8006-f5a538f1ef38",
      ),
    ).toBe(
      "http://127.0.0.1:19000/traveltrust-community-media/community-media/v1/e45c2796-df2e-4833-8f81-ae1d497b858b/9d0e1496-20e5-40ea-8006-f5a538f1ef38.mp4",
    );
  });
});
