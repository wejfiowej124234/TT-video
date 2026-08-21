import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  COMMUNITY_COMMENT_OFFLINE_I18N_KEY,
  COMMUNITY_COMMENTS_LOAD_FAILED_I18N_KEY,
  COMMUNITY_COMMENT_SEND_I18N_FALLBACK,
  COMMUNITY_COMMENT_SEND_OFFLINE,
  COMMUNITY_COMMENT_SEND_POST_NOT_OK,
  COMMUNITY_COMMENT_SEND_WRAP_FAILED,
  buildCommunityDrawerCommentRow,
  communityCommentAuthorFromMeUser,
  communityCommentOfflineMessage,
  postCommunityDrawerComment,
} from "./communityDrawerCommentSend";
import { postComment } from "@/lib/apiClient/community";

vi.mock("@/lib/apiClient/community", () => ({
  postComment: vi.fn(),
}));

describe("communityDrawerCommentSend", () => {
  const t = (k: string) => `t:${k}`;

  it("exposes stable send-error message tokens for Feed / drawer catch alignment", () => {
    expect(COMMUNITY_COMMENT_SEND_OFFLINE).toBe("comment_offline");
    expect(COMMUNITY_COMMENT_SEND_POST_NOT_OK).toBe("comment_post_not_ok");
    expect(COMMUNITY_COMMENT_SEND_I18N_FALLBACK).toBe("community_comment_send_failed");
    expect(COMMUNITY_COMMENT_SEND_WRAP_FAILED).toBe("comment_send_failed");
    expect(COMMUNITY_COMMENT_OFFLINE_I18N_KEY).toBe("community_comment_offline");
    expect(COMMUNITY_COMMENTS_LOAD_FAILED_I18N_KEY).toBe("community_comments_loadFailed");
  });

  describe("communityCommentOfflineMessage", () => {
    it("returns null when online", () => {
      expect(communityCommentOfflineMessage(t)).toBeNull();
    });

    it("returns offline key message when navigator reports offline", () => {
      const orig = navigator.onLine;
      try {
        Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
        expect(communityCommentOfflineMessage(t)).toBe(`t:${COMMUNITY_COMMENT_OFFLINE_I18N_KEY}`);
      } finally {
        Object.defineProperty(navigator, "onLine", { value: orig, configurable: true });
      }
    });
  });

  describe("communityCommentAuthorFromMeUser", () => {
    it("matches Feed unknown fallback when meUser missing", () => {
      const a = communityCommentAuthorFromMeUser(null, "—");
      expect(a).toEqual({ id: "unknown", nickname: "—", avatar_url: null, role: "tourist" });
    });
  });

  describe("buildCommunityDrawerCommentRow", () => {
    it("uses me id and nickname when present", () => {
      const row = buildCommunityDrawerCommentRow({
        postId: "p1",
        content: "hi",
        commentId: "c1",
        meUser: {
          id: "u-uuid",
          nickname: "Nina",
          avatar_url: null,
          role: "traveler",
          default_wallet_address: null,
        },
        t,
        createdAtIso: "2026-01-01T00:00:00.000Z",
      });
      expect(row).toMatchObject({
        id: "c1",
        post_id: "p1",
        content: "hi",
        created_at: "2026-01-01T00:00:00.000Z",
        author: { id: "u-uuid", nickname: "Nina", role: "traveler" },
      });
    });

    it("falls back when meUser is null", () => {
      const row = buildCommunityDrawerCommentRow({
        postId: "p1",
        content: "x",
        commentId: "c2",
        meUser: null,
        t,
        createdAtIso: "fixed",
      });
      expect(row.author.id).toBe("unknown");
      expect(row.author.nickname).toBe("t:ui_em_dash");
    });
  });

  describe("postCommunityDrawerComment", () => {
    beforeEach(() => {
      vi.mocked(postComment).mockReset();
    });

    it("returns ok with commentId when API returns id", async () => {
      vi.mocked(postComment).mockResolvedValue({ id: "new-c", status: "ok" });
      const r = await postCommunityDrawerComment({
        postId: "p9",
        content: "hello",
        parentId: undefined,
        logContext: "TestCtx",
      });
      expect(r).toEqual({ ok: true, commentId: "new-c" });
      expect(postComment).toHaveBeenCalledWith("p9", "hello", undefined);
    });

    it("returns ok: false when response has no id", async () => {
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(postComment).mockResolvedValue({ status: "error", message: "x" });
      const r = await postCommunityDrawerComment({
        postId: "p1",
        content: "a",
        logContext: "TestCtx",
      });
      expect(r).toEqual({ ok: false, body: { status: "error", message: "x" } });
      expect(errSpy).toHaveBeenCalled();
      errSpy.mockRestore();
    });

    it("returns softDuplicate for comment_duplicate without console.error", async () => {
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(postComment).mockResolvedValue({
        status: "error",
        error: "comment_duplicate",
        message: "comment_duplicate",
      });
      const r = await postCommunityDrawerComment({
        postId: "p1",
        content: "same",
        logContext: "TestCtx",
      });
      expect(r).toEqual({ ok: true, softDuplicate: true });
      expect(errSpy).not.toHaveBeenCalled();
      errSpy.mockRestore();
    });

    it("does not console.error for expected abuse codes like comment_too_fast", async () => {
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(postComment).mockResolvedValue({
        status: "error",
        error: "comment_too_fast",
        message: "comment_too_fast",
      });
      const r = await postCommunityDrawerComment({
        postId: "p1",
        content: "a",
        logContext: "TestCtx",
      });
      expect(r).toEqual({
        ok: false,
        body: { status: "error", error: "comment_too_fast", message: "comment_too_fast" },
      });
      expect(errSpy).not.toHaveBeenCalled();
      errSpy.mockRestore();
    });
  });
});
