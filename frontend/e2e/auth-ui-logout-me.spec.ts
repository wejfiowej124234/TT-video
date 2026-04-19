/**
 * UI：登录 → 打开用户菜单 → 登出 → 顶栏回到未登录；旧 session token 再 GET /api/v1/me 须 401。
 * 需 API 可达（默认 PLAYWRIGHT_API_BASE_URL=http://127.0.0.1:8080）且已 seed tourist@test.com。
 */
import { test, expect } from "@playwright/test";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;
const SESSION_KEY = "traveltrust_session_token";

test.describe("UI logout invalidates session", { tag: "@e2e-sepolia-deferred" }, () => {
  test("登录后菜单登出，/api/v1/me 旧 token 401，顶栏显示登录", async ({ page, request }) => {
    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API not reachable at ${API_HEALTH}; start traveltrust-api`);
    }

    await page.goto("/auth/login?returnUrl=%2Fmarket");
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();

    await page.waitForURL(/\/market/, { timeout: 25_000 });
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 20_000,
    });

    const token = await page.evaluate((key) => localStorage.getItem(key), SESSION_KEY);
    expect(token?.trim().length).toBeGreaterThan(0);

    await page.getByRole("button", { name: /User menu|用户菜单/i }).click();
    await page.getByRole("menuitem", { name: /Log out|登出|退出/i }).click();

    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toHaveCount(0, {
      timeout: 15_000,
    });
    await expect(page.locator("header").getByRole("link", { name: /^Log in$|^登录$/ })).toBeVisible({
      timeout: 15_000,
    });

    const me = await request.get(`${API_BASE}/api/v1/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(me.status()).toBe(401);
    const meJson = (await me.json()) as { error?: string };
    expect(meJson.error).toBe("login_required");
  });
});
