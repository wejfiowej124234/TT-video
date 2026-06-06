/**
 * TT-ORDERS-LIST-UI-002b：`/orders` 移动端左滑 tray（① · 可选 · 非走廊必跑）
 *
 * 松手吸附阈值由 `lib/orders/ordersListCardSwipe.test.ts` 机读覆盖；
 * 本 spec 在真机 / headed 浏览器可选手动验收。
 */
import { test, expect, devices } from "@playwright/test";
import { ordersPageShell } from "./helpers/pageShells";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

const iphone13 = devices["iPhone 13"];
test.use({
  viewport: iphone13.viewport,
  userAgent: iphone13.userAgent,
  deviceScaleFactor: iphone13.deviceScaleFactor,
  isMobile: true,
  hasTouch: true,
});

test.describe("orders list swipe (mobile · optional)", () => {
  test("左滑壳与 tray 已挂载（开合手势见单测）", async ({ page, request }) => {
    test.setTimeout(90_000);
    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) test.skip(true, `API 不通：${API_HEALTH}`);

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

    const swipeShell = page.locator('[data-tt-orders-card-swipe="1"]').first();
    if (!(await swipeShell.isVisible().catch(() => false))) {
      test.skip(true, "无支持滑动的订单卡片");
    }

    await expect(swipeShell.locator('[data-tt-orders-card-swipe-tray="1"]')).toBeAttached();
  });
});
