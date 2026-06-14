/**
 * G-S6 · Airdrop snapshot Playwright evidence
 */
import { test, expect } from "@playwright/test";
import { addSmokeAdminCookies, gotoSmoke } from "./helpers/smoke-nav";

test.describe("G-S6 Airdrop campaigns admin", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await addSmokeAdminCookies(page, baseURL);
  });

  test("admin growth airdrop-campaigns shell reachable", async ({ page }) => {
    await gotoSmoke(page, "/admin/growth/airdrop-campaigns");
    await expect(
      page.getByRole("heading", { level: 1, name: /Airdrop campaigns|空投活动/i }),
    ).toBeVisible({ timeout: 40_000 });
    await expect(page.locator('[data-tt-admin-growth-airdrop-create="1"]')).toBeVisible();
  });
});
