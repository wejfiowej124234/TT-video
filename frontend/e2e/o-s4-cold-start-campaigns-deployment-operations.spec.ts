import { test, expect } from "@playwright/test";

test.describe("O-S4 cold start campaigns pages", () => {
  test("official hub and cold-start render shell", async ({ page }) => {
    const hubRes = await page.goto("/admin/official");
    expect(hubRes?.status()).toBeLessThan(400);
    await expect(page.locator("[data-tt-admin-official-hub]")).toBeVisible({ timeout: 15000 });

    const csRes = await page.goto("/admin/official/cold-start");
    expect(csRes?.status()).toBeLessThan(400);
    await expect(page.locator("[data-tt-admin-official-cold-start-list]")).toBeVisible({
      timeout: 15000,
    });
  });
});
