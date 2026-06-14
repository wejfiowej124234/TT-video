import { test, expect } from "@playwright/test";

test.describe("C-S3 catalog operations admin pages", () => {
  test("operations sub-routes render shell", async ({ page }) => {
    for (const [path, selector] of [
      ["/admin/content/hotel-tiers", "[data-tt-admin-content-hotel-tiers-list]"],
      ["/admin/content/transport-region-rules", "[data-tt-admin-content-transport-rules-list]"],
      ["/admin/content/media-assets", "[data-tt-admin-content-media-assets-list]"],
      ["/admin/content/landing-ambient", "[data-tt-admin-content-landing-ambient-list]"],
    ] as const) {
      const res = await page.goto(path);
      expect(res?.status()).toBeLessThan(400);
      await expect(page.locator(selector)).toBeVisible({ timeout: 15000 });
    }
  });
});
