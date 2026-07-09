import { describe, expect, it } from "vitest";
import {
  L5_CARD_MEDIA_TINY_MAX_PX,
  l5CardMediaCacheBustSrc,
  l5CardMediaGradientShellClass,
  l5CardMediaIsTiny,
  l5CardMediaOutcomeFromNaturalSize,
  l5CardMediaResolvedAcceptable,
  l5CardMediaSyncFromImgElement,
} from "@/lib/l5CardMediaPlaceholder";
import { marketCoverGradientClass } from "@/lib/marketMediaFallback";

describe("l5CardMediaPlaceholder", () => {
  it("detects tiny images like community masonry policy", () => {
    expect(l5CardMediaIsTiny(1, 1)).toBe(true);
    expect(l5CardMediaIsTiny(L5_CARD_MEDIA_TINY_MAX_PX, 480)).toBe(true);
    expect(l5CardMediaIsTiny(L5_CARD_MEDIA_TINY_MAX_PX + 1, 480)).toBe(false);
  });

  it("rejects empty resolved src", () => {
    expect(l5CardMediaResolvedAcceptable("")).toBe(false);
    expect(l5CardMediaResolvedAcceptable("/api/v1/uploads/x.jpg")).toBe(true);
  });

  it("uses Guides marketCoverGradientClass for shell", () => {
    const seed = "listing-abc";
    expect(l5CardMediaGradientShellClass(seed)).toContain(marketCoverGradientClass(seed));
  });

  it("syncs reveal from complete img (cached onLoad miss)", () => {
    expect(l5CardMediaOutcomeFromNaturalSize(640, 480)).toBe("revealed");
    expect(l5CardMediaOutcomeFromNaturalSize(1, 1)).toBe("tiny");
    expect(l5CardMediaOutcomeFromNaturalSize(0, 0)).toBe("pending");

    const img = { complete: true, naturalWidth: 640, naturalHeight: 480 } as HTMLImageElement;
    expect(l5CardMediaSyncFromImgElement(img)).toBe("revealed");
    expect(l5CardMediaSyncFromImgElement({ complete: false } as HTMLImageElement)).toBe("pending");
  });

  it("appends one-shot cache bust query without changing API path", () => {
    const base = "/api/v1/uploads/community-posts/ocs-tokyo.jpg";
    expect(l5CardMediaCacheBustSrc(base, 0)).toBe(base);
    expect(l5CardMediaCacheBustSrc(base, 1)).toBe(`${base}?tt_l5_cb=1`);
    expect(l5CardMediaCacheBustSrc(`${base}?v=1`, 1)).toBe(`${base}?v=1&tt_l5_cb=1`);
  });
});
