/**
 * 51-T3：`useCommunityFeed` 再导出的 `mapApiCommentToCommunityComment` 单测
 */
import { describe, expect, it } from "vitest";
import { mapApiCommentToCommunityComment } from "./useCommunityFeed";

describe("mapApiCommentToCommunityComment", () => {
  it("uses author_nickname and author_avatar_url when present", () => {
    const out = mapApiCommentToCommunityComment({
      id: "c1",
      post_id: "p1",
      user_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      body: "hi",
      created_at: "2025-03-04T12:00:00Z",
      author_nickname: "Traveler One",
      author_avatar_url: "https://example.com/a.png",
    });
    expect(out.author.nickname).toBe("Traveler One");
    expect(out.author.avatar_url).toBe("https://example.com/a.png");
  });

  it("uses author_role on comment when present", () => {
    const out = mapApiCommentToCommunityComment({
      id: "c1",
      post_id: "p1",
      user_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      body: "hi",
      created_at: "2025-03-04T12:00:00Z",
      author_nickname: "G",
      author_role: "guide",
    });
    expect(out.author.role).toBe("guide");
  });

  it("falls back to user_id prefix when no author_nickname", () => {
    const out = mapApiCommentToCommunityComment({
      id: "c1",
      post_id: "p1",
      user_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      body: "hi",
      created_at: "2025-03-04T12:00:00Z",
    });
    expect(out.author.nickname).toBe("aaaaaaaa");
    expect(out.author.avatar_url).toBeNull();
  });
});
