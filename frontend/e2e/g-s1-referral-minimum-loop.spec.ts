/**
 * G-S1 · Referral minimum loop Playwright evidence（124 §G1 · 101 汇合闸）
 */
import { test, expect } from "@playwright/test";
import { addSmokeAdminCookies, gotoSmoke } from "./helpers/smoke-nav";

test.describe("G-S1 Referral minimum loop", () => {
  test("register ?ref= prefill marker renders", async ({ page }) => {
    await gotoSmoke(page, "/auth/register?ref=TT-E2ETEST");
    await expect(page.locator('[data-tt-register-referral-prefill="1"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-tt-register-referral-state]')).toHaveAttribute(
      "data-tt-register-referral-state",
      /validating|valid|invalid/,
    );
  });

  test.describe("Admin referral codes page", () => {
    test.beforeEach(async ({ page, baseURL }) => {
      await addSmokeAdminCookies(page, baseURL);
    });

    test("admin growth referral-codes shell reachable", async ({ page }) => {
      await gotoSmoke(page, "/admin/growth/referral-codes");
      await expect(page.getByRole("heading", { level: 1, name: /Referral codes|推荐码管理/i })).toBeVisible({
        timeout: 40_000,
      });
      await expect(page.locator('[data-tt-admin-growth-referral-create="1"]')).toBeVisible();
    });
  });
});
