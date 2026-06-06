/**
 * TT-ORDERS-LIST-UI-001：`/orders` 筛选 · 搜索 · 直订 CTA（① · 本地 API）
 */
import { test, expect } from "@playwright/test";
import { ordersPageShell } from "./helpers/pageShells";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

test.describe("orders list filters + search + CTA", () => {
  test("登录后筛选进行中、客户端搜索与直订入口", async ({ page, request }) => {
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

    const inProgressTab = page.getByRole("button", { name: /进行中|In progress/i });
    await expect(inProgressTab).toBeVisible();
    await inProgressTab.click();
    await expect(page).toHaveURL(/[?&]state=in_progress/);

    const loadMore = page.locator('[data-tt-orders-load-more="1"]');
    if (await loadMore.isVisible().catch(() => false)) {
      await loadMore.click();
      await expect(page).toHaveURL(/[?&]state=in_progress/);
    }

    const searchInput = page.locator('[data-tt-orders-search="1"] input[type="search"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill("zzz-no-match-e2e");
    await expect(page).toHaveURL(/[?&]q=/);
    await expect(page.locator('[data-tt-orders-search-empty="1"]')).toBeVisible({ timeout: 10_000 });

    await page
      .locator('[data-tt-orders-search-empty="1"]')
      .getByRole("button", { name: /清除搜索|Clear search/i })
      .click();
    await expect(page).not.toHaveURL(/[?&]q=/);

    const allTab = page.getByRole("button", { name: /全部订单|All orders/i });
    await allTab.click();
    await expect(page).not.toHaveURL(/[?&]state=/);
  });
});
