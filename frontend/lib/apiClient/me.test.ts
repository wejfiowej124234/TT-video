/**
 * 个人中心：getMe（缓存/404/401）、getMeStats、putMe、putMePassword
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../api";
import { AUTH_USER_ID_KEY } from "./core";
import { clearGetMeCache, getMe, getMeStats, putMe, putMePassword } from "./me";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

describe("getMe", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.clear();
    clearGetMeCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    clearGetMeCache();
  });

  it("returns null without calling fetch when no credentials", async () => {
    expect(await getMe()).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("GETs /me when X-User-Id is set", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "user-me-1");
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", nickname: "n1" })
    );
    const out = await getMe();
    expect(out).toEqual({ status: "ok", nickname: "n1" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.me),
      expect.objectContaining({
        headers: expect.objectContaining({ "X-User-Id": "user-me-1" }),
      })
    );
  });

  it("returns null on HTTP 404", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u");
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => "",
    });
    expect(await getMe()).toBeNull();
  });

  it("returns null on HTTP 401 without parseResponse", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u");
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "{}",
    });
    expect(await getMe()).toBeNull();
  });

  it("reuses in-memory cache for subsequent calls within TTL", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u");
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", cached: true })
    );
    expect(await getMe()).toEqual({ status: "ok", cached: true });
    expect(await getMe()).toEqual({ status: "ok", cached: true });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});

describe("getMeStats", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("GETs me/stats", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", stats: { orders: 3 } })
    );
    const out = await getMeStats();
    expect(out).toEqual({ status: "ok", stats: { orders: 3 } });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.meStats),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      })
    );
  });

  it("rejects on envelope error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "login_required" })
    );
    await expect(getMeStats()).rejects.toThrow();
  });
});

describe("putMe", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("PUTs profile JSON with write headers", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await putMe({ nickname: "new" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.me),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ nickname: "new" }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": expect.any(String),
        }),
      })
    );
  });
});

describe("putMePassword", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("PUTs password JSON to me/password", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await putMePassword({ old_password: "a", new_password: "b" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.mePassword),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ old_password: "a", new_password: "b" }),
      })
    );
  });
});
