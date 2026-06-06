import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useState } from "react";
import { useCommunityFeedPostDeepLink } from "./useCommunityFeedPostDeepLink";
import type { CommunityPost } from "@/lib/communityMockData";
import { findCommunityShowcasePostById } from "@/lib/communityShowcase";

vi.mock("@/lib/apiClient/community", () => ({
  getPostById: vi.fn(),
}));

import { getPostById } from "@/lib/apiClient/community";

function useDeepLinkHarness(
  postQuery: string | null,
  posts: CommunityPost[] = [],
) {
  const [detailPost, setDetailPost] = useState<CommunityPost | null>(null);
  const [postDeepLinkBusy, setPostDeepLinkBusy] = useState(false);
  const [postDeepLinkAlert, setPostDeepLinkAlert] = useState<
    { kind: "unavailable" } | { kind: "load_failed"; message: string } | null
  >(null);
  const [postDeepLinkLastId, setPostDeepLinkLastId] = useState<string | null>(null);

  const searchParams = {
    get: (key: string) => (key === "post" ? postQuery : null),
  };

  useCommunityFeedPostDeepLink({
    searchParams,
    allPosts: posts,
    searchFilteredPosts: posts,
    postDeepLinkLastId,
    t: (k) => k,
    setDetailPost,
    setPostDeepLinkBusy,
    setPostDeepLinkAlert,
    setPostDeepLinkLastId,
  });

  return { detailPost, postDeepLinkBusy, postDeepLinkAlert };
}

describe("useCommunityFeedPostDeepLink · showcase ids", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens curated showcase post without calling getPostById", async () => {
    const { result } = renderHook(() => useDeepLinkHarness("tt-showcase-post-001"));

    await waitFor(() => {
      expect(result.current.detailPost?.id).toBe("tt-showcase-post-001");
    });
    expect(getPostById).not.toHaveBeenCalled();
    expect(result.current.postDeepLinkAlert).toBeNull();
    expect(findCommunityShowcasePostById("tt-showcase-post-001")?.content).toContain("祇园");
  });

  it("does not loop when feed posts refresh without ?post=", async () => {
    const post: CommunityPost = {
      id: "p-refresh-1",
      content: "hello",
      author: "u1",
      authorId: "u1",
      avatar: "",
      time: "1m",
      likes: 0,
      comments: 0,
      likedByMe: true,
      collectedByMe: false,
      postType: "text",
      tags: [],
      destination: "",
      mediaUrls: [],
    };

    const { result, rerender } = renderHook(
      ({ posts }) => useDeepLinkHarness(null, posts),
      { initialProps: { posts: [post] } },
    );

    for (let i = 0; i < 5; i += 1) {
      rerender({ posts: [{ ...post, likes: i }] });
    }

    expect(result.current.detailPost).toBeNull();
    expect(result.current.postDeepLinkBusy).toBe(false);
    expect(getPostById).not.toHaveBeenCalled();
  });

  it("does not loop when t identity changes on every render", () => {
    let tCalls = 0;
    const post: CommunityPost = {
      id: "p-t-unstable",
      content: "hello",
      author: "u1",
      authorId: "u1",
      avatar: "",
      time: "1m",
      likes: 0,
      comments: 0,
      likedByMe: true,
      collectedByMe: true,
      postType: "text",
      tags: [],
      destination: "",
      mediaUrls: [],
    };

    const { result, rerender } = renderHook(
      ({ posts }) => {
        const unstableT = () => `k-${++tCalls}`;
        const [detailPost, setDetailPost] = useState<CommunityPost | null>(null);
        const [postDeepLinkBusy, setPostDeepLinkBusy] = useState(false);
        const [postDeepLinkAlert, setPostDeepLinkAlert] = useState<
          { kind: "unavailable" } | { kind: "load_failed"; message: string } | null
        >(null);
        const [postDeepLinkLastId, setPostDeepLinkLastId] = useState<string | null>(null);
        useCommunityFeedPostDeepLink({
          searchParams: { get: (key) => (key === "post" ? "p-t-unstable" : null) },
          allPosts: posts,
          searchFilteredPosts: posts,
          postDeepLinkLastId,
          t: unstableT,
          setDetailPost,
          setPostDeepLinkBusy,
          setPostDeepLinkAlert,
          setPostDeepLinkLastId,
        });
        return { detailPost, postDeepLinkBusy, postDeepLinkAlert };
      },
      { initialProps: { posts: [post] } },
    );

    for (let i = 0; i < 6; i += 1) {
      rerender({ posts: [{ ...post, likes: i }] });
    }

    expect(result.current.detailPost?.id).toBe("p-t-unstable");
    expect(getPostById).not.toHaveBeenCalled();
  });
});
