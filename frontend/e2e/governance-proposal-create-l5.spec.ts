/**
 * ① · 治理议题创建页 L5（/governance/proposals/new · wizard · steward 回程）
 */
import { test, expect } from "@playwright/test";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

test.describe("governance proposal create L5 (① local)", () => {
  test("发起页 shell · 向导步骤 · from=steward_workbench 回程", async ({ page, request }) => {
    test.setTimeout(120_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }

    await request
      .post(`${API_BASE}/auth/seed-test-accounts`, {
        headers: { "Content-Type": "application/json" },
        data: "{}",
      })
      .catch(() => null);

    await page.goto(
      "/auth/login?returnUrl=" + encodeURIComponent("/governance/proposals/new?from=steward_workbench"),
    );
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("multi-demo@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await page.waitForURL(/\/governance\/proposals\/new/, { timeout: 60_000 });

    await expect(page.locator('[data-tt-governance-proposal-create-page="1"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { level: 1, name: /Create governance proposal|发起治理提案/i })).toBeVisible();
    await expect(page.locator('[data-tt-steward-subpage-back-workbench="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-governance-proposals-list-back="1"]')).toBeVisible();

    const steps = page.locator("ol").first().getByRole("listitem");
    await expect(steps).toHaveCount(5);

    await expect(page.locator('[data-tt-governance-wallet-connect-panel="1"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /Platform parameters|平台参数/i }).first()).toBeVisible();
  });
});
