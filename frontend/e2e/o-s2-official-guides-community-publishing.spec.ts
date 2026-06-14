import { test, expect } from "@playwright/test";

test.describe("O-S2 official guides community publishing pages", () => {
  test("official hub and guides render shell", async ({ page }) => {
    const hubRes = await page.goto("/admin/official");
    expect(hubRes?.status()).toBeLessThan(400);
    await expect(page.locator("[data-tt-admin-official-hub]")).toBeVisible({ timeout: 15000 });

    const guidesRes = await page.goto("/admin/official/guides");
    expect(guidesRes?.status()).toBeLessThan(400);
    await expect(page.locator("[data-tt-admin-official-guides-list]")).toBeVisible({
      timeout: 15000,
    });
  });
});
