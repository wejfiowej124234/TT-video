/**
 * 账户 API（社区资料 / GET /me）：getMe（缓存/404/401）、getMeStats、putMe、putMePassword
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import { AUTH_USER_ID_KEY } from "../core";
import {
  clearGetMeCache,
  getMe,
  getMeFull,
  getMeStats,
  isMeFullRequestError,
  putMe,
  putMePassword,
} from ".";

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

describe("getMeFull", () => {
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

  it("returns null without fetch when no credentials", async () => {
    expect(await getMeFull()).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("throws login_required on HTTP 401 with envelope", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u");
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "login_required", message: "login_required" }, 401)
    );
    await expect(getMeFull()).rejects.toThrow("login_required");
  });

  it("returns body and warms getMe cache", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u");
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", user: { id: "u1", role: "tourist" } })
    );
    const out = await getMeFull();
    expect(out).toEqual({ status: "ok", user: { id: "u1", role: "tourist" } });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(await getMe()).toEqual(out);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});

describe("isMeFullRequestError", () => {
  it("flags AbortError", () => {
    const e = new Error("aborted");
    e.name = "AbortError";
    expect(isMeFullRequestError(e)).toBe(true);
  });

  it("does not flag login_required", () => {
    expect(isMeFullRequestError(new Error("login_required"))).toBe(false);
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

  it("accepts no-chain_off placeholder stats (get_me_stats)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        stats: { orders_total: 0, disputes_total: 0 },
        note: "占位：与 /api/v1/me 二选一或并存",
      })
    );
    const out = await getMeStats();
    expect(out.stats).toEqual({ orders_total: 0, disputes_total: 0 });
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

  it("rejects HTTP 503 chain_off_unavailable (put_me)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "chain_off_unavailable", message: "chain_off_unavailable" }, 503)
    );
    await expect(putMe({ nickname: "x" })).rejects.toThrow("chain_off_unavailable");
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

  it("rejects HTTP 503 chain_off_unavailable (put_me_password)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "chain_off_unavailable", message: "chain_off_unavailable" }, 503)
    );
    await expect(putMePassword({ old_password: "a", new_password: "b" })).rejects.toThrow(
      "chain_off_unavailable"
    );
  });
});
