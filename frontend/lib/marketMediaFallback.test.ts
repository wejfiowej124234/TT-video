import { describe, expect, it } from "vitest";
import {
  formatMarketOrderDestination,
  marketCoverGradientClass,
  resolveGuideAvatarUrl,
  resolveMarketOrderCoverUrl,
} from "@/lib/marketMediaFallback";

describe("marketMediaFallback", () => {
  it("uses explicit order image when present", () => {
    expect(
      resolveMarketOrderCoverUrl({
        id: "1",
        image: "https://cdn.example/cover.jpg",
        city: "北京",
        destination: "北京",
        country: "中国",
      }),
    ).toBe("https://cdn.example/cover.jpg");
  });

  it("falls back to city cover for Beijing", () => {
    const url = resolveMarketOrderCoverUrl({
      id: "o-1",
      image: null,
      city: "北京",
      destination: "中国 · 北京",
      country: "中国",
    });
    expect(url).toContain("/images/market-cover-placeholder.svg");
    expect(url).not.toContain("unsplash.com");
  });

  it("varies same-city order covers by order id", () => {
    const base = {
      image: null as string | null,
      city: "北京",
      destination: "中国 · 北京",
      country: "中国",
    };
    const urls = ["o-a", "o-b", "o-c"].map((id) => resolveMarketOrderCoverUrl({ ...base, id }));
    expect(new Set(urls).size).toBeGreaterThan(1);
  });

  it("varies guide avatars by guide id even when user_id matches", () => {
    const base = { avatar_url: null as string | null, city: "杭州", user_id: "same-user" };
    const a = resolveGuideAvatarUrl({ ...base, id: "guide-a" });
    const b = resolveGuideAvatarUrl({ ...base, id: "guide-b" });
    expect(a).not.toBe(b);
  });

  it("resolves guide avatar from pool when missing", () => {
    const url = resolveGuideAvatarUrl({ id: "g-1", avatar_url: null, city: "杭州", user_id: "u-1" });
    expect(url).toContain("/images/market-cover-placeholder.svg");
    expect(url).not.toContain("unsplash.com");
  });

  it("returns stable gradient class for seed", () => {
    expect(marketCoverGradientClass("abc")).toBe(marketCoverGradientClass("abc"));
  });

  it("dedupes country in destination title", () => {
    expect(
      formatMarketOrderDestination(
        { country: "中国", city: "北京", destination: "中国 · 北京 · 1天" },
        "—",
      ),
    ).toBe("中国 · 北京 · 1天");
  });
});

describe("resolveGuideAvatarUrl OCS remap", () => {
  it("remaps legacy OCS upload avatar_url to Tigris", () => {
    const url = resolveGuideAvatarUrl({
      id: "g-ocs",
      avatar_url: "/api/v1/uploads/community-posts/ocs-tokyo-photo-official-guide-cover.jpg",
      city: "Tokyo",
      user_id: "u-ocs",
    });
    expect(url).toContain("official-cold-start/v1/ocs-tokyo-photo-official-guide-cover.jpg");
    expect(url).toContain("traveltrust-community-media.fly.storage.tigris.dev");
  });
});
