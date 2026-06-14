/**
 * ① 本地 · itinerary-date-as-source 主链浏览器验收
 * 首页行程（带日期）→ 市场 bind 过滤 → 查看向导 → 日期自动带入 → 一键预约 → Escrow 待接单
 */
import { test, expect, type Page } from "@playwright/test";

import {
  bindGuideFromBookGuideModal,
  seedPublishedOpenItineraryOrder,
} from "./helpers/bookGuideItineraryFirst";
import {
  assertGuideItineraryTripAutoSelected,
  assertMarketBindTripLabelVisible,
  openFirstGuideDrawerFromMarket,
} from "./helpers/itineraryDateAsSourceCorridor";
import {
  mountLandingPreviewOrderOnPage,
  registerFreshTouristForCorridor,
} from "./helpers/landingItineraryApiSeed";
import { releaseSeedGuideSlotIfBlocked } from "./helpers/releaseSeedGuideSlot";
import { releasePublicCatalogHangzhouGuideSlotIfBlocked } from "./helpers/publicCatalogHangzhouGuide";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

const selectGuideRe = /请选择向导|Select guide/i;
const bindSelectBtnRe = /^(选择此向导|Select this guide)( — | —|$)/;
const waitingAcceptRe = /等待向导接单|waiting for.*accept|已选择向导.*等待向导接单/i;

async function gotoLoginWhenReady(page: Page, loginHref: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto(loginHref, { timeout: 60_000 });
    const emailBox = page.getByRole("textbox", { name: /email|邮箱/i });
    try {
      await emailBox.waitFor({ state: "visible", timeout: 20_000 });
      return;
    } catch {
      if (attempt === 2) throw new Error("login page did not become ready");
    }
  }
}

async function loginTourist(page: Page, email: string, returnPath: string): Promise<void> {
  await gotoLoginWhenReady(page, `/auth/login?returnUrl=${encodeURIComponent(returnPath)}`);
  await page.getByRole("textbox", { name: /email|邮箱/i }).fill(email);
  await page.getByLabel(/password|密码/i).fill("Test123!");
  await page.getByRole("button", { name: /Log in|登录/i }).click();
  await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
    timeout: 30_000,
  });
}

async function clickFirstBindableGuide(page: Page): Promise<void> {
  const bindBtn = page.getByRole("button", { name: bindSelectBtnRe }).first();
  await expect(bindBtn).toBeVisible({ timeout: 90_000 });
  await bindBtn.scrollIntoViewIfNeeded();
  await bindBtn.click({ timeout: 20_000 });
}

test.describe("itinerary-date-as-source corridor (① local)", () => {
  test("landing行程 → market过滤+出行横幅 → 向导详情日期自动带入 → 预约 → Escrow待接单", async ({
    page,
    request,
  }) => {
    test.setTimeout(420_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }

    await request
      .post(`${API_BASE}/auth/seed-test-accounts`, {
        headers: { "Content-Type": "application/json" },
        data: "{}",
      })
      .catch(() => null);
    await releaseSeedGuideSlotIfBlocked(request, API_BASE);
    await releasePublicCatalogHangzhouGuideSlotIfBlocked(request, API_BASE);

    const creds = await registerFreshTouristForCorridor(request, API_BASE);
    const orderId = await seedPublishedOpenItineraryOrder(request, API_BASE, creds.token);

    const getRes = await request.get(`${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${creds.token}` },
    });
    expect(getRes.ok(), await getRes.text()).toBeTruthy();
    const orderBody = (await getRes.json()) as {
      order?: { travel_date?: string; days?: number; guide_id?: string | null };
    };
    expect(orderBody.order?.travel_date).toBeTruthy();

    const escrowPath = `/escrow/${encodeURIComponent(orderId)}`;
    await loginTourist(page, creds.email ?? "", escrowPath);
    await expect(page).toHaveURL(new RegExp(`/escrow/${orderId}`), { timeout: 30_000 });
    await expect(page.getByText(selectGuideRe).first()).toBeVisible({ timeout: 60_000 });

    await mountLandingPreviewOrderOnPage(page, orderId);

    const marketLink = page
      .getByRole("link", { name: /前往自由市场选向导|请选择向导|Go to.*market.*guide/i })
      .first();
    await expect(marketLink).toBeVisible({ timeout: 30_000 });
    await marketLink.click();

    await expect(page).toHaveURL(new RegExp(`bindGuideToOrder=${orderId}`), { timeout: 60_000 });
    await expect(page).toHaveURL(/view=guides/, { timeout: 15_000 });
    await assertMarketBindTripLabelVisible(page);

    const guideId = await openFirstGuideDrawerFromMarket(page);

    const drawer = page.getByRole("dialog", { name: /Guide details|向导详情/i });
    const viewPageLink = drawer.getByRole("link", { name: /View guide page|查看向导页/i });
    await expect(viewPageLink).toHaveAttribute(
      "href",
      new RegExp(`bindGuideToOrder=${orderId}`),
    );
    await viewPageLink.click();

    await expect(page).toHaveURL(
      new RegExp(`/guides/${guideId}.*bindGuideToOrder=${orderId}`),
      { timeout: 30_000 },
    );
    await assertGuideItineraryTripAutoSelected(page);

    await page.locator('[data-tt-guide-detail-book-cta="1"]').click({ timeout: 20_000 });
    await bindGuideFromBookGuideModal(page);

    await expect(page).toHaveURL(new RegExp(`/escrow/${orderId}`), { timeout: 30_000 });
    await expect(page.getByText(waitingAcceptRe).first()).toBeVisible({ timeout: 60_000 });
  });

  test("market bind 深链：选择向导 → 预约 → Escrow待接单（日期来自行程）", async ({
    page,
    request,
  }) => {
    test.setTimeout(360_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }

    await request
      .post(`${API_BASE}/auth/seed-test-accounts`, {
        headers: { "Content-Type": "application/json" },
        data: "{}",
      })
      .catch(() => null);
    await releaseSeedGuideSlotIfBlocked(request, API_BASE);
    await releasePublicCatalogHangzhouGuideSlotIfBlocked(request, API_BASE);

    const creds = await registerFreshTouristForCorridor(request, API_BASE);
    const orderId = await seedPublishedOpenItineraryOrder(request, API_BASE, creds.token);

    const marketPath = `/market?view=guides&bindGuideToOrder=${encodeURIComponent(orderId)}`;
    await loginTourist(page, creds.email ?? "", marketPath);
    await expect(page).toHaveURL(new RegExp(`bindGuideToOrder=${orderId}`), { timeout: 30_000 });
    await assertMarketBindTripLabelVisible(page);
    await clickFirstBindableGuide(page);
    await bindGuideFromBookGuideModal(page);
    await expect(page).toHaveURL(new RegExp(`/escrow/${orderId}`), { timeout: 30_000 });
    await expect(page.getByText(waitingAcceptRe).first()).toBeVisible({ timeout: 60_000 });
  });
});
