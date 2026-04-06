/**
 * 49 D-T3 辅助：D.8 市场页验收检查清单的 E2E 覆盖
 * 与 docs/spec/49-阶段建议-下一阶段方向与优先级.md D.8 对应；
 * 增补 07 §5.2 + P29：视图切换（双栏/订单/向导）与 `?view=guides` 深链（与 31 社区约向导入口一致）。
 * 需先 npm run dev 或 CI 由 webServer 启动。
 */
import { test, expect } from "@playwright/test";

test.describe("49 D.8 市场页验收（D-T3 辅助）", () => {
  test("市场页打开：/market 可访问，含标题/副标题或「自定义行程」按钮", async ({ page }) => {
    await page.goto("/market");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("main", { name: /Market|自由市场/i })).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("heading", { level: 1 }).filter({ hasText: /自由市场|发现|Market|Discover/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page
        .getByRole("button", { name: /自定义行程|Custom itinerary|发布行程/i })
        .or(page.getByRole("tablist", { name: /View switch|视图切换/i }))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("筛选或列表区可见（订单/向导/国家/城市/语言）", async ({ page }) => {
    await page.goto("/market");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/订单|向导|国家|城市|语言|筛选|Orders|Guides|Country|City|Filter/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("导航：从首页可进入市场页", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await page.getByRole("link", { name: /发现|Discover|市场|Market|自由市场/i }).first().click();
    await expect(page).toHaveURL(/\/(market|discover)/);
    await expect(
      page.getByText(/订单|向导|Orders|Guides|暂无|链上|Escrow/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("市场页含 P29 视图切换（双栏 / 订单 / 向导）", async ({ page }) => {
    await page.goto("/market");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("tablist", { name: /View switch|视图切换/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("tab", { name: /Split|双栏/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Orders|订单/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Guides|向导/i })).toBeVisible();
  });

  test("市场页可切换至仅订单视图并同步 URL", async ({ page }) => {
    await page.goto("/market");
    await expect(page.locator("body")).toBeVisible();
    await page.getByRole("tab", { name: /Orders|订单/i }).click();
    await expect(page).toHaveURL(/view=orders/);
  });

  test("市场页 view=guides 深链可加载", async ({ page }) => {
    await page.goto("/market?view=guides");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("main", { name: /Market|自由市场/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("tablist", { name: /View switch|视图切换/i })).toBeVisible({ timeout: 10_000 });
  });
});
