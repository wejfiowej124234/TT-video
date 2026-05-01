/**
 * 社区「我的」资料卡 → **`/me/security`** / **`/me/password`**（与 **`CommunityMeAccountSecurityRow`**、**`96-20 §5.6`** 对读）。
 * 需 API 可达（默认 **`PLAYWRIGHT_API_HEALTH_URL`**）且已 seed **`tourist@test.com`**（**`SEED_TEST_ACCOUNTS=1`**）。
 */
import { test, expect } from "@playwright/test";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

test.describe.serial("/community/me → account security row", () => {
  test.beforeEach(async ({ page, request }) => {
    const health = await request.get(API_HEALTH).catch(() => null);
    test.skip(!health?.ok(), `API not reachable at ${API_HEALTH}; start traveltrust-api`);

    const loginProbe = await request.post(`${API_BASE}/auth/login`, {
      headers: { "Content-Type": "application/json" },
      data: { email: "tourist@test.com", password: "Test123!" },
    });
    test.skip(
      !loginProbe.ok(),
      `seed login failed HTTP ${loginProbe.status()} — ensure SEED_TEST_ACCOUNTS=1 and tourist@test.com`,
    );

    await page.goto(`/auth/login?returnUrl=${encodeURIComponent("/community/me")}`);
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await Promise.all([
      page.waitForURL(/\/community\/me/, { timeout: 25_000 }),
      page.waitForResponse(
        (res) =>
          res.url().includes("/auth/login") &&
          res.request().method() === "POST" &&
          res.ok(),
        { timeout: 25_000 },
      ),
      page.getByRole("button", { name: /Log in|登录/i }).click(),
    ]);
  });

  test("→ /me/security：账号安全中心 h1", async ({ page }) => {
    const securityLink = page.getByRole("link", { name: /账号安全|Account security/i });
    await expect(securityLink).toBeVisible({ timeout: 20_000 });
    await Promise.all([
      page.waitForURL(/\/me\/security/, { timeout: 15_000 }),
      securityLink.click(),
    ]);

    await expect(
      page.getByRole("heading", { name: /账号安全中心|Account security center/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("→ /me/password：修改密码 h1", async ({ page }) => {
    const passwordLink = page.getByRole("link", { name: /修改密码|Change password/i });
    await expect(passwordLink).toBeVisible({ timeout: 20_000 });
    await Promise.all([
      page.waitForURL(/\/me\/password/, { timeout: 15_000 }),
      passwordLink.click(),
    ]);

    await expect(
      page.getByRole("heading", { name: /修改密码|Change password/i }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
