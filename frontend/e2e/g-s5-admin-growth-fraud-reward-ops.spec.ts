/**
 * G-S5 · Admin anti-fraud & reward ops Playwright evidence
 */
import { test, expect } from "@playwright/test";
import { addSmokeAdminCookies, gotoSmoke } from "./helpers/smoke-nav";

test.describe("G-S5 Admin growth fraud & reward ops", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await addSmokeAdminCookies(page, baseURL);
  });

  test("admin growth anti-fraud shell reachable", async ({ page }) => {
    await gotoSmoke(page, "/admin/growth/anti-fraud");
    await expect(page.getByRole("heading", { level: 1, name: /Growth anti-fraud|增长风控中心/i })).toBeVisible({
      timeout: 40_000,
    });
    await expect(page.locator('[data-tt-admin-growth-anti-fraud-rules="1"]')).toBeVisible();
  });

  test("admin reward-ledger has drift and fraud filters", async ({ page }) => {
    await gotoSmoke(page, "/admin/growth/reward-ledger");
    await expect(page.locator('[data-tt-admin-growth-reward-ledger-filters="1"]')).toBeVisible({
      timeout: 40_000,
    });
  });
});
