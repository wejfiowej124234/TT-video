import { test, expect } from "@playwright/test";

test.describe("O-S3 official itinerary templates pages", () => {
  test("official hub and itinerary-templates render shell", async ({ page }) => {
    const hubRes = await page.goto("/admin/official");
    expect(hubRes?.status()).toBeLessThan(400);
    await expect(page.locator("[data-tt-admin-official-hub]")).toBeVisible({ timeout: 15000 });

    const tplRes = await page.goto("/admin/official/itinerary-templates");
    expect(tplRes?.status()).toBeLessThan(400);
    await expect(page.locator("[data-tt-admin-official-templates-list]")).toBeVisible({
      timeout: 15000,
    });
  });
});
