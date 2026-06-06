/**
 * Admin L5 Staging 收口 · 浏览器探针（capabilities 401 清会话 · 订单 nav 不 pending）
 * 由 scripts/dev/run-admin-l5-staging-audit.sh 调用。
 */
import { test, expect } from "@playwright/test";
import { appendFileSync } from "node:fs";

const WEB = (process.env.STAGING_WEB_BASE ?? "https://tt-web-staging.fly.dev").replace(/\/$/, "");
const API = (process.env.STAGING_API_BASE ?? "https://tt-api-staging.fly.dev").replace(/\/$/, "");
const EMAIL = process.env.STAGING_AUDIT_EMAIL ?? "tourist@test.com";
const PASS = process.env.STAGING_AUDIT_PASSWORD ?? "Test123!";
const OUT = process.env.STAGING_ADMIN_L5_BROWSER_OUT ?? "";

function record(id: string, ok: boolean, detail?: string) {
  if (!OUT) return;
  appendFileSync(
    OUT,
    `${JSON.stringify({ id, ok, detail: detail ?? null, ts: new Date().toISOString() })}\n`,
  );
}

test.describe("admin l5 staging closure", () => {
  test("invalid cookie-only /admin redirects to login", async ({ page }) => {
    await page.context().addCookies([
      { name: "traveltrust_user_id", value: "stale-uid-only", url: WEB },
    ]);
    await page.goto(`${WEB}/admin`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15_000 });
    record("fe_invalid_cookie_redirect", true);
  });

  test("stale Bearer clears session and redirects or shows session expired", async ({ page }) => {
    await page.context().addCookies([
      { name: "traveltrust_user_id", value: "00000000-0000-4000-8000-000000000099", url: WEB },
      { name: "traveltrust_session_ok", value: "1", url: WEB },
    ]);
    await page.addInitScript(() => {
      localStorage.setItem("traveltrust_user_id", "00000000-0000-4000-8000-000000000099");
      localStorage.setItem("traveltrust_session_token", "tts_stale_invalid_token_for_audit");
    });
    await page.goto(`${WEB}/admin`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await Promise.race([
      page.waitForURL(/\/auth\/login/, { timeout: 45_000 }),
      page
        .waitForResponse(
          (r) => r.url().includes("/api/v1/admin/capabilities") && r.status() === 401,
          { timeout: 45_000 },
        )
        .then(() => page.waitForTimeout(1500)),
    ]).catch(() => null);
    const url = page.url();
    const onLogin = /\/auth\/login/.test(url);
    if (onLogin) {
      record("fe_capabilities_401_session_clear", true, `redirect=${url}`);
      return;
    }
    const bodyText = await page.locator("body").innerText();
    const sessionExpiredMsg = /会话已过期|Session expired/i.test(bodyText);
    const lsToken = await page.evaluate(() => localStorage.getItem("traveltrust_session_token"));
    const lsUid = await page.evaluate(() => localStorage.getItem("traveltrust_user_id"));
    const cleared = !lsToken && !lsUid;
    expect(sessionExpiredMsg || cleared).toBeTruthy();
    record("fe_capabilities_401_session_clear", sessionExpiredMsg || cleared, `url=${url}`);
  });

  test("super_admin orders nav does not stay pending", async ({ page, request }) => {
    await request.post(`${API}/auth/seed-test-accounts`, {
      data: { promote_admin_email: EMAIL },
    });
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email: EMAIL, password: PASS },
    });
    expect(loginRes.ok()).toBeTruthy();
    const body = (await loginRes.json()) as { token?: string; user_id?: string; role?: string };
    const token = body.token?.trim() ?? "";
    const userId = body.user_id?.trim() ?? "";
    expect(token).toBeTruthy();
    expect(body.role).toBe("super_admin");

    await page.context().addCookies([
      { name: "traveltrust_user_id", value: userId, url: WEB },
      { name: "traveltrust_session_ok", value: "1", url: WEB },
    ]);
    await page.addInitScript(
      ([tok, uid]) => {
        localStorage.setItem("traveltrust_session_token", tok);
        localStorage.setItem("traveltrust_user_id", uid);
      },
      [token, userId] as [string, string],
    );

    await page.goto(`${WEB}/admin`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expect(page.locator('[data-tt-admin-capability-strip]')).toBeVisible({ timeout: 45_000 });

    const ordersLink = page.getByRole("link", { name: /Orders|订单/i }).first();
    await expect(ordersLink).toBeVisible({ timeout: 20_000 });
    await ordersLink.click();
    await page.waitForURL(/\/admin\/orders/, { timeout: 45_000 });

    const pending = page.locator('[data-tt-admin-nav-pending="1"]');
    await expect(pending).toHaveCount(0, { timeout: 20_000 });
    await expect(page.locator('[data-tt-admin-app-page="1"]')).toBeVisible({ timeout: 20_000 });
    record("fe_orders_nav_no_pending", true);
  });

  test("home inbox 去处理 navigates to queue list without frozen stall", async ({ page, request }) => {
    await request.post(`${API}/auth/seed-test-accounts`, {
      data: { promote_admin_email: EMAIL },
    });
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email: EMAIL, password: PASS },
    });
    expect(loginRes.ok()).toBeTruthy();
    const body = (await loginRes.json()) as { token?: string; user_id?: string };
    const token = body.token?.trim() ?? "";
    const userId = body.user_id?.trim() ?? "";
    expect(token).toBeTruthy();

    await page.context().addCookies([
      { name: "traveltrust_user_id", value: userId, url: WEB },
      { name: "traveltrust_session_ok", value: "1", url: WEB },
    ]);
    await page.addInitScript(
      ([tok, uid]) => {
        localStorage.setItem("traveltrust_session_token", tok);
        localStorage.setItem("traveltrust_user_id", uid);
      },
      [token, userId] as [string, string],
    );

    await page.goto(`${WEB}/admin`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expect(page.locator('[data-tt-admin-home-inbox="1"]')).toBeVisible({ timeout: 45_000 });

    const inbox = page.locator('[data-tt-admin-home-inbox="1"]');
    let processCta = inbox
      .locator('a[href^="/admin/"]')
      .filter({ hasText: /去处理|Process/i })
      .first();
    if ((await processCta.count()) === 0) {
      processCta = inbox
        .locator('a[href^="/admin/"]')
        .filter({ hasText: /查看|Open/i })
        .first();
    }
    if ((await processCta.count()) === 0) {
      processCta = inbox.locator('[data-tt-admin-inbox-all-clear="1"] a[href^="/admin/"]').first();
    }
    if ((await processCta.count()) === 0) {
      processCta = inbox.locator('a[href^="/admin/"]').first();
    }
    await expect(processCta).toBeVisible({ timeout: 30_000 });
    const href = (await processCta.getAttribute("href")) ?? "";
    expect(href).toMatch(/^\/admin\//);

    await processCta.click();
    await page.waitForURL(new RegExp(href.split("?")[0]!.replace(/\//g, "\\/")), { timeout: 45_000 });

    await expect(page.locator('[data-tt-admin-nav-pending="1"]')).toHaveCount(0, { timeout: 20_000 });
    await expect(page.locator('[data-tt-admin-app-page="1"]')).toBeVisible({ timeout: 30_000 });
    record("fe_home_inbox_cta_nav", true, href);
  });
});
