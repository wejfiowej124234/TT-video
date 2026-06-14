import { test, expect } from "@playwright/test";

test.describe("C-S5 catalog server geo validation operations pages", () => {
  test("geo validation and catalog dashboard geo section render", async ({ page }) => {
    const geoRes = await page.goto("/admin/content/geo-validation");
    expect(geoRes?.status()).toBeLessThan(400);
    await expect(page.locator("[data-tt-admin-content-geo-validation]")).toBeVisible({
      timeout: 15000,
    });

    await page.goto("/admin/content/catalog-dashboard");
    await expect(page.locator("[data-tt-admin-content-catalog-dashboard]")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator("[data-tt-admin-content-catalog-geo-summary]")).toBeVisible({
      timeout: 15000,
    });
  });
});
