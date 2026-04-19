/**
 * B-438 / P01：登录 → /market 后顶栏应从「登录/注册」切换为用户菜单（依赖 traveltrust:auth-change + useHasUser）。
 * 需本机 API（默认 http://127.0.0.1:8080）与 `NEXT_PUBLIC_API_BASE_URL` 一致。
 * 数据隔离：每次 **`POST /auth/register`** 生成唯一邮箱，避免「用户已存在 / 会话污染」类偶发失败。
 */
import { test, expect } from "@playwright/test";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

test.describe("P01 login → market header auth", () => {
  test("登录后进入 market 顶栏显示用户菜单", async ({ page, request }) => {
    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API not reachable at ${API_HEALTH}; start traveltrust-api and align NEXT_PUBLIC_API_BASE_URL`);
    }

    const stamp = Date.now();
    const email = `p01-e2e-${stamp}@e2e.local`;
    const password = "Test123!";
    const reg = await request.post(`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email, password, nickname: `p01-${stamp}` },
    });
    if (!reg.ok()) {
      test.skip(true, `register failed HTTP ${reg.status()} — body=${(await reg.text()).slice(0, 200)}`);
    }

    await page.goto("/auth/login?returnUrl=%2Fmarket");
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill(email);
    await page.getByLabel(/password|密码/i).fill(password);
    await Promise.all([
      page.waitForURL(/\/market/, { timeout: 25_000 }),
      page.waitForResponse(
        (res) =>
          res.url().includes("/auth/login") &&
          res.request().method() === "POST" &&
          res.ok(),
        { timeout: 25_000 },
      ),
      page.getByRole("button", { name: /Log in|登录/i }).click(),
    ]);

    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("header").getByRole("link", { name: /^Log in$|^登录$/ })).toHaveCount(0);
    await expect(page.locator("header").getByRole("link", { name: /^Register$|^注册$/ })).toHaveCount(0);
  });
});
