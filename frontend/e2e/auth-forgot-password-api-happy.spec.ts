/**
 * 忘记密码 API 烟测（非仅打开页面）：**POST /auth/forgot-password** 对已注册邮箱须 **200** + 统一成功文案。
 * 与 **smoke.spec**「忘记密码页可访问」互补；不断言真实收件（取决于 **log/resend** 与邮箱提供商）。
 * 需本机 **traveltrust-api**（默认 **127.0.0.1:8080**）与 **DATABASE_URL**；与 **p01-login-market-auth.spec.ts** 同源 **API_BASE** 约定。
 */
import { test, expect } from "@playwright/test";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

test.describe("auth forgot-password API (happy + anti-enumeration)", () => {
  test("POST forgot-password for registered email returns 200 ok envelope", async ({ request }) => {
    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API not reachable at ${API_HEALTH}; start traveltrust-api`);
    }

    const stamp = Date.now();
    const email = `e2e-forgot-${stamp}@traveltrust.test`;
    const password = "Test123!";
    const reg = await request.post(`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email, password, nickname: `fgt-${stamp}` },
    });
    if (!reg.ok()) {
      test.skip(true, `register failed HTTP ${reg.status()} — body=${(await reg.text()).slice(0, 200)}`);
    }

    const forgot = await request.post(`${API_BASE}/auth/forgot-password`, {
      headers: { "Content-Type": "application/json" },
      data: { email },
    });
    const forgotTxt = await forgot.text();
    if (!forgot.ok()) {
      if (
        forgot.status() === 503 &&
        (forgotTxt.includes("auth_email_issue_failed") ||
          forgotTxt.includes("email_transport_not_configured"))
      ) {
        test.skip(
          true,
          `forgot-password HTTP 503 for existing user (outbound): set TRAVELTRUST_EMAIL_TRANSPORT=log for stable E2E, or fix Resend + TRAVELTRUST_PUBLIC_APP_BASE_URL allowlist. body=${forgotTxt.slice(0, 240)}`,
        );
      }
    }
    expect(forgot.ok(), `forgot-password HTTP ${forgot.status()} body=${forgotTxt.slice(0, 300)}`).toBeTruthy();
    const body = JSON.parse(forgotTxt) as { status?: string; message?: string };
    expect(body.status).toBe("ok");
    expect(body.message).toBe("if_account_exists_email_sent");
  });

  test("POST forgot-password for unknown email still 200 (anti-enumeration)", async ({ request }) => {
    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API not reachable at ${API_HEALTH}`);
    }

    const forgot = await request.post(`${API_BASE}/auth/forgot-password`, {
      headers: { "Content-Type": "application/json" },
      data: { email: `no-such-user-${Date.now()}@traveltrust.test` },
    });
    expect(forgot.ok()).toBeTruthy();
    const body = (await forgot.json()) as { status?: string; message?: string };
    expect(body.status).toBe("ok");
    expect(body.message).toBe("if_account_exists_email_sent");
  });
});
