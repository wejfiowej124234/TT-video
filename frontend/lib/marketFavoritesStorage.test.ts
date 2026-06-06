import { describe, expect, it, beforeEach } from "vitest";
import {
  FAV_GUIDES_KEY,
  FAV_ORDERS_KEY,
  LANDING_FAVORITE_ORDER_IDS_KEY,
  loadFavSet,
  readMergedOrderFavoriteIds,
  saveFavSet,
  writeMergedOrderFavoriteIds,
} from "./marketFavoritesStorage";

describe("marketFavoritesStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips order favorites", () => {
    saveFavSet(FAV_ORDERS_KEY, new Set(["o1"]));
    expect(loadFavSet(FAV_ORDERS_KEY)).toEqual(new Set(["o1"]));
  });

  it("merges legacy landing favorite key into market orders key", () => {
    localStorage.setItem(LANDING_FAVORITE_ORDER_IDS_KEY, JSON.stringify(["legacy"]));
    saveFavSet(FAV_ORDERS_KEY, new Set(["market"]));
    expect(readMergedOrderFavoriteIds()).toEqual(new Set(["market", "legacy"]));
    expect(localStorage.getItem(LANDING_FAVORITE_ORDER_IDS_KEY)).toBeNull();
    expect(JSON.parse(localStorage.getItem(FAV_ORDERS_KEY)!)).toEqual(
      expect.arrayContaining(["market", "legacy"]),
    );
  });

  it("writeMergedOrderFavoriteIds uses single SSOT key", () => {
    writeMergedOrderFavoriteIds(new Set(["a", "b"]));
    expect(loadFavSet(FAV_ORDERS_KEY)).toEqual(new Set(["a", "b"]));
    expect(localStorage.getItem(LANDING_FAVORITE_ORDER_IDS_KEY)).toBeNull();
  });

  it("keeps guide favorites separate from orders", () => {
    saveFavSet(FAV_GUIDES_KEY, new Set(["g1"]));
    saveFavSet(FAV_ORDERS_KEY, new Set(["o1"]));
    expect(loadFavSet(FAV_GUIDES_KEY)).toEqual(new Set(["g1"]));
    expect(loadFavSet(FAV_ORDERS_KEY)).toEqual(new Set(["o1"]));
  });
});
