/**
 * Admin 认证审计只读 API：**GET /api/v1/admin/auth-audit-events**（须 admin Bearer + PG）。
 */
import { test, expect } from "@playwright/test";

import { defaultApiBase } from "./helpers/apiSession";
import { requestGetWith429Retry } from "./helpers/playwright429Backoff";
import { skipIfApiDown } from "./helpers/skipIfApiDown";

const API_BASE = defaultApiBase();

test.describe("admin auth-audit-events API", () => {
  test("GET with admin bearer returns ok envelope", async ({ request }) => {
    await skipIfApiDown(request);

    const bearer = process.env.PLAYWRIGHT_ADMIN_BEARER?.trim();
    if (!bearer) {
      test.skip(true, "PLAYWRIGHT_ADMIN_BEARER unset — set admin JWT for PG E2E");
    }

    const res = await requestGetWith429Retry(
      request,
      `${API_BASE}/api/v1/admin/auth-audit-events?limit=10&event_type=auth_login_failure`,
      { headers: { Authorization: `Bearer ${bearer}` } },
    );
    const txt = await res.text();
    if (res.status() === 503 && (txt.includes("session_db_unavailable") || txt.includes("chain_off"))) {
      test.skip(true, "admin auth audit requires PG + chain_off");
    }
    if (res.status() === 403) {
      test.skip(true, `Bearer not admin: ${txt.slice(0, 200)}`);
    }
    expect(res.ok(), `HTTP ${res.status()} body=${txt.slice(0, 300)}`).toBeTruthy();
    const body = JSON.parse(txt) as {
      status?: string;
      items?: unknown[];
      applied_filters?: { event_type?: string | null; limit?: number };
    };
    expect(body.status).toBe("ok");
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.applied_filters?.event_type).toBe("auth_login_failure");
  });

  test("GET without auth returns 401", async ({ request }) => {
    await skipIfApiDown(request);

    const res = await requestGetWith429Retry(
      request,
      `${API_BASE}/api/v1/admin/auth-audit-events?limit=5`,
    );
    expect(res.status()).toBe(401);
  });
});
