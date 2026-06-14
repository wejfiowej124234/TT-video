/**
 * TT-ORDERS-LIST-UI-001：`/orders` 筛选 · 直订 CTA（① · 本地 API）
 * 搜索栏组件保留于 `OrdersListSearchBar.tsx`，主列表页 Phase① 未接线（见 ordersListL5.contract）。
 */
import { test, expect } from "@playwright/test";
import { ordersPageShell } from "./helpers/pageShells";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

test.describe("orders list filters + CTA", () => {
  test("登录后筛选进行中与直订入口", async ({ page, request }) => {
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
    await expect(page.locator('[data-tt-orders-list-book-cta="primary"]').first()).toBeVisible();
    const filterRail = page.locator('[data-tt-orders-filter-rail="1"]');
    await expect(filterRail).toBeVisible();

    const inProgressTab = filterRail.getByRole("button", { name: /进行中|In progress/i });
    await expect(inProgressTab).toBeVisible();
    await inProgressTab.click();
    await expect(page).toHaveURL(/[?&]state=in_progress/);

    const loadMore = page.locator('[data-tt-orders-load-more="1"]');
    if (await loadMore.isVisible().catch(() => false)) {
      await loadMore.click();
      await expect(page).toHaveURL(/[?&]state=in_progress/);
    }

    const allTab = filterRail.getByRole("button", { name: /全部订单|All orders/i }).first();
    await allTab.click();
    await expect(page).not.toHaveURL(/[?&]state=/);
  });
});
