/**
 * 51-T4 社区接口级集成测试：getFeed / getMyPosts / getFeedbackList / postFeedback 等与后端契约一致。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import {
  buildCommunityPostCommentsQueryString,
  COMMUNITY_COMMENT_LIST_API_MAX,
  COMMUNITY_FEED_LIST_API_MAX,
  COMMUNITY_FEED_TAG_QUERY_MAX_LEN,
  COMMUNITY_ME_REPORTS_LIST_API_MAX,
  communityPostTagExceedsServerUtf8Limit,
  communityPostTagUtf8ByteLenTrimmed,
  communityPostTagWithinServerUtf8Limit,
  getFeed,
  getFeedbackList,
  getMyPosts,
  getUserPosts,
  postCommunityReport,
  postFeedback,
  getCommunityReport,
  getMyCommunityReports,
  type CommunityCommentSortQueryInput,
} from ".";

/** `parseResponse` 使用 `res.text()`，与仅 mock `json()` 的旧测法对齐 */
function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  const text = JSON.stringify(body);
  return {
    ok,
    status: st,
    text: async () => text,
  };
}
describe("communityPostTagWithinServerUtf8Limit / communityPostTagExceedsServerUtf8Limit", () => {
  it("empty or whitespace-only is neither within nor exceeds", () => {
    expect(communityPostTagWithinServerUtf8Limit("")).toBe(false);
    expect(communityPostTagExceedsServerUtf8Limit("")).toBe(false);
    expect(communityPostTagWithinServerUtf8Limit("   ")).toBe(false);
    expect(communityPostTagExceedsServerUtf8Limit("   ")).toBe(false);
  });

  it("ASCII and CJK boundaries match Rust str::len semantics", () => {
    expect(communityPostTagWithinServerUtf8Limit("a".repeat(64))).toBe(true);
    expect(communityPostTagExceedsServerUtf8Limit("a".repeat(64))).toBe(false);
    expect(communityPostTagWithinServerUtf8Limit("a".repeat(65))).toBe(false);
    expect(communityPostTagExceedsServerUtf8Limit("a".repeat(65))).toBe(true);

    const okCjk = "中".repeat(21);
    expect(communityPostTagWithinServerUtf8Limit(okCjk)).toBe(true);
    expect(communityPostTagExceedsServerUtf8Limit(okCjk)).toBe(false);
    const badCjk = "中".repeat(22);
    expect(communityPostTagWithinServerUtf8Limit(badCjk)).toBe(false);
    expect(communityPostTagExceedsServerUtf8Limit(badCjk)).toBe(true);
    expect(badCjk.length).toBeLessThan(COMMUNITY_FEED_TAG_QUERY_MAX_LEN);
  });

  it("communityPostTagUtf8ByteLenTrimmed uses trim + UTF-8 bytes", () => {
    expect(communityPostTagUtf8ByteLenTrimmed("  a  ")).toBe(1);
    expect(communityPostTagUtf8ByteLenTrimmed("中".repeat(22))).toBe(66);
  });
});

describe("buildCommunityPostCommentsQueryString (pure; aligned with posts.rs CommentsQuery)", () => {
  it("default chronological omits sort param", () => {
    expect(buildCommunityPostCommentsQueryString()).toBe("");
    expect(buildCommunityPostCommentsQueryString({ sort: "chronological" })).toBe("");
  });

  it("hot and latest set sort only", () => {
    expect(buildCommunityPostCommentsQueryString({ sort: "hot" })).toBe("sort=hot");
    expect(buildCommunityPostCommentsQueryString({ sort: "latest" })).toBe("sort=latest");
  });

  it("hottest alias maps to sort=hot (normalize_comment_sort parity)", () => {
    expect(buildCommunityPostCommentsQueryString({ sort: "hottest" })).toBe("sort=hot");
    expect(
      buildCommunityPostCommentsQueryString({
        sort: "  HOTTEST " as unknown as CommunityCommentSortQueryInput,
      })
    ).toBe("sort=hot");
  });

  it("cursor forces chronological sort in query", () => {
    expect(buildCommunityPostCommentsQueryString({ cursor: " C|2024-01-01T00:00:00Z|00000000-0000-4000-8000-000000000001 ", sort: "hot" })).toBe(
      "cursor=C%7C2024-01-01T00%3A00%3A00Z%7C00000000-0000-4000-8000-000000000001&sort=chronological"
    );
  });

  it("clamps limit to API max", () => {
    expect(buildCommunityPostCommentsQueryString({ limit: 9999 })).toBe(`limit=${COMMUNITY_COMMENT_LIST_API_MAX}`);
    expect(buildCommunityPostCommentsQueryString({ limit: 0 })).toBe("limit=1");
  });

  it("combines sort hot with limit", () => {
    expect(buildCommunityPostCommentsQueryString({ sort: "hot", limit: 50 })).toBe("sort=hot&limit=50");
  });
});
