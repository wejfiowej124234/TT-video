/**
 * 视频 multipart：**`media_asset_id`** 路径下须允许 **`playback_url`** 与 **`NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES`** 不一致（服务端已门禁）。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCommunityFeedPublishSubmit } from "./useCommunityFeedPublishSubmit";

const createPostMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    status: "ok",
    id: "post-from-api",
    post_type: "video",
    media_urls: ["https://cdn.other.test/out.mp4"],
  }),
);

vi.mock("@/lib/apiClient/community", async (orig) => {
  const mod = await orig<typeof import("@/lib/apiClient/community")>();
  return { ...mod, createPost: createPostMock };
});

function mkHook() {
  return renderHook(() =>
    useCommunityFeedPublishSubmit({
      t: (k: string) => k,
      dash: "—",
      communityUser: { id: "user-1", nickname: "t" },
      feedApiRefetch: vi.fn(),
      setLocalPosts: vi.fn(),
      setPublishSendFailed: vi.fn(),
      setPublishErrorMessage: vi.fn(),
      setPublishFieldMessages: vi.fn(),
      setToast: vi.fn(),
      setToastBodyOverride: vi.fn(),
      setToastHint: vi.fn(),
      scheduleToastClear: vi.fn(),
    }),
  );
}

describe("useCommunityFeedPublishSubmit · media_asset_id vs URL prefix precheck", () => {
  beforeEach(() => {
    createPostMock.mockClear();
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES", "https://cdn.allowed-only.test/");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("calls createPost when video has mediaAssetId even if playback URL is off NEXT_PUBLIC prefix list", async () => {
    const { result } = mkHook();
    await result.current.handlePublishSubmit({
      type: "video",
      content: "hello multipart",
      mediaUrls: ["https://cdn.other.test/playback.mp4"],
      mediaAssetId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    });
    await waitFor(() => {
      expect(createPostMock).toHaveBeenCalledTimes(1);
    });
    const arg = createPostMock.mock.calls[0][0] as { media_asset_id?: string; media_urls?: string[] };
    expect(arg.media_asset_id).toBe("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
    expect(arg.media_urls?.[0]).toContain("cdn.other.test");
  });

  it("does not call createPost when video lacks mediaAssetId and URL is off prefix list", async () => {
    const { result } = mkHook();
    await expect(
      result.current.handlePublishSubmit({
        type: "video",
        content: "no asset",
        mediaUrls: ["https://cdn.other.test/only.mp4"],
      }),
    ).rejects.toThrow("publish_media_policy");
    expect(createPostMock).not.toHaveBeenCalled();
  });
});
