import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { getFeed } from "@/lib/apiClient/community";
import { useCommunityFeedTabSortAndFeedApi } from "./useCommunityFeedTabSortAndFeedApi";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock("@/lib/apiClient/community", () => ({
  getFeed: vi.fn(),
}));

vi.mock("@/components/community/useCommunityFeedSortAndUrlTag", () => ({
  useCommunityFeedSortAndUrlTag: () => ({
    sortBy: "latest" as const,
    setSortBy: vi.fn(),
    hrefTopicPathForTag: (tag: string) => `/community/topic/${tag}`,
    feedApiMode: "latest" as const,
    feedTagFromUrl: null,
  }),
}));

vi.mock("@/components/community/useCommunityFeedAnchorPoi", () => ({
  useCommunityFeedAnchorPoi: () => ({
    anchorPoiId: "gps" as const,
    setAnchorPoiId: vi.fn(),
    gpsCoords: null,
    anchorRevision: 0,
    anchorHydrated: true,
  }),
}));

const nav = {
  searchParams: new URLSearchParams() as unknown as import("next/navigation").ReadonlyURLSearchParams,
  pathname: "/community",
  router: { replace: vi.fn() },
};

describe("useCommunityFeedTabSortAndFeedApi · geo query", () => {
  beforeEach(() => {
    vi.mocked(getFeed).mockResolvedValue({ status: "ok", posts: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("passes anchor_poi_id to getFeed on initial fetch", async () => {
    renderHook(() => useCommunityFeedTabSortAndFeedApi(nav));
    await waitFor(() => expect(getFeed).toHaveBeenCalled());
    expect(getFeed).toHaveBeenCalledWith(
      expect.objectContaining({ anchor_poi_id: "gps", mode: "latest" }),
    );
  });
});
