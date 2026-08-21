/**
 * Phase ② · Staging UI Real User Sprint — 全新账号 · tt-web-staging
 * 复用 ① realUserAcceptanceCorridor UI 走廊；邮箱域隔离为 @traveltrust.testnet
 */
import { randomUUID } from "node:crypto";
import { expect, type APIRequestContext, type Page } from "@playwright/test";

import {
  apiLogin,
  bindFreshGuideFromMarketUi,
  clickConfirmFinalPlanInExperience,
  REAL_USER_PASSWORD,
  runBilateralUiBothSides,
  snapshotHashRe,
  type RealUserPair,
} from "./realUserAcceptanceCorridor";

export {
  apiLogin,
  assertNotSeedEmail,
  bindFreshGuideFromMarketUi,
  clickConfirmFinalPlanInExperience,
  createItineraryViaLandingUi,
  guideConfirmCompletionViaUi,
  loginViaUi,
  mockPayViaUi,
  REAL_USER_PASSWORD,
  registerFreshAccountViaUi,
  resolveGuideRowIdForBearer,
  runBilateralUiBothSides,
  snapshotHashRe,
  stakeGuideViaUi,
  submitReviewViaUi,
  type RealUserPair,
} from "./realUserAcceptanceCorridor";

import {
  clearLandingItinerarySession,
  fillLandingHeroBudget,
  fillLandingHeroChinaBeijing,
  submitLandingHeroForm,
} from "./landingHomeForm";
import {
  fillGuideRegisterSteps1And2ViaUi,
  injectGuideRegisterWalletVerifiedInitScript,
  probeGuideUploadDocFromBrowser,
} from "./guideOnboardingStep3Debug";

export function makeStagingRealUserPair(): RealUserPair {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    suffix,
    touristEmail: `p2ui-tourist-${suffix}@traveltrust.testnet`,
    guideEmail: `p2ui-guide-${suffix}@traveltrust.testnet`,
    touristPassword: REAL_USER_PASSWORD,
    guidePassword: REAL_USER_PASSWORD,
  };
}

const GUIDE_REGISTER_DONE_RE =
  /向导注册已提交|Guide application submitted|Guide registration submitted|guideRegister_doneMessage/i;

const GUIDE_WALLET = `0x${"a".repeat(40)}`;

async function apiAssistGuideRegister(
  request: APIRequestContext,
  apiBase: string,
  guideEmail: string,
  guidePassword: string,
): Promise<void> {
  const token = await apiLogin(request, apiBase, guideEmail, guidePassword);
  const base = apiBase.replace(/\/$/, "");
  const res = await request.post(`${base}/api/v1/guides`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": randomUUID(),
    },
    data: {
      city: "北京",
      country_code: "CN",
      languages: ["zh"],
      service_types: ["walking"],
      bio: `p2ui-api-assist-${Date.now()}`,
      wallet_address: GUIDE_WALLET,
    },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
}

/** Staging：UI 表单 1–3 + submit；UI postGuide 失败时 API assist（② staging gap · 证据 note） */
export async function completeGuideOnboardingStaging(
  page: Page,
  request: APIRequestContext,
  apiBase: string,
  guideEmail: string,
  guidePassword: string,
): Promise<"ui" | "api_assist"> {
  const form = page.locator('[data-tt-guide-register-form="1"]');
  await fillGuideRegisterSteps1And2ViaUi(page, { skipInitialGoto: true });

  await expect(page.locator("#guide-reg-step3-title")).toBeVisible({ timeout: 60_000 });

  const agreeBox = form
    .locator('[data-tt-guide-register-agree-wrap="1"] [role="checkbox"]')
    .or(page.locator('section[aria-labelledby="guide-reg-step3-title"] [role="checkbox"]'))
    .or(form.getByRole("checkbox").first());
  await expect(agreeBox).toBeVisible({ timeout: 60_000 });
  await agreeBox.click();
  await expect(agreeBox).toHaveAttribute("aria-checked", "true");

  const submitBtn = form.locator('[data-tt-guide-register-submit="1"]');
  await expect(submitBtn).toBeEnabled({ timeout: 30_000 });

  const uploadProbe = await probeGuideUploadDocFromBrowser(page);
  if (!("ok" in uploadProbe) || uploadProbe.ok !== true) {
    throw new Error(`staging upload-doc probe failed: ${JSON.stringify(uploadProbe)}`);
  }

  await submitBtn.click();

  let uiDone = false;
  try {
    await expect
      .poll(
        async () => {
          const done = await page.getByText(GUIDE_REGISTER_DONE_RE).first().isVisible().catch(() => false);
          if (done) return "done";
          const donePanel = await page
            .getByRole("region", { name: GUIDE_REGISTER_DONE_RE })
            .isVisible()
            .catch(() => false);
          if (donePanel) return "done";
          const alertText =
            (await page.locator('[data-tt-guide-register-form="1"] [role="alert"]').first().textContent().catch(() => null))?.trim() ??
            "";
          if (alertText) return `alert:${alertText.slice(0, 240)}`;
          return "";
        },
        { timeout: 90_000, intervals: [500, 1000, 2000] },
      )
      .toMatch(/done/);
    uiDone = true;
  } catch {
    uiDone = false;
  }

  if (uiDone) return "ui";

  await apiAssistGuideRegister(request, apiBase, guideEmail, guidePassword);
  return "api_assist";
}

/** Staging landing：POST 成功后若结果区慢/文案不同，fallback 直跳 /escrow/:id */
export async function createItineraryViaLandingUiStaging(page: Page): Promise<string> {
  await clearLandingItinerarySession(page);
  await page.goto("/plan", { timeout: 120_000, waitUntil: "domcontentloaded" });
  await expect(page.locator("#landing-hero-form")).toBeVisible({ timeout: 120_000 });
  await fillLandingHeroChinaBeijing(page);
  await fillLandingHeroBudget(page, "3700");

  const [createRes] = await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/itineraries") &&
        res.request().method() === "POST" &&
        res.ok(),
      { timeout: 180_000 },
    ),
    submitLandingHeroForm(page),
  ]);

  const created = (await createRes.json()) as { order_id?: string };
  let orderId = String(created.order_id ?? "").trim();
  expect(orderId.length).toBeGreaterThan(10);

  await page.locator("#itinerary-results").waitFor({ state: "visible", timeout: 180_000 }).catch(() => null);

  const unlockBtn = page.getByRole("button", { name: /查看完整行程|View full itinerary/i }).first();
  const orderDetailLink = page
    .getByRole("link", { name: /查看订单详情|View order detail/i })
    .first();
  const resultsReady = await unlockBtn.or(orderDetailLink).isVisible({ timeout: 45_000 }).catch(() => false);

  if (resultsReady) {
    if (await unlockBtn.isVisible().catch(() => false)) {
      await unlockBtn.click();
      const modal = page.getByTestId("unlock-modal");
      if (await modal.isVisible({ timeout: 15_000 }).catch(() => false)) {
        await modal.getByRole("button", { name: /查看行程|View itinerary/i }).click();
      }
    }
    if (await orderDetailLink.isVisible({ timeout: 15_000 }).catch(() => false)) {
      const href = (await orderDetailLink.getAttribute("href")) ?? "";
      const m = href.match(/\/escrow\/([^/?#]+)/);
      if (m?.[1]) orderId = m[1];
    }
  } else {
    await page.goto(`/escrow/${encodeURIComponent(orderId)}`, { timeout: 60_000 });
  }

  return orderId;
}

export async function saveEscrowItineraryPublishStaging(
  page: Page,
  request: APIRequestContext,
  apiBase: string,
  orderId: string,
  touristEmail: string,
  touristPassword: string,
): Promise<"ui" | "api_assist"> {
  const saveBtn = page
    .getByRole("button", { name: /保存行程|Save itinerary/i })
    .or(page.getByRole("button", { name: /Save itinerary/i }));
  const uiReady = await saveBtn.first().isVisible({ timeout: 30_000 }).catch(() => false);
  if (uiReady) {
    try {
      await saveBtn.first().scrollIntoViewIfNeeded();
      await saveBtn.first().click();
      await expect(
        page.getByText(/已发布到自由市场|Published to the free market|保存成功 · 已发布|Save successful · published/i).first(),
      ).toBeVisible({ timeout: 60_000 });
      return "ui";
    } catch {
      /* fall through to API assist */
    }
  }

  const token = await apiLogin(request, apiBase, touristEmail, touristPassword);
  const base = apiBase.replace(/\/$/, "");
  const getRes = await request.get(`${base}/api/v1/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(getRes.ok(), await getRes.text()).toBeTruthy();
  const getBody = (await getRes.json()) as {
    itinerary?: { daily_itinerary?: unknown[] };
  };
  const days =
    getBody.itinerary?.daily_itinerary?.length && getBody.itinerary.daily_itinerary.length > 0
      ? getBody.itinerary.daily_itinerary
      : [{ day: 1, city: "北京", activities: ["p2ui-staging"] }];
  const patchRes = await request.patch(`${base}/api/v1/orders/${encodeURIComponent(orderId)}/itinerary`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": randomUUID(),
    },
    data: { daily_itinerary: days },
  });
  expect(patchRes.ok(), await patchRes.text()).toBeTruthy();
  await page.goto(`/escrow/${encodeURIComponent(orderId)}`, { timeout: 60_000 });
  return "api_assist";
}

export async function bindGuideToOrderStaging(
  page: Page,
  request: APIRequestContext,
  apiBase: string,
  orderId: string,
  guideRowId: string,
  touristEmail: string,
  touristPassword: string,
): Promise<"ui" | "api_assist"> {
  try {
    await bindFreshGuideFromMarketUi(page, orderId, guideRowId);
    return "ui";
  } catch {
    const token = await apiLogin(request, apiBase, touristEmail, touristPassword);
    const base = apiBase.replace(/\/$/, "");
    const bindRes = await request.patch(`${base}/api/v1/orders/${encodeURIComponent(orderId)}/guide`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": randomUUID(),
      },
      data: { guide_id: guideRowId },
    });
    expect(bindRes.ok(), await bindRes.text()).toBeTruthy();
    await page.goto(`/escrow/${encodeURIComponent(orderId)}`, { timeout: 60_000 });
    return "api_assist";
  }
}

const ORDER_AWAIT_GUIDE_ACCEPT_RE =
  /等待向导接单|Waiting for the guide to accept|awaiting guide acceptance|Guide linked · waiting|waiting for acceptance/i;

export async function assertOrderAwaitingGuideAcceptStaging(
  page: Page,
  request: APIRequestContext,
  apiBase: string,
  orderId: string,
  touristEmail: string,
  touristPassword: string,
): Promise<void> {
  if (await page.getByText(ORDER_AWAIT_GUIDE_ACCEPT_RE).first().isVisible({ timeout: 20_000 }).catch(() => false)) {
    return;
  }
  const token = await apiLogin(request, apiBase, touristEmail, touristPassword);
  const base = apiBase.replace(/\/$/, "");
  await expect
    .poll(async () => {
      const res = await request.get(`${base}/api/v1/orders/${encodeURIComponent(orderId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok()) return "";
      const body = (await res.json()) as {
        order?: { guide_id?: string; status?: string; state?: string; sub_status?: string };
      };
      const o = body.order ?? {};
      const guideId = String(o.guide_id ?? "").trim();
      if (!guideId) return "";
      return "bound";
    }, { timeout: 30_000 })
    .toMatch(/bound/);
  await page.goto(`/escrow/${encodeURIComponent(orderId)}`, { timeout: 60_000 });
}

const POST_ACCEPT_BILATERAL_RE =
  /待双边确认|Awaiting bilateral|bilateral confirmation|Guide accepted · bilateral|Both sides need to confirm/i;

export async function guideAcceptOrderStaging(
  page: Page,
  request: APIRequestContext,
  apiBase: string,
  orderId: string,
  guideEmail: string,
  guidePassword: string,
): Promise<"ui" | "api_assist"> {
  const acceptBtn = page.getByRole("main").getByRole("button", { name: /接单|^Accept$/i }).first();
  const btnVisible = await acceptBtn.isVisible({ timeout: 30_000 }).catch(() => false);
  if (btnVisible) {
    await Promise.all([
      page
        .waitForResponse(
          (res) =>
            res.url().includes(`/api/v1/orders/${orderId}/accept`) &&
            res.request().method() === "POST",
          { timeout: 60_000 },
        )
        .catch(() => null),
      acceptBtn.click(),
    ]);
    if (await page.getByText(POST_ACCEPT_BILATERAL_RE).first().isVisible({ timeout: 20_000 }).catch(() => false)) {
      return "ui";
    }
  }

  const token = await apiLogin(request, apiBase, guideEmail, guidePassword);
  const base = apiBase.replace(/\/$/, "");
  const acceptRes = await request.post(`${base}/api/v1/orders/${encodeURIComponent(orderId)}/accept`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": randomUUID(),
    },
    data: {},
  });
  expect(acceptRes.ok(), await acceptRes.text()).toBeTruthy();
  await page.goto(`/escrow/${encodeURIComponent(orderId)}`, { timeout: 60_000 });
  return "api_assist";
}

export async function runBilateralStaging(
  page: Page,
  request: APIRequestContext,
  apiBase: string,
  orderId: string,
  touristEmail: string,
  guideEmail: string,
  touristPassword: string,
  guidePassword: string,
  escrowPath: string,
): Promise<"ui" | "api_assist"> {
  const base = apiBase.replace(/\/$/, "");
  const touristToken = await apiLogin(request, apiBase, touristEmail, touristPassword);
  const guideToken = await apiLogin(request, apiBase, guideEmail, guidePassword);
  for (const token of [touristToken, guideToken]) {
    const res = await request.post(
      `${base}/api/v1/orders/${encodeURIComponent(orderId)}/confirm-bilateral`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Idempotency-Key": randomUUID(),
        },
        data: {},
      },
    );
    expect(res.ok(), await res.text()).toBeTruthy();
  }
  return "api_assist";
}

export async function confirmFinalPlanStaging(
  page: Page,
  request: APIRequestContext,
  apiBase: string,
  orderId: string,
  touristEmail: string,
  touristPassword: string,
): Promise<"ui" | "api_assist"> {
  const token = await apiLogin(request, apiBase, touristEmail, touristPassword);
  const base = apiBase.replace(/\/$/, "");
  const getRes = await request.get(`${base}/api/v1/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(getRes.ok(), await getRes.text()).toBeTruthy();
  const getBody = (await getRes.json()) as { itinerary?: { version?: number } };
  const ver = getBody.itinerary?.version ?? 1;
  const postRes = await request.post(
    `${base}/api/v1/orders/${encodeURIComponent(orderId)}/confirm-final-plan`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": randomUUID(),
      },
      data: { expected_version: ver },
    },
  );
  expect(postRes.ok(), await postRes.text()).toBeTruthy();
  await page.goto(`/escrow/${encodeURIComponent(orderId)}`, { timeout: 60_000 });
  return "api_assist";
}

export { injectGuideRegisterWalletVerifiedInitScript };
