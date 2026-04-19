/**
 * 36 E2E：核心路径 Landing → Market → Escrow Detail（33/13-1 关键页）
 * 增补 07：§5.0 向导工作台、§5.2/80 行程生成入口、§5.2A 治理 Target 披露（与 smoke GOV_TARGET_NOTICE 一致）
 * 需先 npm run dev 或 CI 由 webServer 启动
 */
import { test, expect } from "@playwright/test";
import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";

/** 07 §5.2A / 13-1：治理页 Target 披露（与 e2e/smoke.spec.ts 同正则） */
const GOV_TARGET_NOTICE = /文档镜像|API 占位|placeholders|documentation mirrors|Protocol parameters|协议参数/i;

test.describe("核心路径 Landing → Market → Escrow Detail", () => {
  test("Landing 可访问并含发现/市场入口", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("link", { name: /发现|Discover|市场|自由市场/i }).first()).toBeVisible();
  });

  test("Market 页可访问并展示双栏或空态", async ({ page }) => {
    await page.goto("/market");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/订单|向导|Orders|Guides|暂无|空|链上撮合|Escrow/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Escrow Detail 页可打开（含状态或加载/错误态）", async ({ page }) => {
    await page.goto("/escrow/e2e-test-id");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/托管|状态|Status|加载|错误|Not found|Escrow/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("整条路径：Landing → Market → Escrow Detail", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    // 避免 name=/市场/ 误匹配其它文案；显式 href=/market（顶栏或首屏 CTA）
    const toMarket = page.locator('a[href="/market"]').first();
    await expect(toMarket).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/(market|discover)/, { timeout: 20_000 }),
      toMarket.click(),
    ]);
    // 与上条「Market 页」用例一致：双栏、空态或撮合文案（空库时未必出现「订单」）
    await expect(
      page.getByText(/订单|向导|Orders|Guides|暂无|空|链上撮合|Escrow/i).first(),
    ).toBeVisible({ timeout: 15_000 });
    await page.goto("/escrow/1");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/托管|状态|Status|加载|错误|Escrow/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("TT社区可访问并展示 Feed 或空态（45 关键路径）", async ({ page }) => {
    await page.goto("/community");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/动态|消息|好友|社区|Community|发帖|Feed/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  /** 36 §4.2：未连接钱包时 Escrow 页不展示链操作主按钮（13-1 §四） */
  test("Escrow 页未连接钱包时不展示 Deposit/Release 主按钮", async ({ page }) => {
    await page.goto("/escrow/1");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/托管|状态|Status|加载|错误|Connect wallet|连接钱包|Escrow/i).first()
    ).toBeVisible({ timeout: 10000 });
    const depositBtn = page.getByRole("button", { name: /Deposit|支付|存入/i });
    await expect(depositBtn).not.toBeVisible();
  });

  /** 51-T5：争议列表可访问（关键路径之一） */
  test("争议列表页可访问并展示列表或空态", async ({ page }) => {
    await page.goto("/disputes");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/争议|Dispute|列表|暂无|空|仲裁/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  /** 07 §5.2A：治理 hub 须可见 Target 披露（role=note） */
  test("治理页可访问且含 Target 披露", async ({ page }) => {
    await page.goto("/governance");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("main", { name: /Governance|治理/i })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: /Governance|治理/i })).toBeVisible();
    await expect(page.getByRole("note").filter({ hasText: GOV_TARGET_NOTICE }).first()).toBeVisible();
  });

  /** 07 §5.0：向导工作台（与 GET /me/stats guide 分支衔接；须已登录向导，否则 /guide 会重定向登录） */
  test("向导工作台可访问", async ({ page, request }) => {
    test.setTimeout(120_000);
    const apiBase = defaultApiBase();
    const health = await request.get(`${apiBase}/health`).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可达，跳过向导台：${apiBase}/health`);
      return;
    }
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "guide@test.com", "Test123!");
    if (!creds?.token) {
      test.skip(true, "guide@test 登录无 token（需 SEED_TEST_ACCOUNTS 与 API）");
      return;
    }
    await gotoWithBearerSession(page, "/guide", creds);
    await page.waitForURL("**/guide", { timeout: 60_000 });
    await expect(page.locator("body")).toBeVisible();
    const guideMain = page.getByRole("main", { name: /Guide workspace|向导工作台/i });
    await expect(guideMain).toBeVisible({ timeout: 60_000 });
    await expect(
      guideMain.locator("header").first().getByRole("heading", { level: 1, name: /Guide workspace|向导工作台/i }),
    ).toBeVisible({ timeout: 60_000 });
  });

  /** 07 §5.2 / 80：自定义行程入口骨架 */
  test("行程生成页可访问", async ({ page }) => {
    await page.goto("/itinerary/new");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("main", { name: /Generate itinerary|行程生成/i })).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Generate itinerary|行程生成/i }),
    ).toBeVisible();
  });
});
