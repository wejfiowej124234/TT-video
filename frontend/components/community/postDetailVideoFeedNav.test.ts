import { describe, expect, it } from "vitest";
import {
  detailFeedPostIdsFromPosts,
  detailVideoFeedDrawerProps,
  detailVideoFeedIndex,
  detailVideoFeedPostIdsFromPosts,
  resolveDetailVideoFeedNavigate,
} from "./postDetailVideoFeedNav";
import type { CommunityPost } from "@/lib/communityMockData";

function post(id: string, type: CommunityPost["type"] = "video"): CommunityPost {
  return {
    id,
    type,
    is_video: type === "video",
    title: id,
    content: "",
    author: { id: "u1", nickname: "n", avatar_url: null, role: "tourist" },
    likes: 0,
    comments: 0,
    collects: 0,
    created_at: "2026-01-01T00:00:00Z",
  } as CommunityPost;
}

describe("postDetailVideoFeedNav", () => {
  it("collects all feed post ids in order (photo + video unified)", () => {
    expect(
      detailFeedPostIdsFromPosts([post("a"), post("b", "photo"), post("c")]),
    ).toEqual(["a", "b", "c"]);
    expect(detailVideoFeedPostIdsFromPosts([post("a"), post("b", "photo")])).toEqual(["a", "b"]);
  });

  it("navigates prev/next and signals load-more at last", () => {
    const ids = ["v1", "v2", "v3"];
    expect(resolveDetailVideoFeedNavigate(ids, "v2", "prev")).toEqual({ nextPostId: "v1", atLastShouldLoadMore: false });
    expect(resolveDetailVideoFeedNavigate(ids, "v2", "next")).toEqual({ nextPostId: "v3", atLastShouldLoadMore: false });
    expect(resolveDetailVideoFeedNavigate(ids, "v3", "next")).toEqual({ nextPostId: null, atLastShouldLoadMore: true });
    expect(detailVideoFeedIndex(ids, "v2")).toBe(1);
  });

  it("detailVideoFeedDrawerProps returns nav props for any post type when feed has 2+", () => {
    const posts = [post("a", "photo"), post("b", "video")];
    let active: CommunityPost | null = posts[1]!;
    const setActive = (next: CommunityPost | null) => {
      active = next;
    };
    const props = detailVideoFeedDrawerProps(posts, active, setActive);
    expect(props.videoFeedPostIds).toEqual(["a", "b"]);
    props.onVideoFeedSelect?.("a");
    expect(active?.id).toBe("a");
  });

  it("detailVideoFeedDrawerProps is empty when fewer than 2 posts", () => {
    const photo = post("p", "photo");
    expect(detailVideoFeedDrawerProps([photo], photo, () => {})).toEqual({});
  });
});
