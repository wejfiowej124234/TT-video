/**
 * 重置密码 API 烟测（负路径）；happy path 须从邮件/log 取得 raw token（与 **forgot-password** 链互补）。
 */
import { test, expect } from "@playwright/test";

import { defaultApiBase } from "./helpers/apiSession";
import { requestPostWith429Retry } from "./helpers/playwright429Backoff";
import { skipIfApiDown } from "./helpers/skipIfApiDown";

const API_BASE = defaultApiBase();

test.describe("auth reset-password API", () => {
  test("POST reset-password with invalid token returns 400 invalid_reset_token", async ({ request }) => {
    await skipIfApiDown(request);

    const res = await requestPostWith429Retry(request, `${API_BASE}/auth/reset-password`, {
      headers: { "Content-Type": "application/json" },
      data: { token: "bogus-reset-token", new_password: "NewTest123!" },
    });
    const txt = await res.text();
    if (res.status() === 503 && txt.includes("chain_off_unavailable")) {
      test.skip(true, "chain_off not mounted");
    }
    expect(res.status(), txt.slice(0, 200)).toBe(400);
    const body = JSON.parse(txt) as { error?: string };
    expect(body.error).toBe("invalid_reset_token");
  });

  test("POST reset-password with weak password returns 400", async ({ request }) => {
    await skipIfApiDown(request);

    const res = await requestPostWith429Retry(request, `${API_BASE}/auth/reset-password`, {
      headers: { "Content-Type": "application/json" },
      data: { token: "bogus-reset-token", new_password: "short" },
    });
    const txt = await res.text();
    expect(res.status(), txt.slice(0, 200)).toBe(400);
    const body = JSON.parse(txt) as { error?: string };
    expect(body.error).toBe("password_too_short");
  });
});
