/**
 * Theme V2（§1.7）· 硬刷新目视机采旁证（①）
 * 产出：evidence/GO_local_site_theme_v1/V2-hard-refresh-capture/*.png
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { test, expect } from "@playwright/test";

import { gotoSmoke } from "./helpers/smoke-nav";

const OUT = join(process.cwd(), "evidence", "GO_local_site_theme_v1", "V2-hard-refresh-capture");

const MOCK_GUIDE = {
  id: "00000000-0000-4000-8000-000000000099",
  rank: 1,
  nickname: "Theme V1 Guide",
  totalAmountUsdt: 1200,
  receptionCount: 8,
  avgReceivedReviewScore: 4.6,
  city: "Tokyo",
};

test.describe("Theme V2 hard-refresh capture (§1.7)", () => {
  test.beforeAll(() => {
    mkdirSync(OUT, { recursive: true });
  });

  test("capture market · did-rank · community V2 checkpoints", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.route("**/api/v1/did-rank/guides**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "ok",
          period: "all",
          guides: [MOCK_GUIDE],
        }),
      });
    });

    await gotoSmoke(page, "/market");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 60_000 });
    await page.screenshot({ path: join(OUT, "01-market-hero-hub.png") });

    await gotoSmoke(page, "/market/provider");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 45_000 });
    await page.screenshot({ path: join(OUT, "02-market-provider-title.png") });

    await gotoSmoke(page, "/market/acquisition");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 45_000 });
    await page.screenshot({ path: join(OUT, "03-market-acquisition-title.png") });

    await gotoSmoke(page, "/did-rank?period=all&board=guide");
    await expect(page.getByRole("main", { name: /Ranking|排行榜/i })).toBeVisible({ timeout: 45_000 });
    await page.screenshot({ path: join(OUT, "04-did-rank-header-tabs.png") });

    await gotoSmoke(page, "/community");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("tab", { name: /Recommend|推荐/i })).toBeVisible({ timeout: 45_000 });
    await page.screenshot({ path: join(OUT, "05-community-feed-tabs.png") });

    await gotoSmoke(page, "/community/explore");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 45_000 });
    await page.screenshot({ path: join(OUT, "06-community-explore-h1.png") });

    writeFileSync(
      join(OUT, "CAPTURE-20260524.txt"),
      [
        "phase=local-1",
        "theme=V2-action-ssot",
        "baseURL=http://127.0.0.1:3012",
        "status=captured",
        "",
        "files=01-market-hero-hub.png .. 06-community-explore-h1.png",
      ].join("\n"),
      "utf8",
    );
  });
});
