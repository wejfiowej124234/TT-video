import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  COMMUNITY_FEED_TAG_QUERY_MAX_LEN,
  communityPostTagExceedsServerUtf8Limit,
  communityPostTagUtf8ByteLenTrimmed,
} from "@/lib/apiClient/community";
import { useCommunityFeedFilters } from "./useCommunityFeedFilters";
import type { CommunityPost } from "@/lib/communityMockData";

function author(id: string) {
  return { id, nickname: "n", avatar_url: null as string | null, role: "traveler" };
}

function mkPost(
  id: string,
  authorId: string,
  tags: string[] = [],
  partial: Partial<CommunityPost> = {},
): CommunityPost {
  return {
    id,
    type: "text",
    content: "c",
    media_url: "",
    tags,
    author: author(authorId),
    likes: 1,
    comments: 1,
    collects: 0,
    created_at: "2020-01-02T00:00:00.000Z",
    ...partial,
  };
}

describe("useCommunityFeedFilters · following vs API trust", () => {
  it("does not strip posts when skipFollowingAuthorFilter with empty followingIds", () => {
    const posts = [mkPost("p1", "uuid-a"), mkPost("p2", "uuid-b")];
    const { result } = renderHook(() =>
      useCommunityFeedFilters({
        allPosts: posts,
        followingIds: [],
        feedTab: "following",
        skipFollowingAuthorFilter: true,
        preserveApiFeedOrder: true,
      })
    );
    expect(result.current.searchFilteredPosts.map((p) => p.id)).toEqual(["p1", "p2"]);
  });

  it("filters to empty when followingIds empty and client following filter applies", () => {
    const posts = [mkPost("p1", "uuid-a")];
    const { result } = renderHook(() =>
      useCommunityFeedFilters({
        allPosts: posts,
        followingIds: [],
        feedTab: "following",
        skipFollowingAuthorFilter: false,
        preserveApiFeedOrder: false,
      })
    );
    expect(result.current.searchFilteredPosts).toHaveLength(0);
  });

  it("keeps only posts whose author id is in followingIds when client filter applies", () => {
    const posts = [mkPost("p1", "keep-me"), mkPost("p2", "drop-me")];
    const { result } = renderHook(() =>
      useCommunityFeedFilters({
        allPosts: posts,
        followingIds: ["keep-me"],
        feedTab: "following",
        skipFollowingAuthorFilter: false,
      })
    );
    expect(result.current.searchFilteredPosts.map((p) => p.id)).toEqual(["p1"]);
  });
});

describe("useCommunityFeedFilters · tag exact match (incl. over API query limit)", () => {
  it("applies tag filter even when tag length exceeds COMMUNITY_FEED_TAG_QUERY_MAX_LEN", () => {
    const longTag = `x${"y".repeat(COMMUNITY_FEED_TAG_QUERY_MAX_LEN)}`;
    expect(longTag.length).toBeGreaterThan(COMMUNITY_FEED_TAG_QUERY_MAX_LEN);
    const posts = [
      mkPost("hit", "a", [longTag]),
      mkPost("miss", "b", ["other"]),
    ];
    const { result } = renderHook(() => useCommunityFeedFilters({ allPosts: posts }));
    act(() => {
      result.current.setTagFilter(longTag);
    });
    expect(result.current.searchFilteredPosts.map((p) => p.id)).toEqual(["hit"]);
  });

  it("applies tag filter when UTF-8 bytes exceed API limit but JS string.length is below 64", () => {
    const longTag = "中".repeat(22);
    expect(communityPostTagUtf8ByteLenTrimmed(longTag)).toBeGreaterThan(COMMUNITY_FEED_TAG_QUERY_MAX_LEN);
    expect(communityPostTagExceedsServerUtf8Limit(longTag)).toBe(true);
    expect(longTag.length).toBeLessThan(COMMUNITY_FEED_TAG_QUERY_MAX_LEN);
    const posts = [
      mkPost("hit", "a", [longTag]),
      mkPost("miss", "b", ["other"]),
    ];
    const { result } = renderHook(() => useCommunityFeedFilters({ allPosts: posts }));
    act(() => {
      result.current.setTagFilter(longTag);
    });
    expect(result.current.searchFilteredPosts.map((p) => p.id)).toEqual(["hit"]);
  });
});

describe("useCommunityFeedFilters · proximity server/client", () => {
  it("skips client proximity filter when server already applied", () => {
    const posts = [
      mkPost("near", "a", [], { distanceM: 800 }),
      mkPost("far", "b", [], { distanceM: 12000 }),
    ];
    const { result } = renderHook(() =>
      useCommunityFeedFilters({
        allPosts: posts,
        proximityFilter: "nearby_1km",
        serverProximityFilterApplied: true,
        preserveApiFeedOrder: true,
      }),
    );
    expect(result.current.searchFilteredPosts.map((p) => p.id)).toEqual(["near", "far"]);
  });

  it("client filters proximity when server has not applied", () => {
    const posts = [
      mkPost("near", "a"),
      mkPost("far", "b", [], { distanceM: 12000 }),
    ];
    const { result } = renderHook(() =>
      useCommunityFeedFilters({
        allPosts: posts,
        proximityFilter: "nearby_1km",
        serverProximityFilterApplied: false,
      }),
    );
    expect(result.current.searchFilteredPosts.some((p) => p.id === "near")).toBe(true);
    expect(result.current.searchFilteredPosts.some((p) => p.id === "far")).toBe(false);
  });
});
