import { afterEach, describe, expect, it, vi } from "vitest";
import {
  COMMUNITY_HIDE_LIKES_METRIC_CHANGED_EVENT,
  COMMUNITY_HIDE_LIKES_RECEIVED_METRIC_LS_KEY,
  isCommunityMeLikesReceivedFetchEnabled,
  isCommunityMeLikesReceivedMetricUserHiddenOnDevice,
  readHideLikesReceivedMetric,
  setHideLikesReceivedMetric,
} from "./communityMeLikesMetricPrivacy";

describe("isCommunityMeLikesReceivedFetchEnabled", () => {
  it("requires likes list on and user not hiding", () => {
    expect(isCommunityMeLikesReceivedFetchEnabled(false, false)).toBe(false);
    expect(isCommunityMeLikesReceivedFetchEnabled(true, true)).toBe(false);
    expect(isCommunityMeLikesReceivedFetchEnabled(true, false)).toBe(true);
  });
});

describe("isCommunityMeLikesReceivedMetricUserHiddenOnDevice", () => {
  it("is the complement pair for fetch-enabled when list is on", () => {
    const listOn = true;
    expect(isCommunityMeLikesReceivedMetricUserHiddenOnDevice(listOn, false)).toBe(false);
    expect(isCommunityMeLikesReceivedMetricUserHiddenOnDevice(listOn, true)).toBe(true);
    expect(isCommunityMeLikesReceivedFetchEnabled(listOn, false)).toBe(true);
    expect(isCommunityMeLikesReceivedFetchEnabled(listOn, true)).toBe(false);
  });
});

describe("communityMeLikesMetricPrivacy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persists, reads, clears, and dispatches change event", () => {
    const store: Record<string, string> = {};
    const dispatch = vi.fn();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => (k in store ? store[k] : null),
        setItem: (k: string, v: string) => {
          store[k] = v;
        },
        removeItem: (k: string) => {
          delete store[k];
        },
      },
      dispatchEvent: dispatch,
    });
    expect(readHideLikesReceivedMetric()).toBe(false);
    setHideLikesReceivedMetric(true);
    expect(store[COMMUNITY_HIDE_LIKES_RECEIVED_METRIC_LS_KEY]).toBe("1");
    expect(readHideLikesReceivedMetric()).toBe(true);
    const ev = dispatch.mock.calls[0]?.[0] as Event | undefined;
    expect(ev?.type).toBe(COMMUNITY_HIDE_LIKES_METRIC_CHANGED_EVENT);
    setHideLikesReceivedMetric(false);
    expect(store[COMMUNITY_HIDE_LIKES_RECEIVED_METRIC_LS_KEY]).toBeUndefined();
    expect(readHideLikesReceivedMetric()).toBe(false);
  });
});
