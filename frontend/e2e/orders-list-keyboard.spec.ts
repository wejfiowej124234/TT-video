/**
 * TT-ORDERS-LIST-UI-002：`/orders` 键盘 Enter 主操作（①）
 */
import { test, expect } from "@playwright/test";
import { ordersPageShell } from "./helpers/pageShells";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

async function loginOrdersPage(page: import("@playwright/test").Page, request: import("@playwright/test").APIRequestContext) {
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
}

test.describe("orders list keyboard", () => {
  test("键盘 Enter 对聚焦卡片执行主操作", async ({ page, request }) => {
    test.setTimeout(90_000);
    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) test.skip(true, `API 不通：${API_HEALTH}`);

    await loginOrdersPage(page, request);

    const list = page.locator('[data-tt-orders-card-list="1"], [data-tt-orders-card-list-virtual="1"]');
    const card = page.locator("article[id^='order-card-']").first();
    if (!(await card.isVisible().catch(() => false))) {
      test.skip(true, "无订单卡片可测键盘导航");
    }

    await list.click();
    await page.keyboard.press("ArrowDown");
    const focusedCard = page.locator('[data-tt-orders-card-focused="1"]');
    await expect(focusedCard).toBeVisible({ timeout: 5_000 });

    await focusedCard.press("Enter");
    await expect(page).toHaveURL(/\/(escrow\/|pay\?)/, { timeout: 15_000 });
  });
});
