import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import { AUTH_USER_ID_KEY } from "../core";
import { getAdminAuthAuditEvents } from "./http";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

describe("getAdminAuthAuditEvents", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.setItem(AUTH_USER_ID_KEY, "admin-user-1");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("GETs auth-audit-events with query filters", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        items: [{ event_type: "auth_login_failure", reason: "invalid_credentials" }],
        applied_filters: { reason: "invalid_credentials", limit: 20 },
      }),
    );
    const out = await getAdminAuthAuditEvents({
      event_type: "auth_login_failure",
      reason: "invalid_credentials",
      limit: 20,
    });
    expect(out.items?.length).toBe(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(
        routes.admin.authAuditEvents({
          event_type: "auth_login_failure",
          reason: "invalid_credentials",
          limit: 20,
        }),
      ),
      expect.objectContaining({
        headers: expect.objectContaining({ "X-User-Id": "admin-user-1" }),
      }),
    );
  });
});
