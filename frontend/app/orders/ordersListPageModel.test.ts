import { describe, expect, it } from "vitest";

import {
  ORDER_PLACEHOLDER_IMAGE,
  resolveOrderListCoverUrl,
  shrinkUnsplashHeroForListCover,
} from "./ordersListPageModel";

describe("ordersListPageModel cover URLs", () => {
  it("shrinks landing ambient hero Unsplash to list size", () => {
    const hero =
      "https://images.unsplash.com/photo-1547150492-da7ff1742941?auto=format&fit=crop&w=3840&h=2160&q=92";
    const shrunk = shrinkUnsplashHeroForListCover(hero);
    expect(shrunk).toContain("w=640");
    expect(shrunk).toContain("h=400");
    expect(shrunk).toContain("q=75");
    expect(shrunk).not.toContain("w=3840");
  });

  it("resolveOrderListCoverUrl falls back to local placeholder", () => {
    expect(resolveOrderListCoverUrl("")).toBe(ORDER_PLACEHOLDER_IMAGE);
    expect(resolveOrderListCoverUrl("   ")).toBe(ORDER_PLACEHOLDER_IMAGE);
  });
});
