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
    expect(url).toContain("images.unsplash.com");
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

  it("resolves guide avatar from pool when missing", () => {
    const url = resolveGuideAvatarUrl({ id: "g-1", avatar_url: null, city: "杭州", user_id: "u-1" });
    expect(url).toContain("images.unsplash.com");
    expect(url).toContain("w=640");
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
