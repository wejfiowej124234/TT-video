/**
 * 邮箱验证 API happy path（仅当 API 启用 **`TRAVELTRUST_AUTH_EMAIL_E2E_LOG_URL_IN_RESPONSE=1`**
 * + **`TRAVELTRUST_EMAIL_TRANSPORT=log`** + **`TRAVELTRUST_AUTH_TOKEN_PEPPER`** + **PG**）。
 */
import { test, expect } from "@playwright/test";

import { defaultApiBase } from "./helpers/apiSession";
import { parseAuthEmailTokenFromDevLogUrl } from "./helpers/authEmailDevLogUrl";
import { requestGetWith429Retry, requestPostWith429Retry } from "./helpers/playwright429Backoff";
import { skipIfApiDown } from "./helpers/skipIfApiDown";

const API_BASE = defaultApiBase();

test.describe("auth verify-email API (happy via _dev_log_url)", () => {
  test("register → verify-email → GET /me has email verified", async ({ request }) => {
    await skipIfApiDown(request);

    const stamp = Date.now();
    const email = `e2e-verify-happy-${stamp}@traveltrust.test`;
    const password = "Test123!";

    const reg = await requestPostWith429Retry(request, `${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email, password, nickname: `vh-${stamp}` },
    });
    const regTxt = await reg.text();
    if (!reg.ok()) {
      test.skip(true, `register failed HTTP ${reg.status()} — ${regTxt.slice(0, 200)}`);
    }
    const regBody = JSON.parse(regTxt) as {
      token?: string;
      _dev_log_url?: string;
      email_verification_link_sent?: boolean;
    };
    const bearer = regBody.token;
    if (!bearer) {
      test.skip(true, "register returned no session token");
    }
    const rawToken = parseAuthEmailTokenFromDevLogUrl(regBody._dev_log_url);
    if (!rawToken) {
      test.skip(
        true,
        "no _dev_log_url on register — set TRAVELTRUST_AUTH_EMAIL_E2E_LOG_URL_IN_RESPONSE=1, TRAVELTRUST_EMAIL_TRANSPORT=log, TRAVELTRUST_AUTH_TOKEN_PEPPER on API",
      );
    }

    const verifyRes = await requestPostWith429Retry(request, `${API_BASE}/auth/verify-email`, {
      headers: { "Content-Type": "application/json" },
      data: { token: rawToken },
    });
    const verifyTxt = await verifyRes.text();
    expect(
      verifyRes.ok(),
      `verify-email HTTP ${verifyRes.status()} body=${verifyTxt.slice(0, 300)}`,
    ).toBeTruthy();
    const verifyBody = JSON.parse(verifyTxt) as { status?: string; message?: string };
    expect(verifyBody.status).toBe("ok");
    expect(verifyBody.message).toBe("email_verified");

    const meRes = await requestGetWith429Retry(request, `${API_BASE}/api/v1/me`, {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    const meTxt = await meRes.text();
    expect(meRes.ok(), `GET /me HTTP ${meRes.status()}`).toBeTruthy();
    const meBody = JSON.parse(meTxt) as { email_verified_at?: string | null; user?: { email_verified_at?: string | null } };
    const verifiedAt = meBody.email_verified_at ?? meBody.user?.email_verified_at;
    expect(verifiedAt).toBeTruthy();
  });
});
