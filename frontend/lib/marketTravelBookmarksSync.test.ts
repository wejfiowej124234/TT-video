import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_SESSION_TOKEN_KEY } from "@/lib/apiClient/core";
import { FAV_ORDERS_KEY, loadFavSet } from "@/lib/marketFavoritesStorage";
import {
  hasMarketAuthSession,
  pullMarketTravelBookmarksIntoLocal,
  pushMarketOrderBookmarkToggle,
} from "./marketTravelBookmarksSync";

vi.mock("@/lib/apiClient/marketTravelBookmarks", () => ({
  getMarketTravelBookmarks: vi.fn(),
  postMarketTravelBookmark: vi.fn(),
  deleteMarketTravelBookmark: vi.fn(),
}));

import {
  deleteMarketTravelBookmark,
  getMarketTravelBookmarks,
  postMarketTravelBookmark,
} from "@/lib/apiClient/marketTravelBookmarks";

describe("marketTravelBookmarksSync", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("hasMarketAuthSession is false without token", () => {
    expect(hasMarketAuthSession()).toBe(false);
  });

  it("pullMarketTravelBookmarksIntoLocal merges remote order_ids into localStorage", async () => {
    localStorage.setItem(AUTH_SESSION_TOKEN_KEY, "tok");
    vi.mocked(getMarketTravelBookmarks).mockResolvedValue({ order_ids: ["o-remote"], guide_ids: [] });

    const result = await pullMarketTravelBookmarksIntoLocal();

    expect(result.ok).toBe(true);
    expect(loadFavSet(FAV_ORDERS_KEY)).toEqual(new Set(["o-remote"]));
  });

  it("pushMarketOrderBookmarkToggle posts when favorited and logged in", async () => {
    localStorage.setItem(AUTH_SESSION_TOKEN_KEY, "tok");
    await pushMarketOrderBookmarkToggle("o1", true);
    expect(postMarketTravelBookmark).toHaveBeenCalledWith("order", "o1");
    expect(deleteMarketTravelBookmark).not.toHaveBeenCalled();
  });
});
