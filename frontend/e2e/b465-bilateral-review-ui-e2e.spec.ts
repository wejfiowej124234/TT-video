/**
 * B-465：双边评价闭环 — 同一订单内合并
 * - B-464 向导：`/escrow/:id` UI 接单 → 详情状态随 mock-pay / confirm-completion 可见；
 * - B-463 旅行者：`/escrow/:id/rate` 浏览器表单提交评价（含 weight_breakdown 展示）；
 * - 再切回向导：`/escrow/:id` 即时可见旅行者评论（ReviewBlock）。
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

test.describe.configure({ mode: "serial" });

test.describe("B-465 · bilateral review (guide UI + tourist UI + guide sees)", {
  tag: "@e2e-chain-off-mock-pay",
}, () => {
  test("旅行者 /rate 表单提交后向导 /escrow 即时可见", async ({ page, request }) => {
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
    const guideToken = await apiLogin(request, "guide@test.com", "Test123!");
    const guideId = await guideRowIdForSeedGuideAccount(request, API_BASE);
    expect(guideId, "guide@test guide.id").toBeTruthy();

    const amount = `47.${Date.now().toString().slice(-4)}`;
    const idemCreate =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `b465-create-${Date.now()}`;

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

    const payRes = await request.post(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}/mock-pay`,
      { headers: { Authorization: `Bearer ${touristToken}`, "Content-Type": "application/json" }, data: "{}" }
    );
    expect(payRes.ok(), await payRes.text()).toBeTruthy();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("main").getByText(fundedRe).first()).toBeVisible({
      timeout: 35_000,
    });

    const doneRes = await request.post(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}/confirm-completion`,
      { headers: { Authorization: `Bearer ${guideToken}`, "Content-Type": "application/json" }, data: "{}" }
    );
    expect(doneRes.ok(), await doneRes.text()).toBeTruthy();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("main").getByText(completedOrRatingRe).first()).toBeVisible({
      timeout: 35_000,
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

    const reviewsHeadingTourist = page.getByRole("heading", {
      name: /Reviews \(P23\)|评价（P23）/i,
    });
    await expect(reviewsHeadingTourist).toBeVisible({ timeout: 25_000 });

    await page.getByRole("combobox").first().selectOption("5");
    const comment = `b465-bilateral-${Date.now().toString(36)}`;
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

    await expect(page.getByText(comment, { exact: false })).toBeVisible({
      timeout: 25_000,
    });
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
    await expect(page).toHaveURL(new RegExp(`/escrow/${orderId}`), { timeout: 30_000 });

    const reviewsHeadingGuide = page.getByRole("heading", {
      name: /Reviews \(P23\)|评价（P23）/i,
    });
    await expect(reviewsHeadingGuide).toBeVisible({ timeout: 35_000 });
    await expect(page.getByText(comment, { exact: false })).toBeVisible({
      timeout: 30_000,
    });
  });
});
