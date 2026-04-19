/**
 * 93 矩阵证据链 · 页面级 F1–F4 + **A-REG-001 注册页补口**（与
 * `evidence/GO_20260419/93-path-register-order-mockpay-governance-read/REAL_CHAIN_VERIFY.md` 互指）。
 *
 * - **F1-REG**：`/auth/register` 浏览器注册（全段「注册 **或** 登录」之 **注册** 支路）。
 * - **F1-LOG**：`/auth/login` 浏览器登录（种子游客）。
 * - **F2–F4**：市场 / 托管 / 治理（同前）。
 *
 * 依赖：`traveltrust-api` + Postgres；**mock-pay 段**另须 **`P3_CHAIN_OFF=1`**。Playwright **setup-meta-chain** 在本地无合约时可设 **`PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1`**。
 */
import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { guideRowIdForSeedGuideAccount } from "./helpers/guideSeedGuideRowId";
import { releaseSeedGuideSlotIfBlocked } from "./helpers/releaseSeedGuideSlot";
import { skipUnlessOrderMockPayAvailable } from "./helpers/skipUnlessOrderMockPayAvailable";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

const fundedRe = /Funded · awaiting fulfillment|已入金·待履约/;
const GOV_TARGET_NOTICE = /文档镜像|API 占位|placeholders|documentation mirrors|Protocol parameters|协议参数/i;

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

/** 全段补口：93 F1 要求「注册 **或** 登录」— 本文件在 mock-pay 主用例外单独覆盖 **注册 UI**。 */
test.describe("93-matrix · A-REG-001 /auth/register UI (F1 register branch)", () => {
  test("注册页提交 → 跳转登录 → 可进 /market", async ({ page, request }) => {
    test.setTimeout(120_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }

    const stamp = Date.now();
    const email = `93-f1-reg-${stamp}@e2e.local`;
    const password = "TestChain9!";
    const loginReturn = `/auth/login?returnUrl=${encodeURIComponent("/market")}`;

    await page.goto(`/auth/register?returnUrl=${encodeURIComponent(loginReturn)}`, { timeout: 60_000 });
    await expect(page.getByRole("main", { name: /Register|注册/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: /Register|注册/i })).toBeVisible({ timeout: 20_000 });

    await page.getByRole("textbox", { name: /email|邮箱/i }).fill(email);
    await page.getByLabel(/password|密码/i).first().fill(password);
    await page.getByLabel(/confirm|确认/i).fill(password);
    await page.getByRole("button", { name: /^(Register|注册)$/i }).click();

    await page.waitForURL(/\/auth\/login/, { timeout: 25_000 });
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill(email);
    await page.getByLabel(/password|密码/i).fill(password);
    await Promise.all([
      page.waitForURL(/\/market/, { timeout: 30_000 }),
      page.getByRole("button", { name: /Log in|登录/i }).click(),
    ]);

    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({ timeout: 25_000 });
    await expect(page.getByRole("main", { name: /Market|自由市场/i })).toBeVisible({ timeout: 25_000 });
  });
});

test.describe("93-matrix · F1–F4 browser (login → market → escrow → governance)", {
  tag: "@e2e-chain-off-mock-pay",
}, () => {
  test("F1 登录页 → F2 市场 → F3 托管页（已 mock-pay）→ F4 治理", async ({ page, request }) => {
    test.setTimeout(240_000);

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

    const amount = `93.${Date.now().toString().slice(-4)}`;
    const idemCreate =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `93-f14-${Date.now()}`;

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
    expect(createRes.ok(), await createRes.text()).toBeTruthy();
    const created = (await createRes.json()) as { order?: { id?: string } };
    const orderId = (created.order?.id ?? "").trim();
    expect(orderId.length).toBeGreaterThan(10);

    const acceptRes = await request.post(`${API_BASE}/api/v1/orders/${orderId}/accept`, {
      headers: { Authorization: `Bearer ${guideToken}` },
    });
    expect(acceptRes.ok(), await acceptRes.text()).toBeTruthy();

    const payRes = await request.post(`${API_BASE}/api/v1/orders/${orderId}/mock-pay`, {
      headers: { Authorization: `Bearer ${touristToken}` },
    });
    expect(payRes.ok(), await payRes.text()).toBeTruthy();

    // —— F1：登录页（表单可见）+ 浏览器登录 ——
    await gotoLoginWhenReady(page, `/auth/login?returnUrl=${encodeURIComponent("/market")}`);
    await expect(page.getByRole("main", { name: /Login|登录/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: /Login|登录/i })).toBeVisible({ timeout: 20_000 });

    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.waitForURL(/\/market/, { timeout: 30_000 });

    // —— F2：自由市场 ——
    await expect(page.getByRole("main", { name: /Market|自由市场/i })).toBeVisible({ timeout: 25_000 });
    await expect(page.getByRole("heading", { name: /Market|自由市场/i })).toBeVisible({ timeout: 25_000 });

    // —— F3：托管详情（与 API 链 escrowed 一致）——
    await page.goto(`/escrow/${encodeURIComponent(orderId)}`, { timeout: 60_000 });
    await expect(page).toHaveURL(new RegExp(`/escrow/${orderId}`), { timeout: 25_000 });
    await expect(page.locator("main").getByText(fundedRe).first()).toBeVisible({ timeout: 45_000 });

    // —— F4：治理只读入口 ——
    await page.goto("/governance", { timeout: 60_000 });
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("main", { name: /Governance|治理/i })).toBeVisible({ timeout: 35_000 });
    await expect(page.getByRole("heading", { level: 1, name: /Governance|治理/i })).toBeVisible({
      timeout: 35_000,
    });
    await expect(page.getByRole("note").filter({ hasText: GOV_TARGET_NOTICE }).first()).toBeVisible({
      timeout: 40_000,
    });
  });
});
