/**
 * 270 media API 客户端（04 §3.4）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../api";
import { postMediaSignedUrls, getMediaAccess } from "./media";

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
});
