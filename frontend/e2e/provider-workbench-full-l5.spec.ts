/**
 * ① Provider Workbench L5 Full · 全页探针走廊（merchant@test.com）
 */
import { test, expect } from "@playwright/test";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

test.describe("Provider workbench full L5 probes (① local)", () => {
  test("merchant /provider exposes full-page L5 sections", async ({ page, request }) => {
    test.setTimeout(180_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }

    await request.post(`${API_BASE}/auth/seed-test-accounts`, {
      data: {},
      headers: { "Content-Type": "application/json" },
    });

    await page.goto("/auth/login?returnUrl=%2Fprovider", { timeout: 60_000 });
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("merchant@test.com");
    await page.getByRole("textbox", { name: /password|密码/i }).fill("Test123!");
    await page.getByRole("button", { name: /sign in|登录/i }).click();
    await page.waitForURL(/\/provider/, { timeout: 60_000 });

    const shell = page.locator('[data-tt-provider-workspace-page="1"]');
    await expect(shell).toBeVisible({ timeout: 30_000 });
    await expect(shell).toHaveAttribute("data-tt-ui-frozen", "provider-workbench-l5-20260612");

    await expect(page.locator('[data-tt-provider-workbench-inbox="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-provider-workbench-market-exposure="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-provider-workbench-profile-summary="1"]')).toBeVisible();

    const statsTeaser = page.locator('[data-tt-provider-workbench-stats-teaser="1"]');
    const statsCard = page.locator('[data-tt-provider-workbench-stats="1"]');
    expect((await statsTeaser.count()) + (await statsCard.count())).toBeGreaterThan(0);
  });
});
