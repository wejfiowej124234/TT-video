/**

 * B-469：`/guides/[id]` 与 **`GuideDetailDrawer`** 预约入口的浏览器 E2E；

 * GD-L5-P3：经 **`BookGuideModal`** itinerary-first 绑定向导 → **`/escrow/:id`**（非 `/orders/new` 捷径）。

 */

import { test, expect, type Page, type APIRequestContext } from "@playwright/test";

import { bindGuideFromBookGuideModal, seedPublishedOpenItineraryOrder } from "./helpers/bookGuideItineraryFirst";

import { guideRowIdForSeedGuideAccount } from "./helpers/guideSeedGuideRowId";

import { assertGuideItineraryTripAutoSelected } from "./helpers/itineraryDateAsSourceCorridor";

import { releaseSeedGuideSlotIfBlocked } from "./helpers/releaseSeedGuideSlot";



const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";

const API_HEALTH =

  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;

const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;



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



async function apiLogin(

  request: APIRequestContext,

  email: string,

  password: string,

): Promise<string> {

  const res = await request.post(`${API_BASE}/auth/login`, {

    headers: { "Content-Type": "application/json" },

    data: { email, password },

  });

  expect(res.ok(), await res.text()).toBeTruthy();

  const body = (await res.json()) as { token?: string };

  const token = body.token?.trim();

  expect(token).toBeTruthy();

  return token as string;

}



/** 市场 · Guides：打开抽屉 → 抽屉内「预约」→ `BookGuideModal` */

async function openBookModalFromGuideDrawer(page: Page, guideId: string): Promise<void> {

  await page.getByRole("tab", { name: /^Guides$|^向导$/ }).click();

  const guideCard = page.getByRole("article").filter({

    has: page.locator(`h3#guide-title-${guideId}`),

  });

  await expect(guideCard).toBeVisible({ timeout: 90_000 });



  await guideCard.getByRole("button", { name: /View guide|查看向导/i }).click({ timeout: 20_000 });



  const drawer = page.getByRole("dialog", { name: /Guide details|向导详情/i });

  await expect(drawer).toBeVisible({ timeout: 15_000 });

  await drawer.getByRole("button", { name: /Book guide|预约向导/i }).click({ timeout: 15_000 });



  await expect(page.getByRole("dialog", { name: /Book guide|预约向导/i })).toBeVisible({

    timeout: 15_000,

  });

}



test.describe.configure({ mode: "serial" });



test.describe("B-469 · /guides/[id] & GuideDetailDrawer → BookGuideModal → escrow bind (GD-L5-P3)", () => {

  test("GuideDetailDrawer → 预约 → 绑定向导至 Escrow（itinerary-first）", async ({ page, request }) => {

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

    const touristToken = await apiLogin(request, "tourist@test.com", "Test123!");

    await seedPublishedOpenItineraryOrder(request, API_BASE, touristToken);



    const guideId = await guideRowIdForSeedGuideAccount(request, API_BASE);

    expect(guideId, "guide@test guide.id").toBeTruthy();



    await gotoLoginWhenReady(page, `/auth/login?returnUrl=${encodeURIComponent("/market")}`);

    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");

    await page.getByLabel(/password|密码/i).fill("Test123!");

    await page.getByRole("button", { name: /Log in|登录/i }).click();

    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({

      timeout: 30_000,

    });

    await page.waitForURL(/\/market/, { timeout: 30_000 });



    await openBookModalFromGuideDrawer(page, guideId);

    await bindGuideFromBookGuideModal(page);

    await expect(page).toHaveURL(/\/escrow\//, { timeout: 30_000 });

  });



  test("/guides/[id] → 预约按钮 → BookGuideModal → Escrow bind（itinerary-first）", async ({

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

    const touristToken = await apiLogin(request, "tourist@test.com", "Test123!");

    const seededOrderId = await seedPublishedOpenItineraryOrder(request, API_BASE, touristToken);



    const guideId = await guideRowIdForSeedGuideAccount(request, API_BASE);

    expect(guideId, "guide@test guide.id").toBeTruthy();



    const detailPath = `/guides/${encodeURIComponent(guideId)}?bindGuideToOrder=${encodeURIComponent(seededOrderId)}`;

    await gotoLoginWhenReady(page, `/auth/login?returnUrl=${encodeURIComponent(detailPath)}`);

    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");

    await page.getByLabel(/password|密码/i).fill("Test123!");

    await page.getByRole("button", { name: /Log in|登录/i }).click();

    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({

      timeout: 30_000,

    });

    await expect(page).toHaveURL(new RegExp(`/guides/${guideId}`), { timeout: 30_000 });



    await assertGuideItineraryTripAutoSelected(page);

    await page.locator('[data-tt-guide-detail-book-cta="1"]').click({ timeout: 20_000 });



    await bindGuideFromBookGuideModal(page);

    await expect(page).toHaveURL(new RegExp(`/escrow/${seededOrderId}`), { timeout: 30_000 });

  });

});


