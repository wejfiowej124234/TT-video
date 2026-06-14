import { test, expect } from "@playwright/test";

test.describe("Sprint 168-B country-market admin", () => {
  test("country-market page loads", async ({ page }) => {
    const res = await page.goto("/admin/content/country-market");
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator('[data-tt-admin-country-market-launches="1"]')).toBeVisible();
  });
});
