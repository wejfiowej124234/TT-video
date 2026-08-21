import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  COMMUNITY_COMMENT_OPTIMISTIC_DELETE_FORBIDDEN,
  deleteComment,
} from "@/lib/apiClient/community/comments";
import { COMMUNITY_COMMENT_OPTIMISTIC_ID_PREFIX } from "@/components/community/communityFeedConstants";
import { isCommunityOptimisticCommentId } from "@/components/community/communityFeedConstants";
import { filterCommentsAfterDelete } from "@/components/community/useCommunityFeedCommentDelete";
import type { CommunityComment } from "@/lib/communityMockData";

describe("community optimistic comment delete fail-closed", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("isCommunityOptimisticCommentId matches comment-local- prefix", () => {
    expect(isCommunityOptimisticCommentId(`${COMMUNITY_COMMENT_OPTIMISTIC_ID_PREFIX}1-abc`)).toBe(true);
    expect(isCommunityOptimisticCommentId("122f6e58-54f1-41be-b42d-82cbec08f68c")).toBe(false);
  });

  it("deleteComment refuses comment-local-* without calling fetch", async () => {
    await expect(
      deleteComment("post-1", `${COMMUNITY_COMMENT_OPTIMISTIC_ID_PREFIX}1786583209883-9ihn`),
    ).rejects.toThrow(COMMUNITY_COMMENT_OPTIMISTIC_DELETE_FORBIDDEN);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("deleteComment still hits network for server UUID", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({ status: "ok", deleted: true, removed_visible_count: 1 }),
      json: async () => ({ status: "ok", deleted: true, removed_visible_count: 1 }),
    });
    const out = await deleteComment("post-1", "122f6e58-54f1-41be-b42d-82cbec08f68c");
    expect(out.deleted).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("filterCommentsAfterDelete drops optimistic id locally", () => {
    const list: CommunityComment[] = [
      {
        id: `${COMMUNITY_COMMENT_OPTIMISTIC_ID_PREFIX}1`,
        post_id: "p",
        content: "x",
        created_at: "t",
        author: { id: "u", nickname: "n", avatar_url: null, role: "tourist" },
      },
      {
        id: "server-uuid",
        post_id: "p",
        content: "y",
        created_at: "t",
        author: { id: "u", nickname: "n", avatar_url: null, role: "tourist" },
      },
    ];
    expect(filterCommentsAfterDelete(list, `${COMMUNITY_COMMENT_OPTIMISTIC_ID_PREFIX}1`).map((c) => c.id)).toEqual([
      "server-uuid",
    ]);
  });
});
