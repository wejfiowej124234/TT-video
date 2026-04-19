/**
 * TT-TOURIST-JOURNEY-P05-CONFIRM-FINAL-ESCROW-001：P04 双边确认后，任一方在 /escrow 完成「终版确认」→ snapshot_hash → 页内展示；不覆盖 P06 入金。
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

test.describe("P05 confirm final plan → escrow", { tag: "@e2e-sepolia-deferred" }, () => {
  test("双边确认后终版确认成功，GET :id 含 snapshot_hash，/escrow 展示快照锚点", async ({
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

    const amount = `55.${Date.now().toString().slice(-4)}`;
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

    await uiLogout(page);

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

    const preCf = await request.get(`${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${touristToken}` },
    });
    expect(preCf.ok()).toBeTruthy();
    const preJson = (await preCf.json()) as { itinerary?: { version?: number } };
    const expectedVersion = preJson.itinerary?.version ?? 1;
    const idemCf =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `cf-${Date.now()}`;
    const cfRes = await request.post(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}/confirm-final-plan`,
      {
        headers: {
          Authorization: `Bearer ${touristToken}`,
          "Content-Type": "application/json",
          "Idempotency-Key": idemCf,
        },
        data: { expected_version: expectedVersion },
      },
    );
    if (!cfRes.ok()) {
      const errText = await cfRes.text();
      throw new Error(`confirm-final-plan failed ${cfRes.status}: ${errText.slice(0, 500)}`);
    }

    const after = await request.get(`${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${touristToken}` },
    });
    expect(after.ok()).toBeTruthy();
    const afterJson = (await after.json()) as {
      itinerary?: { snapshot_hash?: string; version?: number };
    };
    const snap = (afterJson.itinerary?.snapshot_hash ?? "").trim();
    expect(snap.startsWith("0x")).toBeTruthy();
    expect(snap.length).toBeGreaterThan(10);

    // —— /escrow 展示（B-070 同页；以快照文案为准） ——
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
    expect(page.url()).toContain(`/escrow/${orderId}`);

    await expect(page.locator("#escrow-after-final-plan")).toBeAttached({
      timeout: 30_000,
    });
    await expect(
      page.locator("main").getByText(/快照哈希：|SnapshotHash:/i).first(),
    ).toBeVisible({ timeout: 25_000 });
  });
});
