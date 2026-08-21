/**
 * COMMUNITY-RUNTIME-RECOVERY-1 / COMMUNITY-CRASH-HOTFIX-1 · source contract
 * Guards the bccb2a11 crash: delete path must receive setApiCommentsByPostId
 * from useCommunityDrawerCommentsQuery (not an unbound identifier).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { filterCommentsAfterDelete } from "@/components/community/useCommunityFeedCommentDelete";
import type { CommunityComment } from "@/lib/communityMockData";

const FEED_SRC = join(__dirname, "useCommunityFeed.ts");

describe("useCommunityFeed comment-delete wiring (COMMUNITY-CRASH-HOTFIX-1)", () => {
  it("destructures setApiCommentsByPostId from useCommunityDrawerCommentsQuery", () => {
    const src = readFileSync(FEED_SRC, "utf8");
    const block = src.match(
      /const\s*\{([\s\S]*?)\}\s*=\s*useCommunityDrawerCommentsQuery\s*\(/,
    );
    expect(block, "useCommunityDrawerCommentsQuery destructure missing").toBeTruthy();
    expect(block![1]).toMatch(/\bsetApiCommentsByPostId\b/);
    expect(src).toMatch(/useCommunityFeedCommentDelete\(\s*\{[\s\S]*?setApiCommentsByPostId/);
    expect(src).not.toContain("window.confirm");
    expect(src).not.toContain("window.alert");
  });

  it("comment delete hook uses L5 confirm state instead of window.confirm", () => {
    const hook = readFileSync(join(__dirname, "useCommunityFeedCommentDelete.ts"), "utf8");
    const dialog = readFileSync(join(__dirname, "CommunityDeletePostConfirmDialog.tsx"), "utf8");
    const portal = readFileSync(join(__dirname, "CommunityFeedMainPostDetailPortal.tsx"), "utf8");
    expect(hook).not.toContain("window.confirm");
    expect(hook).not.toContain("window.alert");
    expect(hook).toContain("deleteConfirmCommentOpen");
    expect(dialog).toContain('variant?: ConfirmVariant');
    expect(portal).toContain('variant="comment"');
    expect(portal).toContain("CommunityDeletePostConfirmDialog");
  });

  it("filterCommentsAfterDelete drops root + nested replies", () => {
    const list: CommunityComment[] = [
      {
        id: "c1",
        post_id: "p1",
        content: "root",
        created_at: "2026-01-01T00:00:00Z",
        author: { id: "u1", nickname: "A", avatar_url: null, role: "traveler" },
      },
      {
        id: "c2",
        post_id: "p1",
        parent_id: "c1",
        content: "reply",
        created_at: "2026-01-01T00:01:00Z",
        author: { id: "u2", nickname: "B", avatar_url: null, role: "traveler" },
      },
      {
        id: "c3",
        post_id: "p1",
        content: "keep",
        created_at: "2026-01-01T00:02:00Z",
        author: { id: "u3", nickname: "C", avatar_url: null, role: "traveler" },
      },
    ];
    const next = filterCommentsAfterDelete(list, "c1");
    expect(next.map((c) => c.id)).toEqual(["c3"]);
  });
});
