import { describe, expect, it } from "vitest";
import {
  dedupeCommunityFeedPostsById,
  mergeCommunityFeedLocalAndApiPosts,
} from "./mergeCommunityFeedLocalAndApiPosts";

describe("mergeCommunityFeedLocalAndApiPosts", () => {
  it("drops local posts whose id already exists in api feed", () => {
    const local = [
      { id: "opt-1", body: "pending" },
      { id: "srv-1", body: "stale local copy" },
    ];
    const api = [{ id: "srv-1", body: "from api" }];
    const merged = mergeCommunityFeedLocalAndApiPosts(local, api);
    expect(merged.map((p) => p.id)).toEqual(["opt-1", "srv-1"]);
    expect(merged[1]?.body).toBe("from api");
  });

  it("preserves api order and appends api-only ids", () => {
    const local = [{ id: "opt-a", body: "a" }];
    const api = [
      { id: "srv-2", body: "b" },
      { id: "srv-3", body: "c" },
    ];
    expect(mergeCommunityFeedLocalAndApiPosts(local, api).map((p) => p.id)).toEqual([
      "opt-a",
      "srv-2",
      "srv-3",
    ]);
  });

  it("dedupes duplicate ids keeping first occurrence", () => {
    const posts = [
      { id: "tt-showcase-post-004", body: "first" },
      { id: "p2", body: "b" },
      { id: "tt-showcase-post-004", body: "dup" },
    ];
    const out = dedupeCommunityFeedPostsById(posts);
    expect(out).toHaveLength(2);
    expect(out[0]?.body).toBe("first");
  });
});
