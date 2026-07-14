import { describe, expect, it } from "vitest";

import type { CommunityPost } from "@/lib/communityMockData";
import {
  communityFeedHasMoreFromClientSlice,
  resolveCommunityFeedPostsToShow,
} from "./communityFeedVisiblePosts";

function post(id: string): CommunityPost {
  return {
    id,
    type: "photo",
    content: id,
    author: { id: "a1", nickname: "n" },
    likes: 0,
    comments: 0,
    createdAt: "2026-01-01T00:00:00Z",
  };
}

describe("resolveCommunityFeedPostsToShow", () => {
  it("renders full in-memory API batch when there is no server cursor", () => {
    const rows = Array.from({ length: 10 }, (_, i) => post(`p${i}`));
    expect(
      resolveCommunityFeedPostsToShow({
        searchFilteredPosts: rows,
        feedPage: 1,
        feedFromApi: true,
        feedNextCursor: null,
      }).length,
    ).toBe(10);
  });

  it("keeps client paging when server cursor remains", () => {
    const rows = Array.from({ length: 10 }, (_, i) => post(`p${i}`));
    expect(
      resolveCommunityFeedPostsToShow({
        searchFilteredPosts: rows,
        feedPage: 1,
        feedFromApi: true,
        feedNextCursor: "cursor-2",
      }).length,
    ).toBe(6);
  });
});

describe("communityFeedHasMoreFromClientSlice", () => {
  it("is false when full batch is already visible", () => {
    const rows = Array.from({ length: 10 }, (_, i) => post(`p${i}`));
    expect(
      communityFeedHasMoreFromClientSlice({
        searchFilteredPosts: rows,
        feedPage: 1,
        feedNextCursor: null,
      }),
    ).toBe(false);
  });
});
