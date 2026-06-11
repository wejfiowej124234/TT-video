import { describe, expect, it, beforeEach } from "vitest";
import {
  LANDING_RESULT_ORDER_IDS_KEY,
  LANDING_UNLOCKED_ORDER_IDS_KEY,
  readLandingFavoriteOrderIds,
  readLandingResultOrderIds,
  readLandingUnlockedOrderIds,
  removeLandingOrderIdFromSession,
  writeLandingFavoriteOrderIds,
  writeLandingResultOrderIds,
  writeLandingUnlockedOrderIds,
} from "./landingItinerarySession";
import { FAV_ORDERS_KEY } from "./marketFavoritesStorage";

describe("landingItinerarySession", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("round-trips result and unlocked order ids via localStorage", () => {
    writeLandingResultOrderIds(["a", "b"]);
    writeLandingUnlockedOrderIds(new Set(["a"]));
    expect(readLandingResultOrderIds()).toEqual(["a", "b"]);
    expect(readLandingUnlockedOrderIds()).toEqual(new Set(["a"]));
    expect(localStorage.getItem(LANDING_RESULT_ORDER_IDS_KEY)).toBe(JSON.stringify(["a", "b"]));
    expect(localStorage.getItem(LANDING_UNLOCKED_ORDER_IDS_KEY)).toBe(JSON.stringify(["a"]));
  });

  it("migrates legacy sessionStorage result/unlock keys", () => {
    sessionStorage.setItem(LANDING_RESULT_ORDER_IDS_KEY, JSON.stringify(["x"]));
    sessionStorage.setItem(LANDING_UNLOCKED_ORDER_IDS_KEY, JSON.stringify(["x"]));
    expect(readLandingResultOrderIds()).toEqual(["x"]);
    expect(readLandingUnlockedOrderIds()).toEqual(new Set(["x"]));
    expect(sessionStorage.getItem(LANDING_RESULT_ORDER_IDS_KEY)).toBeNull();
  });

  it("clears when writing empty arrays", () => {
    writeLandingResultOrderIds(["x"]);
    writeLandingResultOrderIds([]);
    expect(readLandingResultOrderIds()).toEqual([]);
    expect(localStorage.getItem(LANDING_RESULT_ORDER_IDS_KEY)).toBeNull();
  });

  it("removeLandingOrderIdFromSession drops id from result unlock and favorites", () => {
    writeLandingResultOrderIds(["a", "b"]);
    writeLandingUnlockedOrderIds(new Set(["a", "b"]));
    writeLandingFavoriteOrderIds(new Set(["a"]));
    removeLandingOrderIdFromSession("a");
    expect(readLandingResultOrderIds()).toEqual(["b"]);
    expect(readLandingUnlockedOrderIds()).toEqual(new Set(["b"]));
    expect(readLandingFavoriteOrderIds()).toEqual(new Set());
  });

  it("syncs favorites with market FAV_ORDERS_KEY SSOT", () => {
    writeLandingFavoriteOrderIds(new Set(["o1"]));
    expect(readLandingFavoriteOrderIds()).toEqual(new Set(["o1"]));
    expect(JSON.parse(localStorage.getItem(FAV_ORDERS_KEY)!)).toEqual(["o1"]);
  });
});
