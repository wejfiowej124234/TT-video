/**
 * G-S4 · User Referral Center Playwright evidence
 */
import { test, expect } from "@playwright/test";
import { addSmokeAdminCookies, gotoSmoke } from "./helpers/smoke-nav";

test.describe("G-S4 User referral center", () => {
  test("me referrals shell reachable when logged in", async ({ page, baseURL }) => {
    await addSmokeAdminCookies(page, baseURL);
    await gotoSmoke(page, "/me/referrals");
    await expect(page.getByRole("heading", { level: 1, name: /My referrals|我的推荐/i })).toBeVisible({
      timeout: 40_000,
    });
    await expect(
      page.locator(
        '[data-tt-me-referrals-content="1"], [data-tt-me-referrals-loading="1"]',
      ),
    ).toBeVisible();
  });
});
