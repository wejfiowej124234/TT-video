/**
 * §3.2.9 G5 · did-rank 榜内弹窗开 1 次（① · 暖金壳目视旁证）
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { test, expect } from "@playwright/test";

import { gotoSmoke } from "./helpers/smoke-nav";

const OUT_DIR = join(process.cwd(), "evidence", "GO_local_site_theme_v1", "G5-did-rank-guide-modal");

const MOCK_GUIDE = {
  id: "00000000-0000-4000-8000-000000000099",
  rank: 1,
  nickname: "Theme V1 Guide",
  totalAmountUsdt: 1200,
  receptionCount: 8,
  avgReceivedReviewScore: 4.6,
  city: "Tokyo",
};

test.describe("Site theme V1 · did-rank guide modal (G5)", () => {
  test.beforeAll(() => {
    mkdirSync(OUT_DIR, { recursive: true });
  });

  test("guide board opens DidRankGuideModal (warm shell)", async ({ page }) => {
    test.setTimeout(90_000);

    await page.route("**/api/v1/did-rank/guides**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "ok",
          period: "all",
          since: null,
          limit: 30,
          rank_basis: "e2e-mock",
          guides: [MOCK_GUIDE],
        }),
      });
    });

    await gotoSmoke(page, "/did-rank?period=all&board=guide");
    await expect(page.getByRole("main", { name: /Ranking|排行榜/i })).toBeVisible({ timeout: 45_000 });
    await expect(page.locator("#did-rank-board-panel-guide")).toBeVisible({ timeout: 45_000 });

    const openGuide = page
      .locator("#did-rank-board-panel-guide")
      .getByRole("button", { name: /View guide|查看向导/i })
      .first();
    await expect(openGuide).toBeVisible({ timeout: 30_000 });
    await openGuide.click();

    const dialog = page.getByRole("dialog", { name: /Guide details|向导详情/i });
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await expect(dialog).toHaveAttribute("aria-modal", "true");

    await page.waitForTimeout(400);
    await page.screenshot({
      path: join(OUT_DIR, "guide-modal-desktop-1280x800.png"),
      fullPage: false,
    });
  });
});
