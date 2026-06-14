/**
 * G-S7 · Growth analytics & KOL read-only Playwright evidence
 */
import { test, expect } from "@playwright/test";
import { addSmokeAdminCookies, gotoSmoke } from "./helpers/smoke-nav";

test.describe("G-S7 Growth analytics admin", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await addSmokeAdminCookies(page, baseURL);
  });

  test("admin growth analytics shell reachable", async ({ page }) => {
    await gotoSmoke(page, "/admin/growth/analytics");
    await expect(
      page.getByRole("heading", { level: 1, name: /Growth analytics|增长分析/i }),
    ).toBeVisible({ timeout: 40_000 });
    await expect(page.locator('[data-tt-admin-growth-analytics-window="1"]')).toBeVisible();
  });
});

test.describe("G-S7 KOL center admin", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await addSmokeAdminCookies(page, baseURL);
  });

  test("admin growth kol-center shell reachable", async ({ page }) => {
    await gotoSmoke(page, "/admin/growth/kol-center");
    await expect(
      page.getByRole("heading", { level: 1, name: /KOL center|KOL 中心/i }),
    ).toBeVisible({ timeout: 40_000 });
    await expect(page.locator('[data-tt-admin-growth-kol-window="1"]')).toBeVisible();
  });
});
