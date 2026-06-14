import { test, expect } from "@playwright/test";

test.describe("C-S1 admin content CRUD pages", () => {
  test("content sub-routes render shell", async ({ page }) => {
    for (const path of [
      "/admin/content/countries",
      "/admin/content/publish-queue",
    ]) {
      const res = await page.goto(path);
      expect(res?.status()).toBeLessThan(400);
      await expect(page.locator("[data-tt-admin-content-countries-list], [data-tt-admin-content-publish-queue]")).toBeVisible({
        timeout: 15000,
      });
    }
  });
});
