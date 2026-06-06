import { describe, expect, it } from "vitest";
import {
  communityFeedPromoActivityViewModel,
  communityFeedPromoHotRankViewModel,
} from "./communityFeedPromoRowViewModel";

const t = (key: string) => key;

describe("communityFeedPromoRowViewModel", () => {
  it("builds activity VM without preview post", () => {
    const vm = communityFeedPromoActivityViewModel(t, undefined);
    expect(vm.headline).toBe("community_feed_promo_activity");
    expect(vm.distanceIsPlaceholder).toBe(true);
    expect(vm.href).toMatch(/^\/community/);
  });

  it("builds hot rank rows from destinations", () => {
    const vm = communityFeedPromoHotRankViewModel(t, ["京都", "东京"], [], 3);
    expect(vm.rows.length).toBeGreaterThan(0);
    expect(vm.rows[0]?.distanceIsPlaceholder).toBe(true);
    expect(vm.rows[0]?.distanceLabel.startsWith("~")).toBe(true);
    expect(vm.moreHref).toBe("/community/explore#explore-destinations");
    expect(vm.rows[0]?.rank).toBe(1);
  });
});
