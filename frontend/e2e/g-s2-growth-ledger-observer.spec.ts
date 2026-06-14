/**
 * G-S2 · Admin reward ledger Playwright evidence
 */
import { test, expect } from "@playwright/test";
import { addSmokeAdminCookies, gotoSmoke } from "./helpers/smoke-nav";

test.describe("G-S2 Growth ledger admin", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await addSmokeAdminCookies(page, baseURL);
  });

  test("admin growth reward-ledger shell reachable", async ({ page }) => {
    await gotoSmoke(page, "/admin/growth/reward-ledger");
    await expect(page.getByRole("heading", { level: 1, name: /Reward ledger|积分账本/i })).toBeVisible({
      timeout: 40_000,
    });
    await expect(page.locator('[data-tt-admin-growth-reward-ledger-filters="1"]')).toBeVisible();
  });
});
