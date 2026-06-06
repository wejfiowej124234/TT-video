/**
 * 51-T4 社区接口级集成测试：getFeed / getMyPosts / getFeedbackList / postFeedback 等与后端契约一致。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import {
  COMMUNITY_FEED_LIST_API_MAX,
  COMMUNITY_FEED_TAG_QUERY_MAX_LEN,
  getFeed,
  getMyPosts,
  getUserPosts,
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
describe("community API client (51-T4) — feed & my posts", () => {
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

  it("getFeed trims tag in query", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, { status: "ok", posts: [] }));
    await getFeed({ tag: "  京都  " });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/[?&]tag=%E4%BA%AC%E9%83%BD(&|$)/),
      expect.any(Object)
    );
  });

  it("getFeed omits tag when blank after trim", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, { status: "ok", posts: [] }));
    await getFeed({ tag: "   " });
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).not.toMatch(/[?&]tag=/);
  });

  it("getFeed omits tag when longer than COMMUNITY_FEED_TAG_QUERY_MAX_LEN", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, { status: "ok", posts: [] }));
    await getFeed({ tag: "x".repeat(COMMUNITY_FEED_TAG_QUERY_MAX_LEN + 1) });
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).not.toMatch(/[?&]tag=/);
  });

  it("getFeed omits tag when UTF-8 bytes exceed limit even if JS length is smaller", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, { status: "ok", posts: [] }));
    const tag = "中".repeat(22);
    expect(tag.length).toBeLessThan(COMMUNITY_FEED_TAG_QUERY_MAX_LEN);
    await getFeed({ tag });
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).not.toMatch(/[?&]tag=/);
  });

  it("getFeed sends tag when within UTF-8 byte limit (CJK)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, { status: "ok", posts: [] }));
    const tag = "中".repeat(21);
    await getFeed({ tag });
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toMatch(/[?&]tag=/);
  });

  it("getFeed caps limit in query to COMMUNITY_FEED_LIST_API_MAX", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, { status: "ok", posts: [] }));
    await getFeed({ limit: 999 });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`limit=${COMMUNITY_FEED_LIST_API_MAX}`),
      expect.any(Object)
    );
  });

  it("getFeed passes geo anchor and proximity query params", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, { status: "ok", posts: [] }));
    await getFeed({
      anchor_poi_id: "hotel_lavande",
      max_distance_m: 1000,
      anchor_lat: 39.9042,
      anchor_lng: 116.4074,
    });
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain("anchor_poi_id=hotel_lavande");
    expect(url).toContain("max_distance_m=1000");
    expect(url).toContain("anchor_lat=39.9042");
    expect(url).toContain("anchor_lng=116.4074");
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

  it("getUserPosts caps limit in query", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, { status: "ok", posts: [] }));
    await getUserPosts("550e8400-e29b-41d4-a716-446655440000", { limit: 500 });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`limit=${COMMUNITY_FEED_LIST_API_MAX}`),
      expect.any(Object)
    );
  });

  it("getUserPosts rejects HTTP 200 envelope when only message is invalid_user_id (get_user_posts parity)", async () => {
    const badId = "not-a-valid-uuid";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", message: "invalid_user_id" })
    );
    await expect(getUserPosts(badId)).rejects.toThrow("invalid_user_id");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/v1/community/users/${badId}/posts`),
      expect.any(Object)
    );
  });

  it("getMyPosts caps limit in query", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, { status: "ok", posts: [] }));
    await getMyPosts({ limit: 10_000 });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`limit=${COMMUNITY_FEED_LIST_API_MAX}`),
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
});
