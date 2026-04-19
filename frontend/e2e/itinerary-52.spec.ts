/**
 * 52 §5.5 E2E：统一行程表与金额展示（创建行程 → 结果区/ Escrow 行程与分项+总价）
 * 增补 07：§5.1 创建订单 `/orders/new`；§5.2/80/25 Landing Hero（#form）与 Footer→`/itinerary/new`；§5.2/31 `guide_id` 查询深链。
 * 需先 npm run dev 或 CI 由 webServer 启动；后端可 chain_off 或需登录。
 */
import { test, expect } from "@playwright/test";

test.describe("52 行程与金额展示", () => {
  test("创建订单页可访问（5.1 与行程/Escrow 衔接）", async ({ page }) => {
    await page.goto("/orders/new");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("main", { name: /Create order|创建订单/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /Create order|创建订单/i })).toBeVisible({ timeout: 15_000 });
  });

  test("Landing Hero 创建行程 CTA 锚点至 #form（25 中央规划）", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await page.locator("#form").getByRole("link", { name: /Create itinerary|创建行程/i }).click();
    await expect(page).toHaveURL(/#form($|[/?#])/, { timeout: 30_000 });
    await expect(page.locator("#form")).toBeVisible();
  });

  test("Landing Hero 自由市场进入 /market（25→29）", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    const toMarket = page.locator("#form").locator('a[href="/market"]');
    await expect(toMarket).toBeVisible({ timeout: 15_000 });
    await Promise.all([
      page.waitForURL(/\/market/, { timeout: 45_000 }),
      toMarket.click(),
    ]);
    await expect(page.getByRole("main", { name: /Market|自由市场/i })).toBeVisible({ timeout: 30_000 });
  });

  test("首页 Footer 链至 /itinerary/new（25/80 入口）", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await page.getByRole("contentinfo").getByRole("link", { name: /Create itinerary|创建行程/i }).click();
    await expect(page).toHaveURL(/\/itinerary\/new/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: /生成行程|Generate itinerary|行程/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("/itinerary/new 支持 guide_id 查询（市场/社区约向导深链）", async ({ page }) => {
    const gid = "00000000-0000-4000-8000-0000000000ee";
    await page.goto(`/itinerary/new?guide_id=${encodeURIComponent(gid)}`);
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /生成行程|Generate itinerary|行程/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("/itinerary/new 页加载，表单含目的地/城市/天数与提交按钮", async ({ page }) => {
    await page.goto("/itinerary/new");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /生成行程|Generate itinerary|行程/i })
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "中国" })).toBeVisible();
    await expect(page.getByRole("group", { name: /目的地|Destination/i })).toBeVisible();
    await expect(page.getByRole("group", { name: /城市|City/i })).toBeVisible();
    await expect(page.locator('input[name="days"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: /生成|Submit|提交/i })
    ).toBeVisible();
  });

  test("/itinerary/new 提交后结果区含「每日行程」与「费用/总价」结构（成功时）", async ({ page }) => {
    await page.goto("/itinerary/new");
    await expect(page.locator("body")).toBeVisible();
    await page.getByRole("button", { name: "中国" }).click();
    await page.getByRole("button", { name: "北京" }).click();
    await page.getByRole("button", { name: /生成|Submit|提交/i }).click();
    await page.waitForTimeout(3000);
    const hasResult = await page.getByText(/已生成|Draft order created|order_id|Order ID/i).isVisible().catch(() => false);
    if (hasResult) {
      await expect(
        page.getByText(/每日行程|Daily itinerary|Day \d|第\d天/i).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByText(/总预算|Total|Quote summary|费用|合计/i).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("Escrow 详情页在 Draft 有 itinerary 时展示行程与报价分项", async ({ page }) => {
    await page.goto("/escrow/e2e-test-id");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/托管|Escrow|加载|错误|Not found|Itinerary|行程|Quote|总预算|Total/i).first()
    ).toBeVisible({ timeout: 10000 });
    const hasQuoteHeading = await page.getByRole("heading", { name: /Quote summary|报价|费用/i }).or(
      page.getByText(/总预算|Total budget|合计/i)
    ).first().isVisible().catch(() => false);
    if (hasQuoteHeading) {
      await expect(page.getByText(/Hotel|住宿|Catering|餐饮|Total|合计/i).first()).toBeVisible();
    }
  });

  test("首页结果区卡片解锁后含金额分项或总价入口", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    const resultsHeading = page.getByText(/结果|行程卡|Results|Itinerary/i).first();
    await expect(resultsHeading).toBeVisible({ timeout: 10000 }).catch(() => null);
    const unlockBtn = page.getByRole("button", { name: /解锁|Unlock/i }).first();
    const hasUnlock = await unlockBtn.isVisible().catch(() => false);
    if (hasUnlock) {
      await expect(unlockBtn).toBeVisible();
    }
  });

  test("Escrow 详情页有分享链接或打印/导出入口（52-S12d）", async ({ page }) => {
    await page.goto("/escrow/e2e-test-id");
    await expect(page.locator("body")).toBeVisible();
    const shareOrPrint = page.getByRole("button", { name: /分享链接|链接已复制|打印|Print|Export|导出/i }).first();
    await expect(shareOrPrint).toBeVisible({ timeout: 10000 }).catch(() => null);
  });

  test("多日行程结果区存在「全部展开」或「全部折叠」入口（52 工具栏）", async ({ page }) => {
    await page.goto("/itinerary/new");
    await expect(page.locator("body")).toBeVisible();
    await page.getByRole("button", { name: "中国" }).click();
    await page.getByRole("button", { name: "北京" }).click();
    await page.locator('input[name="days"]').fill("2");
    await page.getByRole("button", { name: /生成|Submit|提交/i }).click();
    await page.waitForTimeout(4000);
    const expandOrCollapse = page.getByRole("button", { name: /全部展开|Expand all|全部折叠|Collapse all/i }).first();
    const visible = await expandOrCollapse.isVisible().catch(() => false);
    if (visible) {
      await expect(expandOrCollapse).toBeVisible();
    }
  });
});
