/**
 * TT-ORDERS-ESCROW-LINK-001：`/orders` 列表卡片 → `/escrow/[id]` 深链与面包屑（① · 本地）
 */
import { test, expect } from "@playwright/test";
import { ordersPageShell } from "./helpers/pageShells";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

test.describe("orders list → escrow detail link", () => {
  test("登录后点击订单卡片进入托管页并显示返回列表面包屑", async ({ page, request }) => {
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

    const detailLink = page.getByRole("link", { name: /托管详情|Escrow details/i }).first();
    const overlayLink = page.locator('[data-tt-orders-list-card-escrow-link="1"]').first();
    if ((await detailLink.count()) === 0 && (await overlayLink.count()) === 0) {
      test.skip(true, "当前账号无可见订单卡片");
    }

    const target = (await detailLink.isVisible().catch(() => false)) ? detailLink : overlayLink;
    await Promise.all([page.waitForURL(/\/escrow\/[^/]+/, { timeout: 25_000 }), target.click()]);

    await expect(page.locator('[data-tt-escrow-detail-page="1"]')).toBeVisible({ timeout: 20_000 });

    const breadcrumb = page.locator('[data-tt-escrow-orders-breadcrumb="1"]');
    if ((await breadcrumb.count()) > 0) {
      await expect(breadcrumb.getByRole("link", { name: /订单|Orders/i })).toBeVisible();
    } else {
      await expect(
        page.getByRole("link", { name: /返回订单|Back to orders/i }).first(),
      ).toBeVisible();
    }
  });
});
