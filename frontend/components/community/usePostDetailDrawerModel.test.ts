import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { CommunityPost } from "@/lib/communityMockData";
import { usePostDetailDrawerModel } from "./usePostDetailDrawerModel";

const basePost: CommunityPost = {
  id: "post-a",
  type: "photo",
  content: "hello",
  media_url: "https://example.com/a.jpg",
  media_urls: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
  tags: [],
  author: { id: "u1", nickname: "U", avatar_url: null, role: "tourist" },
  likes: 0,
  comments: 0,
  collects: 0,
  created_at: new Date().toISOString(),
};

function renderModel(post: CommunityPost) {
  return renderHook(
    (p: CommunityPost) =>
      usePostDetailDrawerModel({
        post: p,
        comments: [],
        onClose: () => {},
        onCommentSend: async () => {},
        t: (k) => k,
        isLoggedIn: true,
      }),
    { initialProps: post },
  );
}

describe("usePostDetailDrawerModel", () => {
  it("logged-in composer input stays enabled until auth/sending blocks", () => {
    const { result } = renderModel(basePost);
    expect(result.current.composerInputDisabled).toBe(false);
    expect(result.current.sendDisabled).toBe(true);
    act(() => {
      result.current.setInput("hello");
    });
    expect(result.current.composerInputDisabled).toBe(false);
    expect(result.current.sendDisabled).toBe(false);
  });

  it("resets carouselIndex when post.id changes", () => {
    const { result, rerender } = renderModel(basePost);
    act(() => {
      result.current.setCarouselIndex(1);
    });
    expect(result.current.carouselIndex).toBe(1);
    rerender({
      ...basePost,
      id: "post-b",
      media_urls: ["https://example.com/c.jpg", "https://example.com/d.jpg"],
    });
    expect(result.current.carouselIndex).toBe(0);
  });

  it("showcase posts allow composer input without login", () => {
    const showcasePost: CommunityPost = { ...basePost, id: "tt-showcase-post-001" };
    const { result } = renderHook(() =>
      usePostDetailDrawerModel({
        post: showcasePost,
        comments: [],
        onClose: () => {},
        onCommentSend: async () => {},
        t: (k) => k,
        isLoggedIn: false,
        authPending: false,
      }),
    );
    expect(result.current.composerInputDisabled).toBe(false);
    expect(result.current.isShowcasePost).toBe(true);
  });
});
