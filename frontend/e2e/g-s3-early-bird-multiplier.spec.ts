/**
 * G-S3 · Early Bird admin Playwright evidence
 */
import { test, expect } from "@playwright/test";
import { addSmokeAdminCookies, gotoSmoke } from "./helpers/smoke-nav";

test.describe("G-S3 Early Bird admin", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await addSmokeAdminCookies(page, baseURL);
  });

  test("admin growth early-bird shell reachable", async ({ page }) => {
    await gotoSmoke(page, "/admin/growth/early-bird");
    await expect(page.getByRole("heading", { level: 1, name: /Early Bird|早鸟计划/i })).toBeVisible({
      timeout: 40_000,
    });
    await expect(page.locator('[data-tt-admin-growth-early-bird-list="1"], [data-tt-admin-growth-early-bird-empty="1"]')).toBeVisible();
  });
});
