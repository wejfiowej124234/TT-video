import { describe, it, expect } from "vitest";
import { mergeApiCommentsWithLocalOptimistic, mergeCommunityCommentPages } from "./communityCommentPagesMerge";
import type { CommunityComment } from "@/lib/communityMockData";

function row(id: string, postId = "p1"): CommunityComment {
  return {
    id,
    post_id: postId,
    author: { id: "a", nickname: "A", avatar_url: null, role: "tourist" },
    content: "x",
    created_at: "2026-01-01T00:00:00Z",
  };
}

describe("mergeCommunityCommentPages", () => {
  it("appends new ids in order", () => {
    const a = [row("1"), row("2")];
    const b = [row("3")];
    expect(mergeCommunityCommentPages(a, b).map((c) => c.id)).toEqual(["1", "2", "3"]);
  });

  it("skips duplicate ids from overlapping pages", () => {
    const a = [row("1"), row("2")];
    const b = [row("2"), row("3")];
    expect(mergeCommunityCommentPages(a, b).map((c) => c.id)).toEqual(["1", "2", "3"]);
  });

  it("returns a copy when chunk is empty", () => {
    const a = [row("1")];
    const out = mergeCommunityCommentPages(a, []);
    expect(out).toEqual(a);
    expect(out).not.toBe(a);
  });
});

describe("mergeApiCommentsWithLocalOptimistic", () => {
  it("keeps API order and appends locals not in API", () => {
    const api = [row("1"), row("2")];
    const local = [row("loc"), row("1")];
    expect(mergeApiCommentsWithLocalOptimistic(api, local).map((c) => c.id)).toEqual(["1", "2", "loc"]);
  });

  it("drops local rows whose id already exists in API", () => {
    const api = [row("srv")];
    const local = [row("srv")];
    expect(mergeApiCommentsWithLocalOptimistic(api, local)).toHaveLength(1);
    expect(mergeApiCommentsWithLocalOptimistic(api, local)[0].id).toBe("srv");
  });
});
