/**
 * me 安全子路由：无 chain_off → 503（routes/me.rs）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import {
  deleteMeSessionBySuffix,
  deleteMeSessionCurrent,
  getMeSecurityNotifications,
  getMeSessions,
} from ".";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

describe("getMeSessions", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("rejects HTTP 503 chain_off_unavailable", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "chain_off_unavailable", message: "chain_off_unavailable" }, 503)
    );
    await expect(getMeSessions()).rejects.toThrow("chain_off_unavailable");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.meSessions),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      })
    );
  });
});

describe("deleteMeSessionCurrent", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("rejects HTTP 503 chain_off_unavailable", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "chain_off_unavailable", message: "chain_off_unavailable" }, 503)
    );
    await expect(deleteMeSessionCurrent()).rejects.toThrow("chain_off_unavailable");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.meSessionCurrent),
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("getMeSecurityNotifications", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("rejects HTTP 401 login_required", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "login_required", message: "login_required" }, 401)
    );
    await expect(getMeSecurityNotifications()).rejects.toThrow("login_required");
  });

  it("rejects HTTP 503 chain_off_unavailable", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(
        false,
        {
          status: "error",
          error: "chain_off_unavailable",
          message: "chain_off_unavailable",
          path: "GET /api/v1/me/security-notifications",
        },
        503
      )
    );
    await expect(getMeSecurityNotifications()).rejects.toThrow("chain_off_unavailable");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.meSecurityNotifications()),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      })
    );
  });

  it("rejects HTTP 503 me_security_notifications_db_read_failed", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(
        false,
        {
          status: "error",
          error: "me_security_notifications_db_read_failed",
          message: "me_security_notifications_db_read_failed",
        },
        503
      )
    );
    await expect(getMeSecurityNotifications({ limit: 10 })).rejects.toThrow(
      "me_security_notifications_db_read_failed"
    );
  });

  it("returns 200 ok with empty items when PG pool unavailable (chain_off without DB)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        items: [],
        meta: { implementation_status: "user_security_notifications_db_unavailable" },
      })
    );
    const out = (await getMeSecurityNotifications()) as {
      status: string;
      items: unknown[];
      meta: { implementation_status: string };
    };
    expect(out.status).toBe("ok");
    expect(out.items).toEqual([]);
    expect(out.meta.implementation_status).toBe("user_security_notifications_db_unavailable");
  });

  it("returns 200 ok with items when DB path succeeds", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        items: [
          {
            id: "n1",
            event_type: "login",
            template_key: "t1",
            delivery_status: "sent",
            payload: {},
            attempts: 0,
            last_error: null,
            created_at: "2026-01-01T00:00:00Z",
          },
        ],
        meta: { implementation_status: "user_security_notifications_db" },
      })
    );
    const out = (await getMeSecurityNotifications({ limit: 5, status: "unread", event_type: "login" })) as {
      status: string;
      items: unknown[];
    };
    expect(out.status).toBe("ok");
    expect(out.items).toHaveLength(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.meSecurityNotifications({ limit: 5, status: "unread", event_type: "login" })),
      expect.any(Object)
    );
  });
});

describe("deleteMeSessionBySuffix", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("rejects HTTP 503 chain_off_unavailable", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "chain_off_unavailable", message: "chain_off_unavailable" }, 503)
    );
    await expect(deleteMeSessionBySuffix("abc12345")).rejects.toThrow("chain_off_unavailable");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.meSessionBySuffix("abc12345")),
      expect.objectContaining({ method: "DELETE" })
    );
  });
});
