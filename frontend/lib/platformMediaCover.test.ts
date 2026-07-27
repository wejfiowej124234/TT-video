import { describe, expect, it } from "vitest";
import { isInlineDataUrlCover, resolvePlatformMediaCoverSrc } from "./platformMediaCover";

describe("platformMediaCover", () => {
  it("detects data URL covers", () => {
    expect(isInlineDataUrlCover("data:image/png;base64,AA")).toBe(true);
    expect(isInlineDataUrlCover("https://cdn.example/x.png")).toBe(false);
  });

  it("prefers playback URL then https cover; skips data when asset id set", () => {
    expect(
      resolvePlatformMediaCoverSrc({
        assetPlaybackUrl: "https://cdn.example/a.jpg",
        coverImage: "https://other/b.jpg",
      }),
    ).toBe("https://cdn.example/a.jpg");

    expect(
      resolvePlatformMediaCoverSrc({
        coverMediaAssetId: "00000000-0000-0000-0000-000000000001",
        coverImage: "data:image/png;base64,AA",
      }),
    ).toBeNull();

    expect(
      resolvePlatformMediaCoverSrc({
        coverImage: "https://cdn.example/legacy.jpg",
      }),
    ).toBe("https://cdn.example/legacy.jpg");
  });
});
