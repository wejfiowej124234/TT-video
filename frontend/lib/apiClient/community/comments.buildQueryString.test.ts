/**
 * **`buildCommunityPostCommentsQueryString`**（**04** **`GET …/comments`** query 语义；与 **`comments_sql_limit_for_sort`** 对读）。
 */
import { describe, expect, it } from "vitest";
import { buildCommunityPostCommentsQueryString } from "./comments";
import { COMMUNITY_COMMENT_LIST_API_MAX } from "./constants";

describe("buildCommunityPostCommentsQueryString", () => {
  it("defaults to sort=hot", () => {
    expect(buildCommunityPostCommentsQueryString()).toBe("sort=hot");
    expect(buildCommunityPostCommentsQueryString({ sort: "hot" })).toBe("sort=hot");
  });

  it("omits sort when chronological (no redundant default)", () => {
    expect(buildCommunityPostCommentsQueryString({ sort: "chronological" })).toBe("");
  });

  it("adds sort=latest when not chronological and no cursor", () => {
    const qs = buildCommunityPostCommentsQueryString({ sort: "latest" });
    expect(qs).toBe("sort=latest");
  });

  it("maps hottest to sort=hot", () => {
    const qs = buildCommunityPostCommentsQueryString({ sort: "hottest" });
    expect(qs).toBe("sort=hot");
  });

  it("includes clamped limit for chronological", () => {
    const qs = buildCommunityPostCommentsQueryString({ sort: "chronological", limit: 12 });
    expect(qs).toBe("limit=12");
  });

  it("clamps limit to COMMUNITY_COMMENT_LIST_API_MAX (Rust COMMENT_THREAD_FETCH_CAP)", () => {
    const qs = buildCommunityPostCommentsQueryString({
      sort: "chronological",
      limit: 99_999,
    });
    expect(qs).toBe(`limit=${COMMUNITY_COMMENT_LIST_API_MAX}`);
    expect(COMMUNITY_COMMENT_LIST_API_MAX).toBe(500);
  });

  it("forces sort=chronological when cursor is set (overrides hot/latest)", () => {
    const cur = "C|2026-01-01T00:00:00Z|aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const qs = buildCommunityPostCommentsQueryString({ sort: "hot", cursor: cur });
    expect(qs).toContain("sort=chronological");
    expect(qs).toContain(`cursor=${encodeURIComponent(cur)}`);
    expect(qs).not.toContain("sort=hot");
  });

  it("combines cursor + chronological limit", () => {
    const qs = buildCommunityPostCommentsQueryString({
      sort: "latest",
      cursor: "C|2026-01-02T00:00:00Z|bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      limit: 40,
    });
    expect(qs).toContain("sort=chronological");
    expect(qs).toContain("limit=40");
  });
});
