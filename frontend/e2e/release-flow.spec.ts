/**
 * 36 发版前 E2E：01 核心流程结构（下单→接单→deposit→release→Completed）页面可达性
 * 增补 07：§5.2A 治理 Target、§5.2A/81 质押、支付/托管说明、`?orderId=` 深链预填、帮助中心（08-4）；与 smoke/core-path 互补。
 * 不含真实链上操作，仅验证订单列表→订单/托管详情页可打开；完整 deposit/release 需测试网或 mock 后端。
 */
import { test, expect } from "@playwright/test";

const GOV_TARGET_NOTICE = /文档镜像|API 占位|placeholders|documentation mirrors|Protocol parameters|协议参数/i;

test.describe("01 核心流程页面结构（发版前 E2E 清单）", () => {
  test("订单列表页可访问", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/订单|Orders|我的|列表|空|暂无/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("新建订单入口可访问", async ({ page }) => {
    await page.goto("/orders/new");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/订单|Order|创建|新建|行程|Itinerary/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Market → Escrow 路径可走通", async ({ page }) => {
    await page.goto("/market");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/订单|向导|链上|Escrow/i).first()).toBeVisible({ timeout: 10000 });
    await page.goto("/escrow/1");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/托管|状态|Status|加载|错误|Escrow/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("完整导航链：Landing → Market → Orders → Escrow", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/", { timeout: 60_000 });
    await expect(page.locator("body")).toBeVisible();
    await page.goto("/market", { timeout: 60_000 });
    await expect(page.getByText(/订单|向导|Escrow/i).first()).toBeVisible({ timeout: 30_000 });
    await page.goto("/orders", { timeout: 60_000 });
    await expect(page.getByText(/订单|Orders|我的|列表/i).first()).toBeVisible({ timeout: 30_000 });
    await page.goto("/escrow/1", { timeout: 60_000 });
    await expect(
      page.getByText(/托管|状态|Status|加载|错误|Escrow/i).first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("支付与托管说明页可访问", async ({ page }) => {
    await page.goto("/pay");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("main", { name: /Pay & escrow|支付与托管/i })).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("heading", { level: 1, name: /Pay & escrow|支付与托管/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("支付页 orderId 查询预填输入框（订单→支付深链）", async ({ page }) => {
    const oid = "00000000-0000-4000-8000-000000000001";
    await page.goto(`/pay?orderId=${encodeURIComponent(oid)}`);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("main", { name: /Pay & escrow|支付与托管/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel(/order id|订单 ID|Order ID/i)).toHaveValue(oid);
  });

  test("治理费用路由页可访问（含 Target 披露）", async ({ page }) => {
    await page.goto("/governance/fee-routes");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("main", { name: /Fee routes|费用路由/i })).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("heading", { level: 1, name: /Fee routes|费用路由/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("note").filter({ hasText: GOV_TARGET_NOTICE }).first()).toBeVisible();
  });

  test("治理国家桶转出页可访问（vault-forwards · 含 Target 披露）", async ({ page }) => {
    await page.goto("/governance/vault-forwards");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("main", { name: /Vault forwards|国家桶转出/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("heading", { level: 1, name: /Vault forwards|国家桶转出/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("note").filter({ hasText: GOV_TARGET_NOTICE }).first()).toBeVisible();
  });

  test("帮助中心可访问", async ({ page }) => {
    await page.goto("/help");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("main", { name: /Help|帮助中心/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /Help|帮助中心/i })).toBeVisible({ timeout: 15_000 });
  });

  test("向导质押页可访问", async ({ page }) => {
    await page.goto("/staking");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("main", { name: /Guide staking|向导质押/i })).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("heading", { level: 1, name: /Guide staking|向导质押/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("TravelTrust 网络落地页可访问", async ({ page }) => {
    await page.goto("/traveltrust");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("main", { name: /TravelTrust Network|TravelTrust 网络/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", { level: 1, name: /TravelTrust Network|TravelTrust 网络/i }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
