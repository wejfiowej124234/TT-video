/**
 * 社区帖子/点赞/评论（31 §2.2～2.3；与 community.test 互补）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../api";
import {
  getPostById,
  deletePost,
  patchPostVisibility,
  createPost,
  postLike,
  deleteLike,
  postComment,
  getPostComments,
} from "./community";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

const pid = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

describe("getPostById", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("returns post envelope", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", post: { id: pid, body: "hi" } })
    );
    const out = await getPostById(pid);
    expect(out.status).toBe("ok");
    expect(out.post).toMatchObject({ id: pid, body: "hi" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.postById(pid)),
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    );
  });

  it("rejects on envelope error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", message: "not_found" })
    );
    await expect(getPostById(pid)).rejects.toThrow();
  });
});

describe("deletePost", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("parses JSON body on success", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok" }),
    });
    expect(await deletePost(pid)).toEqual({ status: "ok" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.postById(pid)),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("returns null when JSON not object", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => null,
    });
    expect(await deletePost(pid)).toBeNull();
  });
});

describe("patchPostVisibility", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("PATCHes visibility_status", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok", visibility_status: "private" }),
    });
    const out = await patchPostVisibility(pid, "private");
    expect(out).toMatchObject({ status: "ok", visibility_status: "private" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.postById(pid)),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ visibility_status: "private" }),
      })
    );
  });
});

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

  it("POSTs like", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok" }),
    });
    expect(await postLike(pid)).toEqual({ status: "ok" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.postLike(pid)),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("DELETEs like", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok" }),
    });
    expect(await deleteLike(pid)).toEqual({ status: "ok" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.postLike(pid)),
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("postComment", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs body and optional parent_id", async () => {
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
  });
});

describe("getPostComments", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("omits sort query when chronological (default)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", comments: [] })
    );
    await getPostComments(pid);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.postComments(pid)),
      expect.any(Object)
    );
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
});
