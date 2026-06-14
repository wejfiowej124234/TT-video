/**
 * ① Steward Workbench L5 Full · 全页探针走廊（multi-demo@test.com · need_stake 态）
 */
import { test, expect } from "@playwright/test";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

test.describe("Steward workbench full L5 probes (① local)", () => {
  test("multi-demo /governance?view=region exposes frozen L5 sections", async ({ page, request }) => {
    test.setTimeout(180_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }

    await request.post(`${API_BASE}/auth/seed-test-accounts`, {
      data: {},
      headers: { "Content-Type": "application/json" },
    });

    await page.goto("/auth/login?returnUrl=%2Fgovernance%3Fview%3Dregion", { timeout: 60_000 });
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("multi-demo@test.com");
    await page.getByRole("textbox", { name: /password|密码/i }).fill("Test123!");
    await page.getByRole("button", { name: /sign in|登录/i }).click();
    await page.waitForURL(/\/governance\?view=region/, { timeout: 60_000 });

    const shell = page.locator('[data-tt-steward-workspace-page="1"]');
    await expect(shell).toBeVisible({ timeout: 30_000 });
    await expect(shell).toHaveAttribute("data-tt-ui-frozen", "steward-workbench-l5-20260612");

    await expect(page.locator('[data-tt-steward-workbench-todo="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-steward-todo-proposals="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-steward-todo-create-proposal="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-steward-workbench-l5-cross-nav="1"]')).toBeVisible();

    const gate = page.locator('[data-tt-steward-workbench-staking-gate="1"]');
    const satisfied = page.locator('[data-tt-steward-workbench-staking-status="satisfied"]');
    expect((await gate.count()) + (await satisfied.count())).toBeGreaterThan(0);

    const stakeManage = page.locator('[data-tt-steward-ttg-stake-manage="1"]');
    await expect(stakeManage).toBeVisible();
  });
});
