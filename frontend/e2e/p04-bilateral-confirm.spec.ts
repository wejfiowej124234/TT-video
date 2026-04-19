/**
 * TT-TOURIST-JOURNEY-P04-BILATERAL-001：接单后双方「确认行程与金额」→ sub_status=confirmed → 列表「已确认·待付款」。
 * 前置与 P03 同源：API 建单、向导 /escrow 接单。验收：`GET :id` / `GET` 列表含 **`sub_status`**；UI 以 **`/escrow`** 主文案为准。
 */
import { test, expect } from "@playwright/test";
import { guideRowIdForSeedGuideAccount } from "./helpers/guideSeedGuideRowId";
import { releaseSeedGuideSlotIfBlocked } from "./helpers/releaseSeedGuideSlot";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

async function uiLogout(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /User menu|用户菜单/i }).click();
  await page.getByRole("menuitem", { name: /Log out|登出|退出/i }).click();
  await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toHaveCount(0, {
    timeout: 20_000,
  });
}

async function gotoLoginWhenReady(page: import("@playwright/test").Page, loginHref: string) {
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

test.describe("P04 bilateral confirm", () => {
  test("仅一方确认时 sub_status 仍为 pending_bilateral；双方确认后一致为已确认·待付款", async ({
    page,
    request,
  }) => {
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

    const loginTourist = await request.post(`${API_BASE}/auth/login`, {
      headers: { "Content-Type": "application/json" },
      data: { email: "tourist@test.com", password: "Test123!" },
    });
    if (!loginTourist.ok()) test.skip(true, "旅行者登录失败");
    const touristToken = ((await loginTourist.json()) as { token?: string }).token?.trim();
    if (!touristToken) test.skip(true, "无旅行者 token");

    const guideId = await guideRowIdForSeedGuideAccount(request, API_BASE);
    if (!guideId) test.skip(true, "无向导 seed：guide@test GET /me 无 guide.id");

    const amount = `44.${Date.now().toString().slice(-4)}`;
    const idemCreate =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `c-${Date.now()}`;
    const createRes = await request.post(`${API_BASE}/api/v1/orders`, {
      headers: {
        Authorization: `Bearer ${touristToken}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idemCreate,
      },
      data: { guide_id: guideId, amount, currency: "USD" },
    });
    if (!createRes.ok()) {
      test.skip(true, `建单失败 ${createRes.status()}`);
    }
    const created = (await createRes.json()) as { order?: { id?: string } };
    const orderId = (created.order?.id ?? "").trim();
    expect(orderId.length).toBeGreaterThan(10);

    const ordersReturn = `/orders?expect_order=${encodeURIComponent(orderId)}`;
    await gotoLoginWhenReady(
      page,
      `/auth/login?returnUrl=${encodeURIComponent(ordersReturn)}`,
    );
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await page.waitForURL(/\/orders/, { timeout: 30_000 });
    if (!page.url().includes("expect_order=")) await page.goto(ordersReturn);

    await uiLogout(page);

    await gotoLoginWhenReady(page, `/auth/login?returnUrl=${encodeURIComponent("/orders")}`);
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("guide@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await page.waitForURL(/\/orders/, { timeout: 25_000 });

    await page.goto(`/escrow/${encodeURIComponent(orderId)}`);
    await page.getByRole("button", { name: /接单|Accept/i }).click({ timeout: 25_000 });
    await expect(
      page.locator("main").getByText(/待双边确认|Awaiting bilateral confirmation/i).first(),
    ).toBeVisible({ timeout: 25_000 });

    await uiLogout(page);

    // —— 旅行者先确认 ——
    await gotoLoginWhenReady(
      page,
      `/auth/login?returnUrl=${encodeURIComponent(`/escrow/${orderId}`)}`,
    );
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.goto(`/escrow/${encodeURIComponent(orderId)}`);

    await page
      .getByRole("button", { name: /确认行程与金额|Confirm itinerary and amount/i })
      .click({ timeout: 20_000 });
    await expect(
      page.getByRole("button", { name: /确认行程与金额|Confirm itinerary and amount/i }),
    ).toBeEnabled({ timeout: 20_000 });

    const mid = await request.get(`${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${touristToken}` },
    });
    expect(mid.ok()).toBeTruthy();
    const midJson = (await mid.json()) as {
      order?: { sub_status?: string; tourist_confirmed?: boolean; guide_confirmed?: boolean };
    };
    expect(midJson.order?.tourist_confirmed).toBe(true);
    expect(midJson.order?.guide_confirmed).not.toBe(true);
    expect(midJson.order?.sub_status ?? "").not.toBe("confirmed");

    await expect(
      page.getByRole("main").getByText(/待双边确认|Awaiting bilateral confirmation/i).first(),
    ).toBeVisible({ timeout: 15_000 });

    await uiLogout(page);

    // —— 向导再确认 ——
    await gotoLoginWhenReady(
      page,
      `/auth/login?returnUrl=${encodeURIComponent(`/escrow/${orderId}`)}`,
    );
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("guide@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.goto(`/escrow/${encodeURIComponent(orderId)}`);

    await page
      .getByRole("button", { name: /确认行程与金额|Confirm itinerary and amount/i })
      .click({ timeout: 20_000 });

    const loginGuide = await request.post(`${API_BASE}/auth/login`, {
      headers: { "Content-Type": "application/json" },
      data: { email: "guide@test.com", password: "Test123!" },
    });
    const guideTok = ((await loginGuide.json()) as { token?: string }).token?.trim() ?? "";
    const fin = await request.get(`${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${guideTok}` },
    });
    expect(fin.ok()).toBeTruthy();
    const finJson = (await fin.json()) as {
      order?: { sub_status?: string; tourist_confirmed?: boolean; guide_confirmed?: boolean };
    };
    expect(finJson.order?.sub_status).toBe("confirmed");
    expect(finJson.order?.tourist_confirmed).toBe(true);
    expect(finJson.order?.guide_confirmed).toBe(true);

    await page.goto(`/escrow/${encodeURIComponent(orderId)}`);
    await page.reload();
    await expect(
      page.locator("main").getByText(/已确认·待付款|Confirmed · awaiting payment/i).first(),
    ).toBeVisible({ timeout: 25_000 });

    await uiLogout(page);

    await gotoLoginWhenReady(
      page,
      `/auth/login?returnUrl=${encodeURIComponent(`/escrow/${orderId}`)}`,
    );
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.goto(`/escrow/${encodeURIComponent(orderId)}`);
    await page.reload();
    await expect(
      page.locator("main").getByText(/已确认·待付款|Confirmed · awaiting payment/i).first(),
    ).toBeVisible({ timeout: 25_000 });

  });
});
