import { describe, expect, it } from "vitest";
import { hreflangSitemapLanguages } from "./hreflangSitemapLanguages";

describe("hreflangSitemapLanguages", () => {
  it("returns absolute URLs for zh-CN, en, x-default (same URL)", () => {
    const base = new URL("https://app.example.com");
    const m = hreflangSitemapLanguages(base, "/market");
    expect(m["zh-CN"]).toBe("https://app.example.com/market");
    expect(m.en).toBe("https://app.example.com/market");
    expect(m["x-default"]).toBe("https://app.example.com/market");
  });

  it("normalizes path without leading slash", () => {
    const base = new URL("https://x.test/");
    expect(hreflangSitemapLanguages(base, "terms").en).toBe("https://x.test/terms");
  });

  it("handles root path", () => {
    const base = new URL("https://x.test");
    const m = hreflangSitemapLanguages(base, "/");
    expect(m.en).toBe("https://x.test/");
  });
});
