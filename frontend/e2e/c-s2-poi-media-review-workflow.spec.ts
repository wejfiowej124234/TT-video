import { test, expect } from "@playwright/test";

test.describe("C-S2 admin POI media review pages", () => {
  test("poi-images list and batch route shells render", async ({ page }) => {
    const listRes = await page.goto("/admin/content/poi-images");
    expect(listRes?.status()).toBeLessThan(400);
    await expect(page.locator("[data-tt-admin-content-poi-images-list]")).toBeVisible({
      timeout: 15000,
    });

    const batchRes = await page.goto("/admin/content/poi-images/batches/00000000-0000-0000-0000-000000000001");
    expect(batchRes?.status()).toBeLessThan(400);
    await expect(page.locator("[data-tt-admin-content-poi-image-batch]")).toBeVisible({
      timeout: 15000,
    });
  });
});
