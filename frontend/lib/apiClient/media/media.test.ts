/**
 * 270 media API 客户端（04 §3.4）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import { postMediaSignedUrls, getMediaAccess } from ".";

describe("postMediaSignedUrls", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs body and returns envelope", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          url: "http://localhost:8080/api/v1/media/access/tok",
          expires_at: "2026-01-01T00:00:00Z",
          token_id: "tok",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    const out = await postMediaSignedUrls({
      object_id: "evidence|550e8400-e29b-41d4-a716-446655440000|ab",
      scope: "read",
      expires_in: 120,
    });
    expect(out.token_id).toBe("tok");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(apiUrl(routes.mediaSignedUrls));
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string).scope).toBe("read");
  });

  it("rejects HTTP 503 database_required when no PG pool (post_signed_urls)", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "error",
          error: "database_required",
          message: "database_required",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      )
    );
    await expect(
      postMediaSignedUrls({
        object_id: "evidence|550e8400-e29b-41d4-a716-446655440000|ab",
        scope: "read",
      })
    ).rejects.toThrow("database_required");
  });

  it("rejects HTTP 401 login_required when unauthenticated (post_signed_urls)", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "login_required",
          message: "login_required",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    );
    await expect(
      postMediaSignedUrls({
        object_id: "evidence|550e8400-e29b-41d4-a716-446655440000|ab",
        scope: "read",
      })
    ).rejects.toThrow("login_required");
  });
});

describe("getMediaAccess", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("GETs without auth headers", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", content_hash: "ab" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const data = await getMediaAccess("550e8400-e29b-41d4-a716-446655440000");
    expect((data as { content_hash?: string }).content_hash).toBe("ab");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(apiUrl(routes.mediaAccess("550e8400-e29b-41d4-a716-446655440000")));
    expect(init.headers && (init.headers as Record<string, string>)["Authorization"]).toBeUndefined();
  });

  it("rejects HTTP 503 database_required when no PG pool (get_media_access)", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "error",
          error: "database_required",
          message: "database_required",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      )
    );
    await expect(getMediaAccess("550e8400-e29b-41d4-a716-446655440000")).rejects.toThrow(
      "database_required"
    );
  });

  it("rejects HTTP 410 token_expired (get_media_access)", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "token_expired",
          message: "token_expired",
          expires_at: "2020-01-01T00:00:00Z",
        }),
        { status: 410, headers: { "Content-Type": "application/json" } }
      )
    );
    await expect(getMediaAccess("550e8400-e29b-41d4-a716-446655440000")).rejects.toThrow("token_expired");
  });
});
