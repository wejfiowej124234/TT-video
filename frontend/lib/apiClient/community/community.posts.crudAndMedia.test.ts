/**
 * 社区帖子 CRUD / 可见性 / 上传媒体（与 `community.posts.createCommentsLikes.test` 互补）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl } from "../../api";
import { routes } from "../../api/routes";
import {
  getPostById,
  deletePost,
  patchPostVisibility,
  uploadCommunityPostMedia,
} from "./posts";
import {
  COMMUNITY_POSTS_TEST_POST_ID as pid,
  mockTextResponse,
} from "./community.posts.testShared";

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

  it("rejects HTTP 200 envelope when only message is invalid_id (get_post_detail parity)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", message: "invalid_id" })
    );
    await expect(getPostById("not-a-uuid")).rejects.toThrow("invalid_id");
  });
});

describe("deletePost", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("parses JSON body on success", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(await deletePost(pid)).toEqual({ status: "ok" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.postById(pid)),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("rejects when HTTP 500 + status:error delete_failed (posts.rs envelope)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "error", error: "delete_failed", message: "delete_failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    );
    await expect(deletePost(pid)).rejects.toThrow("delete_failed");
  });

  it("rejects HTTP 200 envelope when only message carries not_found_or_forbidden", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "error", message: "not_found_or_forbidden" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    await expect(deletePost(pid)).rejects.toThrow("not_found_or_forbidden");
  });

  it("rejects on invalid JSON body", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response("null", { status: 200, headers: { "Content-Type": "application/json" } })
    );
    await expect(deletePost(pid)).rejects.toThrow();
  });
});

describe("patchPostVisibility", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("PATCHes visibility_status", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "ok", visibility_status: "private" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
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

  it("rejects when HTTP 500 + status:error update_failed", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "error", error: "update_failed", message: "update_failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    );
    await expect(patchPostVisibility(pid, "public")).rejects.toThrow("update_failed");
  });

  it("rejects HTTP 200 envelope when only message carries invalid_visibility_status", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "error", message: "invalid_visibility_status" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    await expect(patchPostVisibility(pid, "public")).rejects.toThrow("invalid_visibility_status");
  });
});

describe("uploadCommunityPostMedia", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs content_base64 and returns ok + url", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        status: "ok",
        url: "/api/v1/uploads/community-posts/abc.mp4",
      }),
    });
    const out = await uploadCommunityPostMedia("data:video/mp4;base64,AAAA");
    expect(out).toMatchObject({
      status: "ok",
      url: "/api/v1/uploads/community-posts/abc.mp4",
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.postsUploadMedia),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ content_base64: "data:video/mp4;base64,AAAA" }),
      })
    );
  });

  it("marks error when HTTP not ok but body says ok", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 413,
      json: async () => ({ status: "ok", url: "/x" }),
    });
    const out = await uploadCommunityPostMedia("x");
    expect(out?.status).toBe("error");
    expect(out?.message).toContain("413");
  });
});
