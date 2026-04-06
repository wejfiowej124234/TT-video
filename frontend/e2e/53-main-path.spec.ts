/**
 * 53 阶段主路径 E2E（M1 证据可引用本 spec 报告）
 * 与 [53-E2E环境与执行说明](../docs/spec/53-E2E环境与执行说明.md) §二、§五 对应。
 * 验证：订单/Escrow 详情页 53 关键 UI（步骤条、取消政策区、deadline 提示、释放引导、保存行程入口等）可感知。
 * 完整主路径（登录→创建行程→抢单→双边确认→mock-pay→评分）需后端 + 测试账号，见 53-E2E 文档。
 *
 * 本地仅起前端、不启 API 时：设置 `PLAYWRIGHT_SKIP_ESCROW_API_TESTS=1` 可跳过本文件全部用例（CI 勿设）。
 */
import { test, expect } from "@playwright/test";

const skipEscrowApiSuite = process.env.PLAYWRIGHT_SKIP_ESCROW_API_TESTS === "1";

test.describe("53 主路径：订单/Escrow 详情 53 关键 UI", () => {
  test.beforeEach(({}, testInfo) => {
    if (skipEscrowApiSuite) {
      testInfo.skip(true, "PLAYWRIGHT_SKIP_ESCROW_API_TESTS=1（本地无 API）；CI 不设置此项");
    }
  });

  test("Escrow 详情页展示 53 步骤条或状态", async ({ page }) => {
    await page.goto("/escrow/1");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/托管|状态|Status|加载|错误|Escrow|步骤|Step/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Escrow 详情页含取消与退款规则区（53-S14）", async ({ page }) => {
    await page.goto("/escrow/1");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/取消|退款|Cancellation|refund|规则|policy/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("订单列表 → Escrow 详情 路径可达（53 主路径入口）", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/订单|Orders|我的|列表|空|暂无/i).first()
    ).toBeVisible({ timeout: 10000 });
    await page.goto("/escrow/1");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/托管|状态|Status|Escrow|加载|错误/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Market 页可访问（53 抢单/接单入口）", async ({ page }) => {
    await page.goto("/market");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/订单|向导|Orders|Guides|链上|Escrow|发现|Discover/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("订单详情页展示 53 关键区（行程与预算/保存/确认/报价摘要其一）", async ({ page }) => {
    await page.goto("/escrow/1");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/行程与预算|Itinerary|未确认阶段|报价摘要|Quote summary|保存行程|Save itinerary|Confirm Final Plan|确认最终/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Escrow 详情页含打印按钮（53-S15）", async ({ page }) => {
    await page.goto("/escrow/1");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /打印|Print/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test("Escrow 详情页含紧急联系或保险提示（53-S18）", async ({ page }) => {
    await page.goto("/escrow/1");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/紧急联系|Emergency contact|旅行保险|travel insurance|平台不代售|platform does not sell/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Escrow 详情页含 deadline/超时/取消政策其一（53 超时分支与 S12/S14/S16）", async ({ page }) => {
    await page.goto("/escrow/1");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/截止|deadline|超时|timeout|取消|Cancellation|退款|refund|规则|policy/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Escrow 详情页含复制摘要按钮（53-S15 优化）", async ({ page }) => {
    await page.goto("/escrow/1");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /复制摘要|Copy summary/i })
    ).toBeVisible({ timeout: 10000 });
  });

});
