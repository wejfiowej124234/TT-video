import { describe, expect, it } from "vitest";
import type { CommunityComment, CommunityPost } from "@/lib/communityMockData";
import {
  clearCommunityMePostRefIfId,
  filterCommunityMePostsExcludingId,
  mapCommunityMePostRefWithVisibility,
  mapCommunityMePostsWithVisibility,
  omitCommunityMeCommentsByPostId,
} from "./communityMePostsPageLocalState";

function post(id: string, vis: CommunityPost["visibilityStatus"]): CommunityPost {
  return {
    id,
    visibilityStatus: vis,
  } as CommunityPost;
}

describe("communityMePostsPageLocalState", () => {
  it("mapCommunityMePostsWithVisibility patches matching id", () => {
    const a = post("1", "public");
    const b = post("2", "private");
    expect(mapCommunityMePostsWithVisibility([a, b], "1", "private")).toEqual([
      { ...a, visibilityStatus: "private" },
      b,
    ]);
  });

  it("mapCommunityMePostRefWithVisibility returns null for null or non-match", () => {
    expect(mapCommunityMePostRefWithVisibility(null, "1", "private")).toBeNull();
    expect(mapCommunityMePostRefWithVisibility(post("2", "public"), "1", "private")).toEqual(
      post("2", "public")
    );
  });

  it("filterCommunityMePostsExcludingId removes one", () => {
    expect(filterCommunityMePostsExcludingId([post("1", "public"), post("2", "public")], "1")).toEqual([
      post("2", "public"),
    ]);
  });

  it("clearCommunityMePostRefIfId clears on id match", () => {
    expect(clearCommunityMePostRefIfId(post("1", "public"), "1")).toBeNull();
    expect(clearCommunityMePostRefIfId(post("2", "public"), "1")).toEqual(post("2", "public"));
  });

  it("omitCommunityMeCommentsByPostId drops key immutably", () => {
    const prev: Record<string, CommunityComment[]> = { a: [], b: [] };
    const next = omitCommunityMeCommentsByPostId(prev, "a");
    expect(next).not.toBe(prev);
    expect("a" in next).toBe(false);
    expect(next.b).toBe(prev.b);
  });
});
