import { describe, it, expect, vi, afterEach } from "vitest";

describe("communityPostMediaLimits", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("clamps decoded bytes to backend floor/cap", async () => {
    const { clampCommunityPostMediaMaxDecodedBytes } = await import("./communityPostMediaLimits");
    expect(clampCommunityPostMediaMaxDecodedBytes(1)).toBe(1024);
    expect(clampCommunityPostMediaMaxDecodedBytes(2_000_000)).toBe(980_000);
  });

  it("uses NEXT_PUBLIC cap when set", async () => {
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES", "819200");
    const { getCommunityPostMediaMaxDecodedBytes } = await import("./communityPostMediaLimits");
    expect(getCommunityPostMediaMaxDecodedBytes()).toBe(819_200);
  });

  it("formats MB label for default 512KiB", async () => {
    const { communityPostMediaMaxSizeMbLabel, COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES_DEFAULT } =
      await import("./communityPostMediaLimits");
    expect(communityPostMediaMaxSizeMbLabel(COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES_DEFAULT)).toBe("0.5");
  });

  it("clamps video duration sec to backend floor/cap", async () => {
    const { clampCommunityPostMediaMaxVideoDurationSec } = await import("./communityPostMediaLimits");
    expect(clampCommunityPostMediaMaxVideoDurationSec(0)).toBe(1);
    expect(clampCommunityPostMediaMaxVideoDurationSec(99999)).toBe(3600);
  });

  it("uses NEXT_PUBLIC video duration cap when set", async () => {
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_VIDEO_DURATION_SEC", "240");
    const { getCommunityPostMediaMaxVideoDurationSec } = await import("./communityPostMediaLimits");
    expect(getCommunityPostMediaMaxVideoDurationSec()).toBe(240);
  });
});
