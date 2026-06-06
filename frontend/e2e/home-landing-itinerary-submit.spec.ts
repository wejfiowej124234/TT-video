/**
 * PH1-HOME-02 · `/` Hero 提交创建行程（①）
 * 需 API :8080（chain_off）+ Next :3012 + 种子账号 tourist@test.com
 */
import { test, expect } from "@playwright/test";

import {
  defaultApiBase,
  injectBearerSessionInPage,
  seedAndLoginTouristTestCredentials,
} from "./helpers/apiSession";
import { fillLandingHeroChinaBeijing, submitLandingHeroForm } from "./helpers/landingHomeForm";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { gotoSmoke } from "./helpers/smoke-nav";

test.describe("PI-1 · home landing itinerary submit (PH1-HOME-02)", () => {
  test("creates itinerary results after authenticated submit", async ({ page, request }) => {
    test.setTimeout(180_000);
    await skipIfApiDown(request);
    const apiBase = defaultApiBase();
    const creds = await seedAndLoginTouristTestCredentials(request, apiBase);
    if (!creds) {
      test.skip(true, "seed/login tourist@test.com failed");
      return;
    }

    await gotoSmoke(page, "/");
    await injectBearerSessionInPage(page, creds);
    await page.reload({ waitUntil: "domcontentloaded", timeout: 90_000 });
    await injectBearerSessionInPage(page, creds);
    await expect(page.locator("#landing-hero-form")).toBeVisible({ timeout: 20_000 });

    await fillLandingHeroChinaBeijing(page);
    await submitLandingHeroForm(page);

    await expect(page.locator("#itinerary-results")).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText(/已生成|Draft order|order_id|行程/i).first()).toBeVisible({
      timeout: 30_000,
    });
  });
});
