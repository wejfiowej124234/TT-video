/**
 * 重置密码 API happy path（**`_dev_log_url`** 同源；见 **auth-verify-email-api-happy** 头注释）。
 */
import { test, expect } from "@playwright/test";

import { defaultApiBase } from "./helpers/apiSession";
import { parseAuthEmailTokenFromDevLogUrl } from "./helpers/authEmailDevLogUrl";
import { requestPostWith429Retry } from "./helpers/playwright429Backoff";
import { skipIfApiDown } from "./helpers/skipIfApiDown";

const API_BASE = defaultApiBase();

test.describe("auth reset-password API (happy via _dev_log_url)", () => {
  test("register → forgot → reset → login with new password", async ({ request }) => {
    await skipIfApiDown(request);

    const stamp = Date.now();
    const email = `e2e-reset-happy-${stamp}@traveltrust.test`;
    const password = "Test123!";
    const newPassword = "NewTest456!";

    const reg = await requestPostWith429Retry(request, `${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email, password, nickname: `rh-${stamp}` },
    });
    if (!reg.ok()) {
      test.skip(true, `register failed HTTP ${reg.status()}`);
    }

    const forgot = await requestPostWith429Retry(request, `${API_BASE}/auth/forgot-password`, {
      headers: { "Content-Type": "application/json" },
      data: { email },
    });
    const forgotTxt = await forgot.text();
    expect(forgot.ok(), `forgot HTTP ${forgot.status()} body=${forgotTxt.slice(0, 300)}`).toBeTruthy();
    const forgotBody = JSON.parse(forgotTxt) as { _dev_log_url?: string; message?: string };
    expect(forgotBody.message).toBe("if_account_exists_email_sent");
    const rawToken = parseAuthEmailTokenFromDevLogUrl(forgotBody._dev_log_url);
    if (!rawToken) {
      test.skip(true, "no _dev_log_url on forgot-password — enable E2E log URL env on API (see verify-email happy spec)");
    }

    const resetRes = await requestPostWith429Retry(request, `${API_BASE}/auth/reset-password`, {
      headers: { "Content-Type": "application/json" },
      data: { token: rawToken, new_password: newPassword },
    });
    const resetTxt = await resetRes.text();
    expect(resetRes.ok(), `reset HTTP ${resetRes.status()} body=${resetTxt.slice(0, 300)}`).toBeTruthy();
    const resetBody = JSON.parse(resetTxt) as { status?: string };
    expect(resetBody.status).toBe("ok");

    const loginRes = await requestPostWith429Retry(request, `${API_BASE}/auth/login`, {
      headers: { "Content-Type": "application/json" },
      data: { email, password: newPassword },
    });
    const loginTxt = await loginRes.text();
    expect(loginRes.ok(), `login after reset HTTP ${loginRes.status()}`).toBeTruthy();
    const loginBody = JSON.parse(loginTxt) as { status?: string; token?: string };
    expect(loginBody.status).toBe("ok");
    expect(loginBody.token).toBeTruthy();
  });
});
