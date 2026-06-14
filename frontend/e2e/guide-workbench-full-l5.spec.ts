/**
 * ① Guide Workbench L5 Full · 全页探针走廊（guide@test.com）
 * 市场曝光 · 准入进度 / 统计预告 探针存在性
 */
import { test, expect } from "@playwright/test";

import { seedTestAccountsAndReleaseGuideSlot } from "./helpers/apiSession";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

test.describe("Guide workbench full L5 probes (① local)", () => {
  test("guide /guide exposes full-page L5 sections", async ({ page, request }) => {
    test.setTimeout(180_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }

    await seedTestAccountsAndReleaseGuideSlot(request, API_BASE);

    await page.goto("/auth/login?returnUrl=%2Fguide", { timeout: 60_000 });
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("guide@test.com");
    await page.getByRole("textbox", { name: /password|密码/i }).fill("password123");
    await page.getByRole("button", { name: /sign in|登录/i }).click();
    await page.waitForURL(/\/guide/, { timeout: 60_000 });

    const shell = page.locator('[data-tt-guide-workspace-page="1"]');
    await expect(shell).toBeVisible({ timeout: 30_000 });
    await expect(shell).toHaveAttribute("data-tt-ui-frozen", "guide-workbench-l5-20260612");

    await expect(page.locator('[data-tt-guide-workbench-inbox="1"]')).toBeVisible();

    const stakingGate = page.locator('[data-tt-guide-workbench-staking-gate="1"]');
    const marketExposure = page.locator('[data-tt-guide-workbench-market-exposure="1"]');
    const gateCount = await stakingGate.count();
    const marketCount = await marketExposure.count();

    if (gateCount > 0) {
      await expect(stakingGate).toBeVisible();
      expect(marketCount).toBe(0);
      await expect(page.locator('[data-tt-guide-workbench-market-exposure-collapsed="1"]')).toBeVisible();
    } else {
      await expect(marketExposure).toBeVisible();
      await expect(page.locator('[data-tt-guide-workbench-profile-summary="1"]')).toBeVisible();
      const availability = page.locator('[data-tt-guide-workbench-availability="1"]');
      const availCount = await availability.count();
      if (availCount > 0) {
        await expect(availability).toBeVisible();
      }
    }

    const statsTeaser = page.locator('[data-tt-guide-workbench-stats-teaser="1"]');
    const teaserCount = await statsTeaser.count();
    if (teaserCount > 0) {
      await expect(statsTeaser).toBeVisible();
    }
  });
});
