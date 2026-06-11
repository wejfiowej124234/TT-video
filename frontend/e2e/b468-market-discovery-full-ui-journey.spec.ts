/**
 * B-468：市场发现 → 预订 CTA → Escrow bind — GD-L5-P3 itinerary-first：
 * `/market` 选向导 → `BookGuideModal` 选行程绑定向导 → `/escrow/:id`，后续履约与 B-467 同源。
 */
import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import {
  bindGuideFromBookGuideModal,
  seedPublishedOpenItineraryOrder,
} from "./helpers/bookGuideItineraryFirst";
import { guideRowIdForSeedGuideAccount } from "./helpers/guideSeedGuideRowId";
import { releaseSeedGuideSlotIfBlocked } from "./helpers/releaseSeedGuideSlot";
import { skipUnlessOrderMockPayAvailable } from "./helpers/skipUnlessOrderMockPayAvailable";

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

async function uiLogout(page: Page) {
  await page.getByRole("button", { name: /User menu|用户菜单/i }).click();
  await page.getByRole("menuitem", { name: /Log out|登出|退出/i }).click();
  await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toHaveCount(0, {
    timeout: 20_000,
  });
}

async function apiLogin(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<string> {
  const res = await request.post(`${API_BASE}/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  const body = (await res.json()) as { token?: string };
  const t = body.token?.trim();
  expect(t).toBeTruthy();
  return t as string;
}

const bilateralRe = /Awaiting bilateral confirmation|待双边确认/;
const fundedRe = /Funded · awaiting fulfillment|已入金·待履约/;
const completedOrRatingRe =
  /Completed|已完成|Rating in progress|评分中|Rating confirmed|已确认评分/;
const mockPayButtonRe = /Simulate deposit \(chain-off\)|模拟入金（链下）/;
const confirmOffChainRe = /Confirm completion \(off-chain\)|确认完成（链下）/;

/** `/market` 卡片上预约 → 弹层 itinerary-first bind → `/escrow/:id` */
async function openEscrowBindFromMarketBooking(page: Page, guideId: string): Promise<string> {
  await page.getByRole("tab", { name: /^Guides$|^向导$/ }).click();
  const guideCard = page.getByRole("article").filter({
    has: page.locator(`h3#guide-title-${guideId}`),
  });
  await expect(guideCard).toBeVisible({ timeout: 90_000 });

  await guideCard
    .getByRole("button", { name: /Book guide|预约向导/i })
    .click({ timeout: 20_000 });

  await bindGuideFromBookGuideModal(page);
  const m = page.url().match(/\/escrow\/([^/?#]+)/);
  expect(m?.[1]).toBeTruthy();
  return m![1] as string;
}

test.describe.configure({ mode: "serial" });

test.describe("B-468 · market discovery → book modal → full UI journey (extends B-467)", {
  tag: "@e2e-chain-off-mock-pay",
}, () => {
  test("/market 预订 CTA → 建单→履约→评价 闭环", async ({ page, request }) => {
    test.setTimeout(660_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }

    await skipUnlessOrderMockPayAvailable(request, API_BASE);

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

    const orderId = await openEscrowBindFromMarketBooking(page, guideId);
    expect(orderId.length).toBeGreaterThan(10);

    const escrowUrl = `/escrow/${encodeURIComponent(orderId)}`;
    await uiLogout(page);

    await gotoLoginWhenReady(
      page,
      `/auth/login?returnUrl=${encodeURIComponent(escrowUrl)}`
    );
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("guide@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page).toHaveURL(new RegExp(`/escrow/${orderId}`), { timeout: 30_000 });

    await page.getByRole("button", { name: /接单|Accept/i }).click({ timeout: 25_000 });
    await expect(page.locator("main").getByText(bilateralRe).first()).toBeVisible({
      timeout: 30_000,
    });

    await uiLogout(page);

    const payUrl = `/pay?orderId=${encodeURIComponent(orderId)}`;
    await gotoLoginWhenReady(page, `/auth/login?returnUrl=${encodeURIComponent(payUrl)}`);
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page).toHaveURL(new RegExp(`/pay`), { timeout: 30_000 });

    const mockPayBtn = page.getByRole("button", { name: mockPayButtonRe });
    await expect(mockPayBtn).toBeVisible({ timeout: 45_000 });
    await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes(`/api/v1/orders/${orderId}/mock-pay`) &&
          res.request().method() === "POST" &&
          res.ok(),
        { timeout: 45_000 }
      ),
      mockPayBtn.click(),
    ]);
    await expect(
      page.getByText(/Simulated deposit recorded|模拟入金已登记/i).first()
    ).toBeVisible({ timeout: 20_000 });

    await uiLogout(page);

    await gotoLoginWhenReady(
      page,
      `/auth/login?returnUrl=${encodeURIComponent(escrowUrl)}`
    );
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("guide@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page).toHaveURL(new RegExp(`/escrow/${orderId}`), { timeout: 30_000 });

    await expect(page.locator("main").getByText(fundedRe).first()).toBeVisible({
      timeout: 40_000,
    });

    const confirmBtn = page.getByRole("button", { name: confirmOffChainRe });
    await expect(confirmBtn).toBeVisible({ timeout: 25_000 });
    await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes(`/api/v1/orders/${orderId}/confirm-completion`) &&
          res.request().method() === "POST" &&
          res.ok(),
        { timeout: 45_000 }
      ),
      confirmBtn.click(),
    ]);

    await expect(page.locator("main").getByText(completedOrRatingRe).first()).toBeVisible({
      timeout: 40_000,
    });

    await uiLogout(page);

    const rateUrl = `/escrow/${encodeURIComponent(orderId)}/rate`;
    await gotoLoginWhenReady(
      page,
      `/auth/login?returnUrl=${encodeURIComponent(rateUrl)}`
    );
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page).toHaveURL(new RegExp(`/escrow/${orderId}/rate`), { timeout: 30_000 });

    await expect(
      page.getByRole("heading", { name: /Reviews \(P23\)|评价（P23）/i })
    ).toBeVisible({ timeout: 25_000 });
    await page.getByRole("combobox").first().selectOption("5");
    const comment = `b468-market-${Date.now().toString(36)}`;
    await page.getByLabel(/Review comment|评论（选填）/i).fill(comment);
    await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes(`/api/v1/orders/${orderId}/reviews`) &&
          res.request().method() === "POST" &&
          res.ok(),
        { timeout: 30_000 }
      ),
      page.getByRole("button", { name: /Submit review|提交评价/i }).click(),
    ]);

    await expect
      .poll(async () => {
        const lr = await request.get(
          `${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}/reviews`,
          { headers: { Authorization: `Bearer ${touristToken}` } }
        );
        if (!lr.ok()) return false;
        const j = (await lr.json()) as { items?: { comment?: string | null }[] };
        return (j.items ?? []).some((it) => String(it.comment ?? "").includes(comment));
      })
      .toBeTruthy();

    await expect(page.getByText(comment, { exact: false })).toBeVisible({ timeout: 25_000 });
    await expect(page.getByText(/Weight breakdown|权重分解/i).first()).toBeVisible({
      timeout: 15_000,
    });

    await uiLogout(page);

    await gotoLoginWhenReady(
      page,
      `/auth/login?returnUrl=${encodeURIComponent(escrowUrl)}`
    );
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("guide@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 30_000,
    });

    await expect(
      page.getByRole("heading", { name: /Reviews \(P23\)|评价（P23）/i })
    ).toBeVisible({ timeout: 35_000 });
    await expect(page.getByText(comment, { exact: false })).toBeVisible({
      timeout: 30_000,
    });
  });
});
