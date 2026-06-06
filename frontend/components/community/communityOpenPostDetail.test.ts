import { describe, expect, it } from "vitest";
import { communityOpenPostDetail } from "./communityOpenPostDetail";
import type { CommunityPost } from "@/lib/communityMockData";

const post = {
  id: "p1",
  type: "photo",
  content: "x",
  media_url: "",
  tags: [],
  author: { id: "a", nickname: "A", avatar_url: null, role: "tourist" },
  likes: 0,
  comments: 0,
  collects: 0,
  created_at: "",
} as CommunityPost;

describe("communityOpenPostDetail", () => {
  it("opens PostDetailDrawer and clears legacy commentPost", () => {
    const focusReturnTargetRef = { current: null as HTMLElement | null };
    let detailFocus = false;
    let commentPost: CommunityPost | null = post;
    let detailPost: CommunityPost | null = null;

    communityOpenPostDetail({
      post,
      focusComments: true,
      focusReturnTargetRef,
      setDetailFocusComments: (v) => {
        detailFocus = v;
      },
      setCommentPost: (p) => {
        commentPost = p;
      },
      setDetailPost: (p) => {
        detailPost = p;
      },
    });

    expect(commentPost).toBeNull();
    expect(detailPost).toBe(post);
    expect(detailFocus).toBe(true);
  });
});
