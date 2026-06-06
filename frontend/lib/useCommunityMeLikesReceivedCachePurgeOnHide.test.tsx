import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as privacy from "./communityMeLikesMetricPrivacy";
import { communityMeLikesReceivedQueryKey } from "./communityMeLikesReceivedContract";
import { useCommunityMeLikesReceivedCachePurgeOnHide } from "./useCommunityMeLikesReceivedCachePurgeOnHide";

function createWrapper(qc: QueryClient) {
  return function Provider({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe("useCommunityMeLikesReceivedCachePurgeOnHide", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls removeQueries on mount when preference is hidden", () => {
    vi.spyOn(privacy, "readHideLikesReceivedMetric").mockReturnValue(true);
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "removeQueries");
    renderHook(() => useCommunityMeLikesReceivedCachePurgeOnHide(), {
      wrapper: createWrapper(qc),
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ queryKey: communityMeLikesReceivedQueryKey });
  });

  it("does not removeQueries on mount when preference is show", () => {
    vi.spyOn(privacy, "readHideLikesReceivedMetric").mockReturnValue(false);
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "removeQueries");
    renderHook(() => useCommunityMeLikesReceivedCachePurgeOnHide(), {
      wrapper: createWrapper(qc),
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it("removeQueries after privacy change event when read becomes hidden", () => {
    vi.spyOn(privacy, "readHideLikesReceivedMetric").mockReturnValueOnce(false).mockReturnValue(true);
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "removeQueries");
    renderHook(() => useCommunityMeLikesReceivedCachePurgeOnHide(), {
      wrapper: createWrapper(qc),
    });
    expect(spy).not.toHaveBeenCalled();
    window.dispatchEvent(new Event(privacy.COMMUNITY_HIDE_LIKES_METRIC_CHANGED_EVENT));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ queryKey: communityMeLikesReceivedQueryKey });
  });
});
