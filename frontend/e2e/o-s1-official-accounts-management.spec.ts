import { test, expect } from "@playwright/test";

test.describe("O-S1 official accounts management pages", () => {
  test("official hub and accounts render shell", async ({ page }) => {
    const hubRes = await page.goto("/admin/official");
    expect(hubRes?.status()).toBeLessThan(400);
    await expect(page.locator("[data-tt-admin-official-hub]")).toBeVisible({ timeout: 15000 });

    const accRes = await page.goto("/admin/official/accounts");
    expect(accRes?.status()).toBeLessThan(400);
    await expect(page.locator("[data-tt-admin-official-accounts-list]")).toBeVisible({
      timeout: 15000,
    });
  });
});
