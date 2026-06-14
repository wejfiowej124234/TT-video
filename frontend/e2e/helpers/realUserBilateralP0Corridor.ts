/**
 * REAL-USER-BILATERAL-P0 — 真实用户账号 · API 建单至 pending_bilateral · 隔离重放双边 UI
 * ① local · 禁止 seed / trust-gate
 */
import { randomUUID } from "node:crypto";
import { expect, type APIRequestContext, type Page } from "@playwright/test";

import {
  apiLoginReturnCredentials,
  gotoWithBearerSession,
  injectBearerSessionInPage,
  type BearerSessionCredentials,
} from "./apiSession";
import {
  clickBilateralConfirmInExperience,
  expectBilateralAggregateStatus,
} from "./bilateralExperienceL5Corridor";
import { postAcceptOrderExpectOk, postConfirmBilateralExpectOk } from "./bilateralEscrowE2e";
import { seedPublishedOpenItineraryOrder } from "./bookGuideItineraryFirst";
import { patchBindSeedGuideToOrder } from "./guideWorkbenchInboxCorridor";
import { uiLogout } from "./headerUserMenu";
import {
  waitOrderByIdGet200,
} from "./p0RealApiWaits";
import {
  assertNotSeedEmail,
  makeRealUserPair,
  REAL_USER_PASSWORD,
  type RealUserPair,
} from "./realUserAcceptanceCorridor";

export type RealUserBilateralBaseContext = {
  pair: RealUserPair;
  touristCreds: BearerSessionCredentials;
  /** API 段 · 第一向导档期 */
  guideCreds: BearerSessionCredentials;
  guideRowId: string;
  /** UI 重放 · 第二向导（API 段占用 guideRowId 后避免 guide_has_active_order） */
  guideUiCreds: BearerSessionCredentials;
  guideUiRowId: string;
};

export type RealUserBilateralOrderContext = RealUserBilateralBaseContext & {
  orderId: string;
  escrowPath: string;
  /** 本单接单/双边确认的向导凭据（可能与 base.guideCreds 不同） */
  orderGuideCreds: BearerSessionCredentials;
  orderGuideRowId: string;
};

export type SeedRealUserBilateralOrderOptions = {
  guideRowId?: string;
  guideCredsForAccept?: BearerSessionCredentials;
};

export async function registerFreshAcceptanceAccountViaApi(
  request: APIRequestContext,
  apiBase: string,
  email: string,
  password: string,
): Promise<BearerSessionCredentials> {
  assertNotSeedEmail(email);
  const base = apiBase.replace(/\/$/, "");
  const sendRes = await request.post(`${base}/auth/register/send-verification-code`, {
    headers: { "Content-Type": "application/json" },
    data: { email },
  });
  expect(sendRes.ok(), `send-verification-code failed: ${await sendRes.text()}`).toBeTruthy();
  const sendJson = (await sendRes.json()) as { registration_verification_dev_code?: string };
  const code = String(sendJson.registration_verification_dev_code ?? "").trim();
  expect(code.length, "missing registration_verification_dev_code").toBe(6);

  const regRes = await request.post(`${base}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: {
      email,
      password,
      verification_code: code,
      nickname: `RUA ${Date.now().toString(36)}`,
    },
  });
  expect(regRes.ok(), `auth/register failed: ${await regRes.text()}`).toBeTruthy();

  const creds = await apiLoginReturnCredentials(request, base, email, password);
  expect(creds?.token, "login after register returned no token").toBeTruthy();
  return creds!;
}

export async function seedRealUserBilateralBaseViaApi(
  request: APIRequestContext,
  apiBase: string,
): Promise<RealUserBilateralBaseContext> {
  const pair = makeRealUserPair();
  const touristCreds = await registerFreshAcceptanceAccountViaApi(
    request,
    apiBase,
    pair.touristEmail,
    pair.touristPassword,
  );
  const guideCreds = await registerFreshAcceptanceAccountViaApi(
    request,
    apiBase,
    pair.guideEmail,
    pair.guidePassword,
  );

  const base = apiBase.replace(/\/$/, "");
  const guideRes = await request.post(`${base}/api/v1/guides`, {
    headers: {
      Authorization: `Bearer ${guideCreds.token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": randomUUID(),
    },
    data: {
      city: "北京",
      country_code: "CN",
      languages: ["zh"],
      service_types: ["walking"],
      bio: `real-user-bilateral-p0 ${Date.now().toString(36)}`,
    },
  });
  expect(guideRes.ok(), `POST /guides failed: ${await guideRes.text()}`).toBeTruthy();
  const guideBody = (await guideRes.json()) as { guide?: { id?: string } };
  const guideRowId = String(guideBody.guide?.id ?? "").trim();
  expect(guideRowId.length).toBeGreaterThan(10);

  const stakeRes = await request.post(`${base}/api/v1/guides/${guideRowId}/stake`, {
    headers: {
      Authorization: `Bearer ${guideCreds.token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": randomUUID(),
    },
    data: { amount: "1" },
  });
  expect(stakeRes.ok(), `POST stake failed: ${await stakeRes.text()}`).toBeTruthy();

  const guideUiEmail = `real-guide-ui-${pair.suffix}@traveltrust.acceptance`;
  const guideUiCreds = await registerFreshAcceptanceAccountViaApi(
    request,
    apiBase,
    guideUiEmail,
    pair.guidePassword,
  );
  const guideUiRes = await request.post(`${base}/api/v1/guides`, {
    headers: {
      Authorization: `Bearer ${guideUiCreds.token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": randomUUID(),
    },
    data: {
      city: "北京",
      country_code: "CN",
      languages: ["zh"],
      service_types: ["walking"],
      bio: `real-user-bilateral-p0-ui ${Date.now().toString(36)}`,
    },
  });
  expect(guideUiRes.ok(), `POST /guides (ui) failed: ${await guideUiRes.text()}`).toBeTruthy();
  const guideUiBody = (await guideUiRes.json()) as { guide?: { id?: string } };
  const guideUiRowId = String(guideUiBody.guide?.id ?? "").trim();
  expect(guideUiRowId.length).toBeGreaterThan(10);

  const stakeUiRes = await request.post(`${base}/api/v1/guides/${guideUiRowId}/stake`, {
    headers: {
      Authorization: `Bearer ${guideUiCreds.token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": randomUUID(),
    },
    data: { amount: "1" },
  });
  expect(stakeUiRes.ok(), `POST stake (ui) failed: ${await stakeUiRes.text()}`).toBeTruthy();

  return { pair, touristCreds, guideCreds, guideRowId, guideUiCreds, guideUiRowId };
}

export async function seedRealUserOrderAwaitingBilateralViaApi(
  request: APIRequestContext,
  apiBase: string,
  base: RealUserBilateralBaseContext,
  options?: SeedRealUserBilateralOrderOptions,
): Promise<RealUserBilateralOrderContext> {
  const orderGuideRowId = options?.guideRowId ?? base.guideRowId;
  const orderGuideCreds = options?.guideCredsForAccept ?? base.guideCreds;
  const orderId = await seedPublishedOpenItineraryOrder(request, apiBase, base.touristCreds.token);
  await patchBindSeedGuideToOrder(
    request,
    apiBase,
    base.touristCreds.token,
    orderId,
    orderGuideRowId,
  );
  await postAcceptOrderExpectOk(request, orderId, orderGuideCreds.token, apiBase);

  await expect
    .poll(async () => {
      const res = await request.get(
        `${apiBase.replace(/\/$/, "")}/api/v1/orders/${encodeURIComponent(orderId)}`,
        { headers: { Authorization: `Bearer ${base.touristCreds.token}` } },
      );
      if (!res.ok()) return false;
      const body = (await res.json()) as {
        order?: { state?: string; sub_status?: string };
      };
      return (
        String(body.order?.state ?? "").toLowerCase() === "accepted" &&
        String(body.order?.sub_status ?? "").includes("bilateral")
      );
    }, { timeout: 60_000 })
    .toBe(true);

  return {
    ...base,
    orderId,
    escrowPath: `/escrow/${encodeURIComponent(orderId)}`,
    orderGuideCreds,
    orderGuideRowId,
  };
}

export async function assertBothConfirmBilateralApi200(
  request: APIRequestContext,
  apiBase: string,
  ctx: RealUserBilateralOrderContext,
): Promise<void> {
  await postConfirmBilateralExpectOk(request, ctx.orderId, ctx.touristCreds.token, apiBase);
  await postConfirmBilateralExpectOk(request, ctx.orderId, ctx.orderGuideCreds.token, apiBase);

  const res = await request.get(
    `${apiBase.replace(/\/$/, "")}/api/v1/orders/${encodeURIComponent(ctx.orderId)}`,
    { headers: { Authorization: `Bearer ${ctx.touristCreds.token}` } },
  );
  expect(res.ok(), await res.text()).toBeTruthy();
  const body = (await res.json()) as {
    order?: { tourist_confirmed?: boolean; guide_confirmed?: boolean; sub_status?: string };
  };
  expect(body.order?.tourist_confirmed).toBe(true);
  expect(body.order?.guide_confirmed).toBe(true);
  expect(String(body.order?.sub_status ?? "")).toMatch(/confirmed/i);
}

export async function loginRealUserEscrowViaApiSession(
  page: Page,
  creds: BearerSessionCredentials,
  escrowPath: string,
): Promise<void> {
  const orderId = decodeURIComponent(escrowPath.match(/\/escrow\/([^/?#]+)/)?.[1] ?? "");
  expect(orderId.length).toBeGreaterThan(10);

  const wOrder = waitOrderByIdGet200(page, orderId);
  await gotoWithBearerSession(page, escrowPath, creds);
  try {
    await wOrder;
  } catch (firstErr) {
    await injectBearerSessionInPage(page, creds);
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("traveltrust:auth-change"));
    });
    const retryBtn = page.getByRole("button", { name: /Retry|重试|common_retry/i });
    if (await retryBtn.isVisible().catch(() => false)) {
      const wOrderRetry = waitOrderByIdGet200(page, orderId);
      await retryBtn.click();
      await wOrderRetry;
    } else {
      const wOrderRetry = waitOrderByIdGet200(page, orderId);
      await page.reload({ waitUntil: "domcontentloaded", timeout: 120_000 });
      await injectBearerSessionInPage(page, creds);
      await wOrderRetry;
    }
    if (firstErr instanceof Error) {
      // surfaced below if protocol zone still missing
    }
  }

  await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
    timeout: 120_000,
  });
  await expect(page.locator('[data-zone="order-protocol"]')).toBeVisible({ timeout: 120_000 });
  await expect(page.locator('[data-tt-bilateral-experience-l5="1"]')).toBeVisible({
    timeout: 120_000,
  });
}

/** REAL-USER-BILATERAL-P0 · UI 双角色（API session 登录，跳过 UI 注册/login 长跑） */
export async function runRealUserBilateralUiBothSides(
  page: Page,
  ctx: RealUserBilateralOrderContext,
): Promise<void> {
  await loginRealUserEscrowViaApiSession(page, ctx.touristCreds, ctx.escrowPath);
  await expectBilateralAggregateStatus(page, "pending_self");
  await clickBilateralConfirmInExperience(page);
  await expectBilateralAggregateStatus(page, "waiting_other");
  await uiLogout(page);

  await loginRealUserEscrowViaApiSession(page, ctx.orderGuideCreds, ctx.escrowPath);
  await expectBilateralAggregateStatus(page, "pending_self");
  await clickBilateralConfirmInExperience(page);
  await expectBilateralAggregateStatus(page, "both_confirmed");
  await uiLogout(page);
}

export { REAL_USER_PASSWORD };
