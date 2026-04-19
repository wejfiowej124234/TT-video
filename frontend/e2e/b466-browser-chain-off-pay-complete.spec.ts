/**
 * B-466：P3 链下闭环 — 将「模拟入金」「链下确认完成」从 Playwright `request.post` 改为浏览器真实点击
 *（`/pay` · `orderMockPay`；`/escrow` · `orderConfirmCompletion`）。建单仍为 API，以隔离变量。
 * 含 `/orders/new` 浏览器建单 + 评价全链路：**`b467-full-ui-order-journey.spec.ts`**。
 */
import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
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

/** `/pay` 模拟入金 CTA（与 locales `pay_mockPay_cta` 对齐） */
const mockPayButtonRe = /Simulate deposit \(chain-off\)|模拟入金（链下）/;
/** `OrderActionsBlock` 链下确认完成（与 `escrow_confirmCompletion` 对齐） */
const confirmOffChainRe = /Confirm completion \(off-chain\)|确认完成（链下）/;

test.describe.configure({ mode: "serial" });

test.describe("B-466 · browser chain-off pay + confirm completion (no REST for those steps)", {
  tag: "@e2e-chain-off-mock-pay",
}, () => {
  test("旅行者 /pay 模拟入金 + 向导 /escrow 链下确认完成", async ({ page, request }) => {
    test.setTimeout(360_000);

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
    const guideId = await guideRowIdForSeedGuideAccount(request, API_BASE);
    expect(guideId, "guide@test guide.id").toBeTruthy();

    const amount = `48.${Date.now().toString().slice(-4)}`;
    const idemCreate =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `b466-create-${Date.now()}`;

    const createRes = await request.post(`${API_BASE}/api/v1/orders`, {
      headers: {
        Authorization: `Bearer ${touristToken}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idemCreate,
      },
      data: {
        guide_id: guideId,
        amount,
        currency: "USD",
      },
    });
    if (!createRes.ok()) {
      const errText = await createRes.text();
      test.skip(true, `API 建单失败 HTTP ${createRes.status()} ${errText.slice(0, 240)}`);
    }
    const created = (await createRes.json()) as { order?: { id?: string } };
    const orderId = (created.order?.id ?? "").trim();
    expect(orderId.length).toBeGreaterThan(10);

    const escrowUrl = `/escrow/${encodeURIComponent(orderId)}`;
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
  });
});
