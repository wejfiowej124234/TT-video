/**
 * B-464：向导端 · 同一订单 — UI 接单 → 详情页状态随链路可见 → 完成后旅行者评价在 `/escrow/:id` 可见。
 * 旅行者侧仅 API（建单 / mock-pay / POST reviews）；不接单、完成确认走 REST，与 P03/B-463 链下前置一致。
 * 旅行者 UI 提交评价 + 向导可见（双边）：`b465-bilateral-review-ui-e2e.spec.ts`。
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

/** 接单后 / mock-pay 后 / 完成后顶栏与主内容可见文案（中英双语，避免 locale 假红） */
const bilateralRe = /Awaiting bilateral confirmation|待双边确认/;
const fundedRe = /Funded · awaiting fulfillment|已入金·待履约/;
const completedOrRatingRe =
  /Completed|已完成|Rating in progress|评分中|Rating confirmed|已确认评分/;

test.describe.configure({ mode: "serial" });

test.describe("B-464 · guide order journey (accept · status · review visible)", {
  tag: "@e2e-chain-off-mock-pay",
}, () => {
  test("向导 UI 接单 → 状态可见 → 完成后被评价在详情可见", async ({ page, request }) => {
    test.setTimeout(300_000);

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

    const amount = `46.${Date.now().toString().slice(-4)}`;
    const idemCreate =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `b464-create-${Date.now()}`;

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

    const comment = `b464-guide-visible-${Date.now().toString(36)}`;
    const idemReview =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `b464-rev-${Date.now()}`;
    const revRes = await request.post(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}/reviews`,
      {
        headers: {
          Authorization: `Bearer ${touristToken}`,
          "Content-Type": "application/json",
          "Idempotency-Key": idemReview,
        },
        data: { score: 5, comment },
      }
    );
    expect(revRes.ok(), await revRes.text()).toBeTruthy();

    await page.reload({ waitUntil: "domcontentloaded" });
    const reviewsHeading = page.getByRole("heading", {
      name: /Reviews \(P23\)|评价（P23）/i,
    });
    await expect(reviewsHeading).toBeVisible({ timeout: 35_000 });
    await expect(page.getByText(comment, { exact: false })).toBeVisible({
      timeout: 30_000,
    });
  });
});
