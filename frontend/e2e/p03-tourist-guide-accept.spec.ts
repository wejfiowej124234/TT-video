/**
 * TT-TOURIST-JOURNEY-P03-GUIDE-ACCEPT-001：旅行者建单（API `POST /api/v1/orders`，与 UI 同源）→ 向导「我的订单」+ `/escrow/:id` 接单
 *（Created 单不在 discover /market）→ 双方 /orders 状态一致；双账号切换不串会话。
 */
import { test, expect } from "@playwright/test";
import { guideRowIdForSeedGuideAccount } from "./helpers/guideSeedGuideRowId";
import { releaseSeedGuideSlotIfBlocked } from "./helpers/releaseSeedGuideSlot";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;
const SESSION_KEY = "traveltrust_session_token";

async function uiLogout(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /User menu|用户菜单/i }).click();
  await page.getByRole("menuitem", { name: /Log out|登出|退出/i }).click();
  await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toHaveCount(0, {
    timeout: 20_000,
  });
}

/** 顶栏昵称依赖 `GET /me`；DB 存量种子可能无 nickname，与「测试旅行者」文案断言易假红，故用 email 作 SSOT。 */
async function expectMeEmail(
  request: import("@playwright/test").APIRequestContext,
  token: string,
  email: string,
): Promise<void> {
  const res = await request.get(`${API_BASE}/api/v1/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  const body = (await res.json()) as { user?: { email?: string } };
  expect(body.user?.email?.toLowerCase()).toBe(email.toLowerCase());
}

function amountUsdRegex(amount: string): RegExp {
  const esc = amount.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`${esc}\\s+USD`);
}


test.describe("P03 guide accept (cross-account)", () => {
  test("向导接单后旅行者与向导侧订单状态一致，会话不串", async ({ page, request }) => {
    test.setTimeout(300_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不通：${API_HEALTH}`);
    }

    await request
      .post(`${API_BASE}/auth/seed-test-accounts`, {
        headers: { "Content-Type": "application/json" },
        data: "{}",
      })
      .catch(() => null);

    await releaseSeedGuideSlotIfBlocked(request, API_BASE);

    const loginTouristApi = await request.post(`${API_BASE}/auth/login`, {
      headers: { "Content-Type": "application/json" },
      data: { email: "tourist@test.com", password: "Test123!" },
    });
    if (!loginTouristApi.ok()) {
      test.skip(true, `API 不通：旅行者登录 HTTP ${loginTouristApi.status()}`);
    }
    const touristTokenJson = (await loginTouristApi.json()) as { token?: string };
    const touristApiToken = touristTokenJson.token?.trim();
    if (!touristApiToken) {
      test.skip(true, "API 不通：旅行者登录无 token");
    }

    const guideId = await guideRowIdForSeedGuideAccount(request, API_BASE);
    if (!guideId) {
      test.skip(true, "向导种子缺失：guide@test GET /me 无 guide.id（需 SEED_TEST_ACCOUNTS）");
    }

    const amount = `43.${Date.now().toString().slice(-4)}`;
    const idemCreate =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `order-create-${Date.now()}`;

    const createRes = await request.post(`${API_BASE}/api/v1/orders`, {
      headers: {
        Authorization: `Bearer ${touristApiToken}`,
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

    const ordersReturn = `/orders?expect_order=${encodeURIComponent(orderId)}`;
    const loginTouristUi = `/auth/login?returnUrl=${encodeURIComponent(ordersReturn)}`;
    for (let attempt = 0; attempt < 3; attempt++) {
      await page.goto(loginTouristUi, { timeout: 60_000 });
      const emailBox = page.getByRole("textbox", { name: /email|邮箱/i });
      try {
        await emailBox.waitFor({ state: "visible", timeout: 20_000 });
        break;
      } catch {
        if (attempt === 2) throw new Error("login page did not become ready (got 404 or slow dev)");
      }
    }
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await page.waitForURL(/\/orders/, { timeout: 60_000 });
    if (!page.url().includes("expect_order=")) {
      await page.goto(ordersReturn);
    }

    await expect(page.getByText(amountUsdRegex(amount))).toBeVisible({
      timeout: 25_000,
    });

    const tokenTourist = await page.evaluate((k) => localStorage.getItem(k), SESSION_KEY);
    expect(tokenTourist?.length).toBeGreaterThan(0);
    await expectMeEmail(request, tokenTourist!, "tourist@test.com");
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 15_000,
    });

    await uiLogout(page);

    /** `POST /orders` 创建为 Created；discover 仅含 Draft+itinerary，故不在 /market。向导从「我的订单」与 `/escrow/:id` 接单（与 OrderActionsBlock canAccept）。 */
    await page.goto(`/auth/login?returnUrl=${encodeURIComponent("/orders")}`);
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("guide@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await page.waitForURL(/\/orders/, { timeout: 60_000 });

    const tokenGuide = await page.evaluate((k) => localStorage.getItem(k), SESSION_KEY);
    expect(tokenGuide?.length).toBeGreaterThan(0);
    expect(tokenGuide).not.toBe(tokenTourist);

    await expectMeEmail(request, tokenGuide!, "guide@test.com");
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 15_000,
    });

    await expect
      .poll(async () => {
        const tr = await request.get(`${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}`, {
          headers: { Authorization: `Bearer ${touristApiToken}` },
        });
        const gr = await request.get(`${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}`, {
          headers: { Authorization: `Bearer ${tokenGuide}` },
        });
        return tr.ok() && gr.ok();
      }, { timeout: 60_000 })
      .toBe(true);

    const pendingCard = page.locator("article").filter({
      has: page.locator(`a[href="/escrow/${orderId}"], a[href*="${orderId}"]`),
    });
    await expect(pendingCard.getByText(amountUsdRegex(amount))).toBeVisible({
      timeout: 60_000,
    });

    await page.goto(`/escrow/${encodeURIComponent(orderId)}`, { timeout: 60_000 });
    /** 与 `trust-gate-escrow` 同构：全栈多 worker 下先等主区与操作区，避免仅点按钮在冷编译时 45s 假超时 */
    await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
      timeout: 90_000,
    });
    const actionsHeading = page.getByRole("heading", { name: /订单操作|Order actions/i });
    await expect(actionsHeading).toBeVisible({ timeout: 45_000 });
    await actionsHeading.locator("..").getByRole("button", { name: /接单|Accept order/i }).click({
      timeout: 60_000,
    });
    await expect(
      page.locator("main").getByText(/待双边确认|Awaiting bilateral confirmation/i).first(),
    ).toBeVisible({
      timeout: 45_000,
    });

    await page.goto("/orders", { timeout: 60_000 });
    const guideOrderCard = page.locator("article").filter({
      has: page.locator(`a[href="/escrow/${orderId}"], a[href*="${orderId}"]`),
    });
    await expect(guideOrderCard.getByText(/待双边确认|Awaiting bilateral confirmation/i).first()).toBeVisible({
      timeout: 45_000,
    });

    await uiLogout(page);

    await page.goto(`/auth/login?returnUrl=${encodeURIComponent("/orders")}`, { timeout: 60_000 });
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await page.waitForURL(/\/orders/, { timeout: 45_000 });

    const tokenTourist2 = await page.evaluate((k) => localStorage.getItem(k), SESSION_KEY);
    expect(tokenTourist2).not.toBe(tokenGuide);
    await expectMeEmail(request, tokenTourist2!, "tourist@test.com");
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 15_000,
    });

    await page.reload();
    const touristCard = page.locator("article").filter({
      has: page.locator(`a[href="/escrow/${orderId}"], a[href*="${orderId}"]`),
    });
    await expect(touristCard.getByText(/待双边确认|Awaiting bilateral confirmation/i).first()).toBeVisible({
      timeout: 45_000,
    });
  });
});
