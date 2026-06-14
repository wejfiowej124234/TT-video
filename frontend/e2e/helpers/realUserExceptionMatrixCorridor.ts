/**
 * ① Real User Exception Matrix — 全新 @traveltrust.acceptance 账号 · API 走廊
 * 禁止 seed / trust-gate / fixture 账号
 */
import { randomUUID } from "node:crypto";
import { expect, type APIRequestContext } from "@playwright/test";

import { postAcceptOrderExpectOk, postConfirmBilateralExpectOk } from "./bilateralEscrowE2e";
import { seedPublishedOpenItineraryOrder } from "./bookGuideItineraryFirst";
import {
  confirmFinalPlanAndExpectSnapshot,
  mockPayExpectEscrowed,
  patchTripDatesExpectOk,
  pickFutureTripDatesYmd,
} from "./escrowP05P06Corridor";
import {
  expectApiErrorBody,
  jsonWriteHeaders,
  postConfirmFinalPlanRaw,
} from "./escrowP03P06ExceptionFlows";
import { patchBindSeedGuideToOrder } from "./guideWorkbenchInboxCorridor";
import {
  assertNotSeedEmail,
  makeRealUserPair,
  REAL_USER_PASSWORD,
  type RealUserPair,
} from "./realUserAcceptanceCorridor";
import { registerFreshAcceptanceAccountViaApi } from "./realUserBilateralP0Corridor";

export type RealUserExceptionCorridor = {
  pair: RealUserPair;
  touristToken: string;
  guideToken: string;
  guideRowId: string;
  orderId: string;
  escrowPath: string;
  tripDates: { start: string; end: string };
};

export { expectApiErrorBody, jsonWriteHeaders, postConfirmFinalPlanRaw, REAL_USER_PASSWORD };

export function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function shortTtlBufferMs(): number {
  const accept = Number(process.env.P3_ACCEPT_TTL_SECS ?? "86400");
  const payment = Number(process.env.P3_PAYMENT_TTL_SECS ?? "1800");
  const minSec = Math.min(accept, payment);
  return Math.max(1500, minSec * 1000 + 500);
}

async function createStakedGuideViaApi(
  request: APIRequestContext,
  apiBase: string,
  email: string,
  password: string,
  bioTag: string,
): Promise<{ token: string; guideRowId: string }> {
  assertNotSeedEmail(email);
  const token = (await registerFreshAcceptanceAccountViaApi(request, apiBase, email, password)).token;
  const base = apiBase.replace(/\/$/, "");
  const guideRes = await request.post(`${base}/api/v1/guides`, {
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
      bio: `${bioTag} ${Date.now().toString(36)}`,
    },
  });
  expect(guideRes.ok(), `POST /guides failed: ${await guideRes.text()}`).toBeTruthy();
  const guideBody = (await guideRes.json()) as { guide?: { id?: string } };
  const guideRowId = String(guideBody.guide?.id ?? "").trim();
  expect(guideRowId.length).toBeGreaterThan(10);

  const stakeRes = await request.post(`${base}/api/v1/guides/${guideRowId}/stake`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": randomUUID(),
    },
    data: { amount: "1" },
  });
  expect(stakeRes.ok(), `POST stake failed: ${await stakeRes.text()}`).toBeTruthy();
  return { token, guideRowId };
}

export async function seedRealUserExceptionBaseViaApi(
  request: APIRequestContext,
  apiBase: string,
): Promise<Omit<RealUserExceptionCorridor, "orderId" | "escrowPath">> {
  const pair = makeRealUserPair();
  const tripDates = pickFutureTripDatesYmd();
  const touristCreds = await registerFreshAcceptanceAccountViaApi(
    request,
    apiBase,
    pair.touristEmail,
    pair.touristPassword,
  );
  const { token: guideToken, guideRowId } = await createStakedGuideViaApi(
    request,
    apiBase,
    pair.guideEmail,
    pair.guidePassword,
    "real-user-exc-matrix",
  );
  return {
    pair,
    touristToken: touristCreds.token,
    guideToken,
    guideRowId,
    tripDates,
  };
}

export async function registerExtraRealUserGuideViaApi(
  request: APIRequestContext,
  apiBase: string,
  suffix: string,
  password: string = REAL_USER_PASSWORD,
): Promise<{ email: string; token: string; guideRowId: string }> {
  const email = `real-guide-other-${suffix}@traveltrust.acceptance`;
  const { token, guideRowId } = await createStakedGuideViaApi(
    request,
    apiBase,
    email,
    password,
    "real-user-exc-other-guide",
  );
  return { email, token, guideRowId };
}

export async function registerExtraRealUserTouristViaApi(
  request: APIRequestContext,
  apiBase: string,
): Promise<{ email: string; token: string }> {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `real-tourist-outsider-${suffix}@traveltrust.acceptance`;
  const creds = await registerFreshAcceptanceAccountViaApi(
    request,
    apiBase,
    email,
    REAL_USER_PASSWORD,
  );
  return { email, token: creds.token };
}

export async function seedRealUserOpenOrderBoundViaApi(
  request: APIRequestContext,
  apiBase: string,
): Promise<RealUserExceptionCorridor> {
  const base = await seedRealUserExceptionBaseViaApi(request, apiBase);
  const orderId = await seedPublishedOpenItineraryOrder(request, apiBase, base.touristToken);
  await patchBindSeedGuideToOrder(
    request,
    apiBase,
    base.touristToken,
    orderId,
    base.guideRowId,
  );
  await patchTripDatesExpectOk(
    request,
    apiBase,
    orderId,
    base.touristToken,
    base.tripDates.start,
    base.tripDates.end,
  );
  return {
    ...base,
    orderId,
    escrowPath: `/escrow/${encodeURIComponent(orderId)}`,
  };
}

export async function seedRealUserP04CorridorApiOnly(
  request: APIRequestContext,
  apiBase: string,
): Promise<RealUserExceptionCorridor> {
  const corridor = await seedRealUserOpenOrderBoundViaApi(request, apiBase);
  await postAcceptOrderExpectOk(request, corridor.orderId, corridor.guideToken, apiBase);
  await postConfirmBilateralExpectOk(request, corridor.orderId, corridor.touristToken, apiBase);
  await postConfirmBilateralExpectOk(request, corridor.orderId, corridor.guideToken, apiBase);

  await expect
    .poll(async () => {
      const fin = await request.get(
        `${apiBase.replace(/\/$/, "")}/api/v1/orders/${encodeURIComponent(corridor.orderId)}`,
        { headers: { Authorization: `Bearer ${corridor.touristToken}` } },
      );
      if (!fin.ok()) return false;
      const body = (await fin.json()) as {
        order?: { state?: string; sub_status?: string };
      };
      return (
        String(body.order?.state ?? "").toLowerCase() === "accepted" &&
        body.order?.sub_status === "confirmed"
      );
    }, { timeout: 30_000 })
    .toBe(true);

  return corridor;
}

export async function seedRealUserEscrowedViaApi(
  request: APIRequestContext,
  apiBase: string,
): Promise<RealUserExceptionCorridor> {
  const corridor = await seedRealUserP04CorridorApiOnly(request, apiBase);
  await confirmFinalPlanAndExpectSnapshot(
    request,
    apiBase,
    corridor.orderId,
    corridor.touristToken,
  );
  await mockPayExpectEscrowed(request, apiBase, corridor.orderId, corridor.touristToken);
  return corridor;
}

export async function seedRealUserCompletedViaApi(
  request: APIRequestContext,
  apiBase: string,
): Promise<RealUserExceptionCorridor> {
  const corridor = await seedRealUserEscrowedViaApi(request, apiBase);
  const url = `${apiBase.replace(/\/$/, "")}/api/v1/orders/${encodeURIComponent(corridor.orderId)}/confirm-completion`;
  const done = await request.post(url, {
    headers: jsonWriteHeaders(corridor.guideToken),
    data: {},
  });
  expect(done.ok(), await done.text()).toBeTruthy();
  return corridor;
}

export async function postReviewRaw(
  request: APIRequestContext,
  apiBase: string,
  orderId: string,
  bearer: string,
  body: { score: number; comment?: string },
) {
  return request.post(
    `${apiBase.replace(/\/$/, "")}/api/v1/orders/${encodeURIComponent(orderId)}/reviews`,
    {
      headers: jsonWriteHeaders(bearer),
      data: body,
    },
  );
}
