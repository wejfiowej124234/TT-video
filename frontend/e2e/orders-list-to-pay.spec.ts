/**
 * TT-ORDERS-PAY-LINK-001：`/orders` 列表 → `/pay?orderId=` 深链（① · 本地）
 */
import { test, expect } from "@playwright/test";
import { ordersPageShell } from "./helpers/pageShells";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

test.describe("orders list → pay hub link", () => {
  test("登录后带 orderId 进入支付 Hub 并显示面包屑", async ({ page, request }) => {
    test.setTimeout(90_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不通：${API_HEALTH}`);
    }

    await request
      .post(`${API_BASE}/auth/seed-test-accounts`, {
        headers: { "Content-Type": "application/json" },
        data: "{}",
      })
      .catch(() => null);

    await page.goto(`/auth/login?returnUrl=${encodeURIComponent("/orders")}`);
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await page.waitForURL(/\/orders/, { timeout: 25_000 });

    await expect(ordersPageShell(page)).toBeVisible({ timeout: 15_000 });

    const payLink = page.locator('[data-tt-orders-list-pay-link="1"]').first();
    if ((await payLink.count()) === 0) {
      test.skip(true, "当前账号无可支付订单卡片");
    }

    await payLink.click({ force: true });
    await page.waitForURL(/\/pay\?.*orderId=/, { timeout: 25_000 });

    await expect(page.locator('[data-tt-pay-root="1"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-tt-pay-hub-l5="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-pay-orders-breadcrumb="1"]')).toBeVisible();
  });
});
