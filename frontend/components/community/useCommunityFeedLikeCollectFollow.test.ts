import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState } from "react";
import { useCommunityFeedLikeCollectFollow } from "./useCommunityFeedLikeCollectFollow";
import * as communityApi from "@/lib/apiClient/community";

vi.mock("@/lib/apiClient/community", () => ({
  postLike: vi.fn(),
  deleteLike: vi.fn(),
  postCollect: vi.fn(),
  deleteCollect: vi.fn(),
  postUserFollow: vi.fn(),
  deleteUserFollow: vi.fn(),
}));

function useLikeCollectHarness() {
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [collectedPostIds, setCollectedPostIds] = useState<Set<string>>(new Set());
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const api = useCommunityFeedLikeCollectFollow({
    isLoggedIn: true,
    t: (k) => k,
    communityUserId: "me-1",
    followingAuthorIdSet: new Set(followingIds),
    likedPostIds,
    setLikedPostIds,
    collectedPostIds,
    setCollectedPostIds,
    setFollowingIds,
    setShowLoginModal: vi.fn(),
    setToast: vi.fn(),
    setToastBodyOverride: vi.fn(),
    setToastHint: vi.fn(),
    scheduleToastClear: vi.fn(),
  });
  return { ...api, likedPostIds };
}

describe("useCommunityFeedLikeCollectFollow · showcase boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("does not call postLike for tt-showcase-post ids", async () => {
    const { result } = renderHook(() => useLikeCollectHarness());

    await act(async () => {
      await result.current.handleLike("tt-showcase-post-004");
    });

    expect(communityApi.postLike).not.toHaveBeenCalled();
    expect(communityApi.deleteLike).not.toHaveBeenCalled();
    expect(result.current.likedPostIds.has("tt-showcase-post-004")).toBe(true);
  });

  it("does not call postUserFollow for tt-demo author ids", async () => {
    const { result } = renderHook(() => useLikeCollectHarness());

    await act(async () => {
      await result.current.handleAuthorFollowToggle("tt-demo-yuki");
    });

    expect(communityApi.postUserFollow).not.toHaveBeenCalled();
    expect(communityApi.deleteUserFollow).not.toHaveBeenCalled();
  });
});
