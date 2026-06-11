/**
 * ① 本地 · Web3 创新行程走廊「10 分」浏览器验收
 * Hero 表单可填 → API 预置预览卡 → 解锁 → Escrow 保存发布 → Market bind 深链
 *
 * 需 API :8080 + Next :3012（`npm run e2e:web3-itinerary-10` 默认 full-stack）
 */
import { test, expect } from "@playwright/test";

import {
  defaultApiBase,
  gotoWithBearerSession,
  injectBearerSessionInPage,
} from "./helpers/apiSession";
import { saveEscrowItineraryPublish } from "./helpers/escrowDraftCorridor";
import {
  mountLandingPreviewOrderOnPage,
  registerFreshTouristForCorridor,
  seedLandingPreviewOrderViaApi,
} from "./helpers/landingItineraryApiSeed";
import {
  clearLandingItinerarySession,
  fillLandingHeroBudget,
  fillLandingHeroChinaBeijing,
} from "./helpers/landingHomeForm";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { gotoSmoke } from "./helpers/smoke-nav";

test.describe("Web3 itinerary corridor 10 (① local browser)", () => {
  test("landing unlock → escrow save publish → market bind deep link", async ({ page, request }) => {
    test.setTimeout(300_000);
    await skipIfApiDown(request);
    const apiBase = defaultApiBase();
    const creds = await registerFreshTouristForCorridor(request, apiBase);

    await gotoSmoke(page, "/");
    await injectBearerSessionInPage(page, creds);
    await clearLandingItinerarySession(page);
    await page.reload({ waitUntil: "domcontentloaded", timeout: 90_000 });
    await injectBearerSessionInPage(page, creds);
    await clearLandingItinerarySession(page);
    await expect(page.locator("#landing-hero-form")).toBeVisible({ timeout: 20_000 });

    await fillLandingHeroChinaBeijing(page);
    await fillLandingHeroBudget(page, "3700");

    const orderId = await seedLandingPreviewOrderViaApi(request, apiBase, creds.token);
    await mountLandingPreviewOrderOnPage(page, orderId);
    await page.reload({ waitUntil: "domcontentloaded", timeout: 90_000 });
    await injectBearerSessionInPage(page, creds);

    const unlockBtn = page.getByRole("button", { name: /查看完整行程|View full itinerary/i }).first();
    const orderDetailLink = page.getByRole("link", { name: /查看订单详情|View order detail/i }).first();
    await expect(unlockBtn.or(orderDetailLink)).toBeVisible({ timeout: 60_000 });
    if (await unlockBtn.isVisible().catch(() => false)) {
      await unlockBtn.scrollIntoViewIfNeeded();
      await unlockBtn.click();
      const modal = page.getByTestId("unlock-modal");
      await expect(modal).toBeVisible({ timeout: 15_000 });
      await modal.getByRole("button", { name: /查看行程|View itinerary/i }).click();
      await expect(orderDetailLink).toBeVisible({ timeout: 90_000 });
    } else {
      await expect(orderDetailLink).toBeVisible({ timeout: 90_000 });
    }

    const orderHref = await orderDetailLink.getAttribute("href");
    expect(orderHref).toMatch(/\/escrow\//);
    await gotoWithBearerSession(page, orderHref!, creds);

    await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
      timeout: 90_000,
    });

    await saveEscrowItineraryPublish(page);

    await expect(page.getByText(/已发布到自由市场|Published to the free market/i).first()).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("link", { name: /前往自由市场选向导|Go to.*market.*guide/i }).first().click();

    await expect(page).toHaveURL(/bindGuideToOrder=/, { timeout: 60_000 });
    await expect(page).toHaveURL(/view=guides/, { timeout: 10_000 });
    await expect(
      page.getByText(/正在为当前草稿订单选择向导|Selecting a guide for this draft order/i).first(),
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("main", { name: /Market|自由市场/i })).toBeVisible({ timeout: 60_000 });
  });
});
