/**
 * 邮箱验证 API 烟测（契约 + 负路径）；完整 happy path 须 **`TRAVELTRUST_AUTH_TOKEN_PEPPER`** + 出站邮件（**`log`/`resend`**）取 raw token。
 */
import { test, expect } from "@playwright/test";

import { defaultApiBase } from "./helpers/apiSession";
import { requestPostWith429Retry } from "./helpers/playwright429Backoff";
import { skipIfApiDown } from "./helpers/skipIfApiDown";

const API_BASE = defaultApiBase();

test.describe("auth verify-email API", () => {
  test("POST verify-email with missing token returns 400 invalid_verify_token", async ({ request }) => {
    await skipIfApiDown(request);

    const res = await requestPostWith429Retry(request, `${API_BASE}/auth/verify-email`, {
      headers: { "Content-Type": "application/json" },
      data: {},
    });
    const txt = await res.text();
    if (res.status() === 503 && txt.includes("chain_off_unavailable")) {
      test.skip(true, "chain_off not mounted");
    }
    expect(res.status(), txt.slice(0, 200)).toBe(400);
    const body = JSON.parse(txt) as { error?: string };
    expect(body.error).toBe("token_required");
  });

  test("POST verify-email with bogus token returns 400 invalid_verify_token", async ({ request }) => {
    await skipIfApiDown(request);

    const res = await requestPostWith429Retry(request, `${API_BASE}/auth/verify-email`, {
      headers: { "Content-Type": "application/json" },
      data: { token: "not-a-valid-verify-token" },
    });
    const txt = await res.text();
    expect(res.status(), txt.slice(0, 200)).toBe(400);
    const body = JSON.parse(txt) as { error?: string };
    expect(body.error).toBe("invalid_verify_token");
  });
});
