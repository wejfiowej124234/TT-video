/**
 * D7 · G4 · `/market?guide_id=` 打开 CustomItinerary 暖金 dialog smoke（①）
 */
import { test, expect } from "@playwright/test";

import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { gotoSmoke } from "./helpers/smoke-nav";

test.describe("PI-1 · site theme V1 market modals (D7)", () => {
  test("CustomItinerary dialog visible from guide_id deep link", async ({ page, request }) => {
    await skipIfApiDown(request);
    await gotoSmoke(page, "/market?guide_id=g-demo-1");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 45_000 });
    const dialog = page.getByRole("dialog").first();
    await expect(dialog).toBeVisible({ timeout: 30_000 });
    const payOrTitle = dialog.locator("h2, h3").first();
    await expect(payOrTitle).toBeVisible();
  });
});
