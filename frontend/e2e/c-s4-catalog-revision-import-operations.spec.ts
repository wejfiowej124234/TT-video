import { test, expect } from "@playwright/test";

test.describe("C-S4 catalog revision import operations pages", () => {
  test("revision/import/dashboard sub-routes render shell", async ({ page }) => {
    for (const [path, selector] of [
      ["/admin/content/revisions", "[data-tt-admin-content-revisions-list]"],
      ["/admin/content/revisions/compare", "[data-tt-admin-content-revision-compare]"],
      ["/admin/content/import-operations", "[data-tt-admin-content-import-operations]"],
      ["/admin/content/catalog-dashboard", "[data-tt-admin-content-catalog-dashboard]"],
    ] as const) {
      const res = await page.goto(path);
      expect(res?.status()).toBeLessThan(400);
      await expect(page.locator(selector)).toBeVisible({ timeout: 15000 });
    }
  });
});
