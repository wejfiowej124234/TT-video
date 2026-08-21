/**
 * 社区发帖 / 点赞 / 评论列表（与 `community.posts.crudAndMedia.test` 互补；31 §2.2～2.3）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import {
  COMMUNITY_COMMENT_LIST_API_MAX,
  createPost,
  postLike,
  deleteLike,
  postComment,
  deleteComment,
  getPostComments,
} from ".";
import {
  COMMUNITY_POSTS_TEST_POST_ID as pid,
  mockTextResponse,
} from "./community.posts.testShared";

describe("createPost", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs payload and returns parsed body", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok", id: "new-post" }),
    });
    const out = await createPost({ body: "hello", post_type: "text" });
    expect(out).toEqual({ status: "ok", id: "new-post" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.posts),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ body: "hello", post_type: "text" }),
      })
    );
  });

  it("returns null when json parse fails", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error("bad");
      },
    });
    expect(await createPost({ body: "x" })).toBeNull();
  });
});

describe("postLike / deleteLike", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs like with Idempotency-Key", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok" }),
    });
    expect(await postLike(pid)).toEqual({ status: "ok" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.postLike(pid)),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Idempotency-Key": expect.any(String),
          "X-Idempotency-Key": expect.any(String),
        }),
      })
    );
  });

  it("DELETEs like with Idempotency-Key", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok" }),
    });
    expect(await deleteLike(pid)).toEqual({ status: "ok" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.postLike(pid)),
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          "Idempotency-Key": expect.any(String),
          "X-Idempotency-Key": expect.any(String),
        }),
      })
    );
  });
});

describe("postComment", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs body and optional parent_id with Idempotency-Key", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok", id: "c1" }),
    });
    await postComment(pid, "nice", "parent-uuid");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.postComments(pid)),
      expect.objectContaining({
        body: JSON.stringify({ body: "nice", parent_id: "parent-uuid" }),
        headers: expect.objectContaining({
          "Idempotency-Key": expect.any(String),
          "X-Idempotency-Key": expect.any(String),
        }),
      })
    );
  });

  it("sends parent_id null when parent omitted", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok" }),
    });
    await postComment(pid, "root");
    const raw = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string;
    expect(JSON.parse(raw)).toEqual({ body: "root", parent_id: null });
    const headers = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers as Record<
      string,
      string
    >;
    expect(headers["Idempotency-Key"]).toBeTruthy();
    expect(headers["X-Idempotency-Key"]).toBe(headers["Idempotency-Key"]);
  });

  it("reuses the same Idempotency-Key for identical post/body/parent", async () => {
    const ok = {
      ok: true,
      status: 200,
      json: async () => ({ status: "ok", id: "c1" }),
    };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(ok).mockResolvedValueOnce(ok);
    await postComment(pid, "same text", "p1");
    await postComment(pid, "same text", "p1");
    const h1 = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers as Record<
      string,
      string
    >;
    const h2 = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[1][1].headers as Record<
      string,
      string
    >;
    expect(h1["Idempotency-Key"]).toBe(h2["Idempotency-Key"]);
    expect(h1["Idempotency-Key"]).toMatch(/^tt-cmt-/);
  });
});


describe("deleteComment", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("DELETEs postCommentById with Idempotency-Key", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ status: "ok", deleted: true }),
      json: async () => ({ status: "ok", deleted: true }),
    });
    await deleteComment(pid, "c1");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(`${routes.community.postComments(pid)}/c1`),
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          "Idempotency-Key": expect.any(String),
          "X-Idempotency-Key": expect.any(String),
        }),
      })
    );
  });
});
describe("getPostComments", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("defaults to sort=hot (engagement then chrono)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", comments: [] })
    );
    await getPostComments(pid);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${routes.community.postComments(pid)}?sort=hot`),
      expect.any(Object)
    );
  });

  it("omits sort query when chronological", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", comments: [] })
    );
    await getPostComments(pid, { sort: "chronological" });
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).not.toContain("sort=");
  });

  it("adds sort= when not chronological", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", comments: [] })
    );
    await getPostComments(pid, { sort: "hot" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${routes.community.postComments(pid)}?sort=hot`),
      expect.any(Object)
    );
  });

  it("maps sort hottest to sort=hot in request URL", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", comments: [] })
    );
    await getPostComments(pid, { sort: "hottest" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${routes.community.postComments(pid)}?sort=hot`),
      expect.any(Object)
    );
  });

  it("rejects HTTP 200 envelope when only message carries invalid_comment_cursor (gateway may strip error)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", message: "invalid_comment_cursor" })
    );
    await expect(getPostComments(pid)).rejects.toThrow("invalid_comment_cursor");
  });

  it("rejects HTTP 200 envelope when only message carries comments_cursor_requires_chronological_sort", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "error",
        message: "comments_cursor_requires_chronological_sort",
      })
    );
    await expect(getPostComments(pid)).rejects.toThrow("comments_cursor_requires_chronological_sort");
  });

  it("caps limit query to COMMUNITY_COMMENT_LIST_API_MAX", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", comments: [] })
    );
    await getPostComments(pid, { sort: "chronological", limit: 99_999 });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`limit=${COMMUNITY_COMMENT_LIST_API_MAX}`),
      expect.any(Object)
    );
  });

  it("forces sort=chronological when cursor is set (04 GET …/comments keyset)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", comments: [], next_cursor: null })
    );
    const cur = "C|2026-01-01T00:00:00Z|aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    await getPostComments(pid, { sort: "hot", cursor: cur });
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toMatch(/cursor=/);
    expect(url).toContain(encodeURIComponent(cur));
    expect(url).toContain("sort=chronological");
    expect(url).not.toContain("sort=hot");
  });
});
