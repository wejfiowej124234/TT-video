import { describe, expect, it } from "vitest";
import {
  COMMUNITY_COMMENT_ACTION_DELETE_CLASS,
  COMMUNITY_COMMENT_ACTION_REPLY_CLASS,
  COMMUNITY_COMMENT_DEFAULT_SORT,
  COMMUNITY_COMMENT_GUIDE_IDENTITY_CLASS,
  communityCommentAuthorIsGuide,
} from "@/lib/communityCommentIdentitySortUi";

describe("communityCommentIdentitySortUi", () => {
  it("defaults to hot (engagement then chrono) — no UI sort tabs", () => {
    expect(COMMUNITY_COMMENT_DEFAULT_SORT).toBe("hot");
  });

  it("treats escrow guide and role=guide as single guide identity", () => {
    expect(
      communityCommentAuthorIsGuide({
        id: "u1",
        nickname: "TTG",
        avatar_url: null,
        role: "guide",
        isEscrowGuide: false,
      }),
    ).toBe(true);
    expect(
      communityCommentAuthorIsGuide({
        id: "u1",
        nickname: "TTG",
        avatar_url: null,
        role: "traveler",
        isEscrowGuide: true,
      }),
    ).toBe(true);
    expect(
      communityCommentAuthorIsGuide({
        id: "u1",
        nickname: "TTG",
        avatar_url: null,
        role: "traveler",
        isEscrowGuide: false,
      }),
    ).toBe(false);
  });

  it("forces white/high-contrast reply+delete tokens", () => {
    expect(COMMUNITY_COMMENT_ACTION_REPLY_CLASS).toMatch(/text-slate-100|text-white/);
    expect(COMMUNITY_COMMENT_ACTION_DELETE_CLASS).toMatch(/text-slate-100|text-white/);
    expect(COMMUNITY_COMMENT_ACTION_REPLY_CLASS).not.toMatch(/text-ref-sun/);
    expect(COMMUNITY_COMMENT_ACTION_DELETE_CLASS).not.toMatch(/text-warning/);
    expect(COMMUNITY_COMMENT_GUIDE_IDENTITY_CLASS).toContain("text-sky-100");
  });
});
