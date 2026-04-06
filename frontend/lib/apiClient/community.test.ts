/**
 * 51-T4 社区接口级集成测试：getFeed / getMyPosts / getFeedbackList / postFeedback 等与后端契约一致。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../api";
import {
  getFeed,
  getFeedbackList,
  getMyPosts,
  getUserPosts,
  postCommunityReport,
  postFeedback,
  getCommunityReport,
  getMyCommunityReports,
} from "./community";

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

describe("community API client (51-T4)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getFeed returns parsed body when status 200 and JSON has status+posts", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, { status: "ok", posts: [] }));
    const out = await getFeed();
    expect(out.status).toBe("ok");
    expect(out.posts).toEqual([]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.feed),
      expect.objectContaining({ headers: expect.objectContaining({ "Content-Type": "application/json" }) })
    );
  });

  it("getFeed rejects when !res.ok (parseResponse)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(false, { error: "x" }, 500));
    await expect(getFeed()).rejects.toThrow();
  });

  it("getFeed passes cursor, limit, and mode as query params", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", posts: [], note: "placeholder" })
    );
    await getFeed({ cursor: "abc", limit: 10, mode: "follow" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("cursor=abc"),
      expect.any(Object)
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("limit=10"),
      expect.any(Object)
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("mode=follow"),
      expect.any(Object)
    );
  });

  it("getFeed passes tag as query param when set", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, { status: "ok", posts: [] }));
    await getFeed({ tag: "京都" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/[?&]tag=%E4%BA%AC%E9%83%BD(&|$)/),
      expect.any(Object)
    );
  });

  it("getMyPosts returns parsed body when status 200", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        posts: [{ id: "p1", user_id: "u1", body: "hi", post_type: "text", tags: [], media_urls: [], created_at: "2025-01-01T00:00:00Z" }],
        next_cursor: "next1",
      })
    );
    const out = await getMyPosts();
    expect(out.status).toBe("ok");
    expect(out.posts).toHaveLength(1);
    expect(out.posts![0].id).toBe("p1");
    expect(out.next_cursor).toBe("next1");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.mePosts),
      expect.objectContaining({ headers: expect.objectContaining({ "Content-Type": "application/json" }) })
    );
  });

  it("getMyPosts rejects when !res.ok", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(false, {}, 502));
    await expect(getMyPosts()).rejects.toThrow();
  });

  it("getUserPosts passes visibility when set", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, { status: "ok", posts: [] }));
    await getUserPosts("550e8400-e29b-41d4-a716-446655440000", { visibility: "private" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/users\/550e8400-e29b-41d4-a716-446655440000\/posts.*[?&]visibility=private/),
      expect.any(Object)
    );
  });

  it("getMyPosts passes visibility query when not all", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, { status: "ok", posts: [] }));
    await getMyPosts({ visibility: "archived" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/[?&]visibility=archived(&|$)/),
      expect.any(Object)
    );
  });

  it("postCommunityReport parses JSON on non-2xx (e.g. 429 abuse)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        status: "error",
        message: "report_rate_limited",
        errors: { body: "report_rate_limited" },
      }),
    });
    const tid = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
    const out = await postCommunityReport({
      target_type: "post",
      target_id: tid,
      reason_code: "spam",
      details: "  note  ",
    });
    expect(out).toMatchObject({
      status: "error",
      message: "report_rate_limited",
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.reports),
      expect.objectContaining({
        method: "POST",
        body: expect.stringMatching(new RegExp(tid)),
      })
    );
    const rawBody = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string;
    const parsed = JSON.parse(rawBody) as { details?: string };
    expect(parsed.details).toBe("note");
  });

  it("getMyCommunityReports omits query when no limit", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, { status: "ok", items: [] }));
    const out = await getMyCommunityReports();
    expect(out).toEqual({ status: "ok", items: [] });
    expect(globalThis.fetch).toHaveBeenCalledWith(apiUrl(routes.community.meReports), expect.any(Object));
  });

  it("getMyCommunityReports caps limit in query", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, { status: "ok", items: [] }));
    await getMyCommunityReports({ limit: 999 });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("limit=100"),
      expect.any(Object)
    );
  });

  it("getCommunityReport rejects when HTTP forbidden (parseResponse)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { message: "forbidden" }, 403)
    );
    const id = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
    await expect(getCommunityReport(id)).rejects.toThrow();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/v1/community/reports/${id}`),
      expect.any(Object)
    );
  });

  it("getFeedbackList GETs feedback route and returns envelope (54-S19)", async () => {
    const item = {
      id: "f1",
      category: "feedback_category_product",
      content: "hello",
      status: "open",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", items: [item] })
    );
    const out = await getFeedbackList();
    expect(out.status).toBe("ok");
    expect(out.items).toEqual([item]);
    expect(globalThis.fetch).toHaveBeenCalledWith(apiUrl(routes.community.feedback), expect.any(Object));
  });

  it("getFeedbackList rejects when HTTP not ok", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(false, {}, 502));
    await expect(getFeedbackList()).rejects.toThrow();
  });

  it("getFeedbackList rejects when envelope status is not ok", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", message: "login_required" })
    );
    await expect(getFeedbackList()).rejects.toThrow();
  });

  it("postFeedback POSTs JSON and returns parsed body (with optional media_urls)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok", id: "new-id" }),
    });
    const out = await postFeedback({
      category: "feedback_category_attraction",
      content: "  text  ",
      media_urls: ["data:image/jpeg;base64,abc"],
    });
    expect(out).toMatchObject({ status: "ok", id: "new-id" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.feedback),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          category: "feedback_category_attraction",
          content: "  text  ",
          media_urls: ["data:image/jpeg;base64,abc"],
        }),
      })
    );
  });

  it("postFeedback omits media_urls when empty array", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok", id: "x" }),
    });
    await postFeedback({ category: "feedback_category_other", content: "c" });
    const body = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string;
    expect(JSON.parse(body)).toEqual({ category: "feedback_category_other", content: "c" });
  });

  it("postFeedback returns null when JSON is not an object", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => null,
    });
    expect(await postFeedback({ category: "c", content: "x" })).toBeNull();
  });

  it("postFeedback parses JSON on non-2xx so UI can read status/error envelope (54-S19)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        status: "error",
        message: "invalid_payload",
        errors: { content: "empty_body" },
      }),
    });
    const out = await postFeedback({ category: "feedback_category_product", content: "x" });
    expect(out).toMatchObject({
      status: "error",
      message: "invalid_payload",
      errors: { content: "empty_body" },
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.feedback),
      expect.objectContaining({ method: "POST" })
    );
  });
});
