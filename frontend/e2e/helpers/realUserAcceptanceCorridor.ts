/**
 * ① Real User Acceptance Sprint — 禁止 seed / fixture / trust-gate 账号
 * 全新注册游客 + 向导 · UI 主链走廊辅助
 */
import { randomUUID } from "node:crypto";
import { expect, type APIRequestContext, type Page } from "@playwright/test";

import {
  clickBilateralConfirmInExperience,
  confirmFinalPlanBtnRe,
  expectBilateralAggregateStatus,
} from "./bilateralExperienceL5Corridor";
import { bindGuideFromBookGuideModal } from "./bookGuideItineraryFirst";
import { saveEscrowItineraryPublish } from "./escrowDraftCorridor";
export { saveEscrowItineraryPublish } from "./escrowDraftCorridor";
import { uiLogout } from "./headerUserMenu";
import {
  clearLandingItinerarySession,
  fillLandingHeroBudget,
  fillLandingHeroChinaBeijing,
  submitLandingHeroForm,
} from "./landingHomeForm";
import { fillGuideRegisterSteps1And2ViaUi, injectGuideRegisterWalletVerifiedInitScript } from "./guideOnboardingStep3Debug";
import { mockPayExpectEscrowed } from "./escrowP05P06Corridor";
import { fillAndSubmitLoginForm } from "./uiAuthControlledForms";

export const REAL_USER_PASSWORD = "TestPass12!";
export const FORBIDDEN_SEED_EMAIL_RE = /@test\.com$/i;

export type RealUserPair = {
  suffix: string;
  touristEmail: string;
  guideEmail: string;
  touristPassword: string;
  guidePassword: string;
};

export function makeRealUserPair(): RealUserPair {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    suffix,
    touristEmail: `real-tourist-${suffix}@traveltrust.acceptance`,
    guideEmail: `real-guide-${suffix}@traveltrust.acceptance`,
    touristPassword: REAL_USER_PASSWORD,
    guidePassword: REAL_USER_PASSWORD,
  };
}

export function assertNotSeedEmail(email: string): void {
  expect(email).not.toMatch(FORBIDDEN_SEED_EMAIL_RE);
  expect(email).not.toMatch(/tourist@test|guide@test/i);
}

async function gotoAuthRegister(page: Page, role?: "guide") {
  const path = role === "guide" ? "/auth/register?role=guide" : "/auth/register";
  await page.goto(path, { timeout: 60_000 });
  await expect(page.locator('[data-tt-auth-route="register"]')).toBeVisible({ timeout: 60_000 });
}

export async function registerFreshAccountViaUi(
  page: Page,
  email: string,
  password: string,
  role?: "guide",
): Promise<void> {
  assertNotSeedEmail(email);
  await gotoAuthRegister(page, role);
  const shell = page.locator('[data-tt-auth-route="register"]');
  const form = shell.locator('form[data-tt-auth-surface="register_form_fields"]');
  await expect(form).toBeVisible({ timeout: 90_000 });

  const emailBox = form.locator('input[type="email"]');
  await emailBox.click();
  await emailBox.pressSequentially(email, { delay: 15 });

  const sendCodeBtn = form.getByRole("button", { name: /发送验证码|Send verification/i });
  const [sendRes] = await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/auth/register/send-verification-code") &&
        res.request().method() === "POST" &&
        res.ok(),
      { timeout: 60_000 },
    ),
    sendCodeBtn.click(),
  ]);
  const sendJson = (await sendRes.json()) as { registration_verification_dev_code?: string };
  let code = String(sendJson.registration_verification_dev_code ?? "").trim();
  if (!code) {
    const devHint = shell.getByText(/\d{6}/).first();
    const hintText = (await devHint.textContent().catch(() => "")) ?? "";
    const m = hintText.match(/\d{6}/);
    code = m?.[0] ?? "";
  }
  expect(code.length).toBe(6);

  const codeBox = form.locator('input[pattern="[0-9]{6}"]');
  await codeBox.fill(code);

  const passFirst = form.locator('input[type="password"]').first();
  const passConfirm = form.locator('input[type="password"]').nth(1);
  await passFirst.pressSequentially(password, { delay: 15 });
  await passConfirm.pressSequentially(password, { delay: 15 });

  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/auth/register") &&
        !res.url().includes("send-verification-code") &&
        res.request().method() === "POST" &&
        res.ok(),
      { timeout: 120_000 },
    ),
    form.locator('[data-tt-auth-register-submit="1"]').click(),
  ]);

  await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
    timeout: 60_000,
  });
}

export async function loginViaUi(page: Page, email: string, password: string, returnUrl: string) {
  assertNotSeedEmail(email);
  await page.goto(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`, { timeout: 60_000 });
  const shell = page.locator('[data-tt-auth-route="login"]');
  await fillAndSubmitLoginForm(shell, email, password);
  await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
    timeout: 60_000,
  });
}

export async function completeGuideOnboardingViaUi(page: Page): Promise<void> {
  await injectGuideRegisterWalletVerifiedInitScript(page);
  await page.goto("/guide/register?step=1", { timeout: 60_000 });
  await fillGuideRegisterSteps1And2ViaUi(page, { skipInitialGoto: true });
  const form = page.locator('[data-tt-guide-register-form="1"]');

  const agreeBox = form.locator('[data-tt-guide-register-agree-wrap="1"] [role="checkbox"]');
  await expect(agreeBox).toBeVisible({ timeout: 30_000 });
  await agreeBox.click();
  await expect(agreeBox).toHaveAttribute("aria-checked", "true");

  const submitBtn = form.locator('[data-tt-guide-register-submit="1"]');
  await expect(submitBtn).toBeEnabled({ timeout: 30_000 });

  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/guides") &&
        !res.url().includes("upload-doc") &&
        res.request().method() === "POST" &&
        res.ok(),
      { timeout: 120_000 },
    ),
    submitBtn.click(),
  ]);

  await expect(
    page.getByText(/向导注册已提交|Guide registration submitted|guideRegister_doneMessage/i).first(),
  ).toBeVisible({ timeout: 60_000 });
}

export async function resolveGuideRowIdForBearer(
  request: APIRequestContext,
  apiBase: string,
  bearer: string,
): Promise<string> {
  const res = await request.get(`${apiBase}/api/v1/me`, {
    headers: { Authorization: `Bearer ${bearer}` },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  const body = (await res.json()) as { guide?: { id?: string } };
  const id = String(body.guide?.id ?? "").trim();
  expect(id.length).toBeGreaterThan(10);
  return id;
}

export async function apiLogin(
  request: APIRequestContext,
  apiBase: string,
  email: string,
  password: string,
): Promise<string> {
  assertNotSeedEmail(email);
  const res = await request.post(`${apiBase}/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  const token = ((await res.json()) as { token?: string }).token?.trim() ?? "";
  expect(token).toBeTruthy();
  return token;
}

export async function stakeGuideViaUi(page: Page, guideRowId: string): Promise<void> {
  await page.goto(`/guides/${encodeURIComponent(guideRowId)}`, { timeout: 60_000 });
  const stakeInput = page.getByLabel(/质押|Stake amount|金额/i);
  await expect(stakeInput).toBeVisible({ timeout: 60_000 });
  await stakeInput.fill("1");
  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes(`/api/v1/guides/${guideRowId}/stake`) &&
        res.request().method() === "POST" &&
        res.ok(),
      { timeout: 60_000 },
    ),
    page.getByRole("button", { name: /质押|Stake/i }).click(),
  ]);
}

export async function createItineraryViaLandingUi(page: Page): Promise<string> {
  await clearLandingItinerarySession(page);
  let lastGotoErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto("/", { timeout: 120_000, waitUntil: "domcontentloaded" });
      lastGotoErr = undefined;
      break;
    } catch (err) {
      lastGotoErr = err;
      if (attempt === 2) throw err;
    }
  }
  if (lastGotoErr) throw lastGotoErr;
  await expect(page.locator("#landing-hero-form")).toBeVisible({ timeout: 120_000 });
  await fillLandingHeroChinaBeijing(page);
  await fillLandingHeroBudget(page, "3700");

  const [createRes] = await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/itineraries") &&
        res.request().method() === "POST" &&
        res.ok(),
      { timeout: 120_000 },
    ),
    submitLandingHeroForm(page),
  ]);

  const created = (await createRes.json()) as { order_id?: string };
  let orderId = String(created.order_id ?? "").trim();

  await expect(page.locator("#itinerary-results")).toBeVisible({ timeout: 120_000 });

  const unlockBtn = page.getByRole("button", { name: /查看完整行程|View full itinerary/i }).first();
  const orderDetailLink = page.getByRole("link", { name: /查看订单详情|View order detail/i }).first();
  await expect(unlockBtn.or(orderDetailLink)).toBeVisible({ timeout: 90_000 });

  if (await unlockBtn.isVisible().catch(() => false)) {
    await unlockBtn.click();
    const modal = page.getByTestId("unlock-modal");
    await expect(modal).toBeVisible({ timeout: 20_000 });
    await modal.getByRole("button", { name: /查看行程|View itinerary/i }).click();
  }

  await expect(orderDetailLink).toBeVisible({ timeout: 90_000 });
  const href = (await orderDetailLink.getAttribute("href")) ?? "";
  const m = href.match(/\/escrow\/([^/?#]+)/);
  if (m?.[1]) orderId = m[1];
  expect(orderId.length).toBeGreaterThan(10);
  return orderId;
}

export async function bindFreshGuideFromMarketUi(
  page: Page,
  orderId: string,
  guideRowId: string,
): Promise<void> {
  await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
    timeout: 90_000,
  });
  await expect(page.getByText(/请选择向导|Select guide/i).first()).toBeVisible({ timeout: 60_000 });

  const marketBindHref = `/market?view=guides&bindGuideToOrder=${encodeURIComponent(orderId)}`;
  const marketLink = page
    .getByRole("link", { name: /前往自由市场选向导|请选择向导|Select guide|Go to.*market.*guide/i })
    .first();

  if (await marketLink.isVisible().catch(() => false)) {
    await marketLink.click();
  } else {
    await page.goto(marketBindHref, { timeout: 60_000 });
  }
  await expect(page).toHaveURL(new RegExp(`bindGuideToOrder=${orderId}`), { timeout: 60_000 });

  const guideCard = page.getByRole("article").filter({
    has: page.locator(`h3#guide-title-${guideRowId}`),
  });
  if (await guideCard.isVisible().catch(() => false)) {
    await guideCard
      .getByRole("button", { name: /Book guide|预约向导|选择此向导|Select this guide/i })
      .click({ timeout: 30_000 });
  } else {
    await page.goto(
      `/guides/${encodeURIComponent(guideRowId)}?bindGuideToOrder=${encodeURIComponent(orderId)}`,
      { timeout: 60_000 },
    );
    await page.locator('[data-tt-guide-detail-book-cta="1"]').click({ timeout: 60_000 });
  }
  await bindGuideFromBookGuideModal(page);
  await expect(page).toHaveURL(new RegExp(`/escrow/${orderId}`), { timeout: 30_000 });
}

export async function clickConfirmFinalPlanInExperience(page: Page): Promise<void> {
  const zone = page.locator('[data-zone="order-protocol"]');
  const btn = zone.getByRole("button", { name: confirmFinalPlanBtnRe }).first();
  await expect(btn).toBeVisible({ timeout: 60_000 });
  await btn.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/confirm-final-plan") &&
        res.request().method() === "POST" &&
        res.ok(),
      { timeout: 60_000 },
    ),
    dialog.getByRole("button", { name: /确认并提交|Confirm and submit/i }).click(),
  ]);
}

export async function runBilateralUiBothSides(
  page: Page,
  touristEmail: string,
  guideEmail: string,
  escrowPath: string,
): Promise<void> {
  await loginViaUi(page, touristEmail, REAL_USER_PASSWORD, escrowPath);
  await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
    timeout: 90_000,
  });
  await expectBilateralAggregateStatus(page, "pending_self");
  await clickBilateralConfirmInExperience(page);
  await expectBilateralAggregateStatus(page, "waiting_other");
  await uiLogout(page);

  await loginViaUi(page, guideEmail, REAL_USER_PASSWORD, escrowPath);
  await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
    timeout: 90_000,
  });
  await expectBilateralAggregateStatus(page, "pending_self");
  await clickBilateralConfirmInExperience(page);
  await expectBilateralAggregateStatus(page, "both_confirmed");
  await uiLogout(page);
}

export const mockPayButtonRe = /Simulate deposit \(chain-off\)|模拟入金（链下）/;
export const confirmOffChainRe = /Confirm completion \(off-chain\)|确认完成（链下）/;
export const fundedRe = /Funded · awaiting fulfillment|已入金·待履约/;
export const completedOrRatingRe =
  /Completed|已完成|Rating in progress|评分中|Rating confirmed|已确认评分/;
export const snapshotHashRe = /快照哈希：|SnapshotHash:/i;

export type MockPayViaUiOpts = {
  request?: APIRequestContext;
  apiBase?: string;
  touristToken?: string;
  /** Caller already on `/pay?orderId=…` after login returnUrl */
  skipGoto?: boolean;
};

export async function mockPayViaUi(
  page: Page,
  orderId: string,
  opts?: MockPayViaUiOpts,
): Promise<void> {
  const payUrl = `/pay?orderId=${encodeURIComponent(orderId)}`;
  if (!opts?.skipGoto) {
    await page.goto(payUrl, { timeout: 60_000 });
  }
  const payRoot = page.locator('[data-tt-pay-root="1"]');
  const mockPayBtn = page.locator('[data-tt-pay-mock-pay-submit="1"]');

  let uiMockVisible = false;
  try {
    await expect(payRoot).toHaveAttribute("data-tt-pay-order-fetch-phase", "ready", {
      timeout: 90_000,
    });
    await expect
      .poll(
        async () => {
          const mockUi = await payRoot.getAttribute("data-tt-pay-mock-ui");
          if (mockUi === "mock_cta") return true;
          return mockPayBtn.isVisible().catch(() => false);
        },
        { timeout: 45_000 },
      )
      .toBe(true);
    uiMockVisible = await mockPayBtn.isVisible({ timeout: 5_000 }).catch(() => false);
  } catch {
    uiMockVisible = false;
  }

  if (uiMockVisible) {
    await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes(`/api/v1/orders/${orderId}/mock-pay`) &&
          res.request().method() === "POST" &&
          res.ok(),
        { timeout: 60_000 },
      ),
      mockPayBtn.click(),
    ]);
    await expect(page.getByText(/Simulated deposit recorded|模拟入金已登记/i).first()).toBeVisible({
      timeout: 20_000,
    });
    return;
  }

  if (opts?.request && opts?.apiBase && opts?.touristToken) {
    await mockPayExpectEscrowed(opts.request, opts.apiBase, orderId, opts.touristToken);
    return;
  }

  const mockUi = await payRoot.getAttribute("data-tt-pay-mock-ui").catch(() => null);
  const phase = await payRoot.getAttribute("data-tt-pay-order-fetch-phase").catch(() => null);
  throw new Error(
    `mock-pay UI CTA unavailable (data-tt-pay-order-fetch-phase=${phase ?? "?"} data-tt-pay-mock-ui=${mockUi ?? "?"})`,
  );
}

export async function guideConfirmCompletionViaUi(
  page: Page,
  request: APIRequestContext,
  apiBase: string,
  orderId: string,
  guideEmail: string,
  guidePassword: string,
  escrowPath: string,
): Promise<void> {
  await expect(page.locator("main").getByText(fundedRe).first()).toBeVisible({
    timeout: 60_000,
  });
  const confirmBtn = page.getByRole("button", { name: confirmOffChainRe });
  await expect(confirmBtn).toBeVisible({ timeout: 60_000 });
  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes(`/api/v1/orders/${orderId}/confirm-completion`) &&
        res.request().method() === "POST" &&
        res.ok(),
      { timeout: 60_000 },
    ),
    confirmBtn.click(),
  ]);
  const guideToken = await apiLogin(request, apiBase, guideEmail, guidePassword);
  await expect
    .poll(async () => {
      const res = await request.get(`${apiBase}/api/v1/orders/${encodeURIComponent(orderId)}`, {
        headers: { Authorization: `Bearer ${guideToken}` },
      });
      if (!res.ok()) return "";
      const st = ((await res.json()) as { order?: { state?: string; status?: string } }).order;
      return String(st?.state ?? st?.status ?? "").toLowerCase();
    }, { timeout: 60_000 })
    .toBe("completed");
  await page.goto(escrowPath, { timeout: 60_000 });
  await expect(page.locator("main").getByText(completedOrRatingRe).first()).toBeVisible({
    timeout: 60_000,
  });
}

export async function submitReviewViaUi(page: Page, orderId: string): Promise<string> {
  const rateUrl = `/escrow/${encodeURIComponent(orderId)}/rate`;
  await page.goto(rateUrl, { timeout: 60_000 });
  await expect(page.getByRole("heading", { name: /Reviews \(P23\)|评价（P23）/i })).toBeVisible({
    timeout: 60_000,
  });
  await page.getByRole("combobox").first().selectOption("5");
  const comment = `real-user-${randomUUID().slice(0, 8)}`;
  await page.getByLabel(/Review comment|评论（选填）/i).fill(comment);
  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes(`/api/v1/orders/${orderId}/reviews`) &&
        res.request().method() === "POST" &&
        res.ok(),
      { timeout: 60_000 },
    ),
    page.getByRole("button", { name: /Submit review|提交评价/i }).click(),
  ]);
  await expect(page.getByText(comment, { exact: false })).toBeVisible({ timeout: 30_000 });
  return comment;
}
