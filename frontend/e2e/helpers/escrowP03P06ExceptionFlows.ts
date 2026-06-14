/**
 * P03–P06 ① 异常流：冲突预约、重复付款、取消/完成幂等、version_conflict、鉴权门闸
 */
import { randomUUID } from "node:crypto";
import { expect, type APIRequestContext } from "@playwright/test";

import {
  postAcceptOrderExpectOk,
  postConfirmBilateralExpectOk,
  playwrightApiBase,
} from "./bilateralEscrowE2e";
import { seedPublishedOpenItineraryOrder } from "./bookGuideItineraryFirst";
import {
  apiLogin,
  confirmFinalPlanAndExpectSnapshot,
  mockPayExpectEscrowed,
  patchTripDatesExpectOk,
  pickFutureTripDatesYmd,
  type P03P04CorridorSeed,
} from "./escrowP05P06Corridor";
import { registerFreshTouristForCorridor } from "./landingItineraryApiSeed";
import {
  PUBLIC_CATALOG_HANGZHOU_GUIDE_EMAIL,
  PUBLIC_CATALOG_HANGZHOU_GUIDE_ID,
  TRUST_GATE_E2E_PASSWORD,
} from "./publicCatalogHangzhouGuide";

export type JsonWriteHeaders = {
  Authorization?: string;
  "Content-Type": string;
  "Idempotency-Key": string;
};

export function jsonWriteHeaders(bearer?: string): JsonWriteHeaders {
  const h: JsonWriteHeaders = {
    "Content-Type": "application/json",
    "Idempotency-Key": randomUUID(),
  };
  if (bearer) h.Authorization = `Bearer ${bearer}`;
  return h;
}

/** API-only：P04 双边确认完成（无浏览器登录） */
export async function seedP03P04CorridorApiOnly(
  request: APIRequestContext,
  apiBase: string = playwrightApiBase(),
): Promise<P03P04CorridorSeed> {
  const tripDates = pickFutureTripDatesYmd();
  const creds = await registerFreshTouristForCorridor(request, apiBase);
  const touristToken = creds.token;
  const touristEmail = creds.email ?? "";
  expect(touristEmail).not.toBe("");

  const guideId = PUBLIC_CATALOG_HANGZHOU_GUIDE_ID;
  const guideEmail = PUBLIC_CATALOG_HANGZHOU_GUIDE_EMAIL;

  const orderId = await seedPublishedOpenItineraryOrder(request, apiBase, touristToken);
  const escrowPath = `/escrow/${encodeURIComponent(orderId)}`;

  const patchRes = await request.patch(
    `${apiBase}/api/v1/orders/${encodeURIComponent(orderId)}/guide`,
    {
      headers: jsonWriteHeaders(touristToken),
      data: { guide_id: guideId },
    },
  );
  expect(patchRes.ok(), await patchRes.text()).toBeTruthy();

  await patchTripDatesExpectOk(
    request,
    apiBase,
    orderId,
    touristToken,
    tripDates.start,
    tripDates.end,
  );

  const guideToken = await apiLogin(request, apiBase, guideEmail, TRUST_GATE_E2E_PASSWORD);
  await postAcceptOrderExpectOk(request, orderId, guideToken, apiBase);
  await postConfirmBilateralExpectOk(request, orderId, touristToken, apiBase);
  await postConfirmBilateralExpectOk(request, orderId, guideToken, apiBase);

  await expect
    .poll(async () => {
      const fin = await request.get(
        `${apiBase}/api/v1/orders/${encodeURIComponent(orderId)}`,
        { headers: { Authorization: `Bearer ${touristToken}` } },
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

  return {
    orderId,
    touristToken,
    touristEmail,
    guideId,
    guideEmail,
    guideToken,
    escrowPath,
    tripDates,
  };
}

/** P06 escrowed（confirm-final + mock-pay） */
export async function seedP03P06EscrowedApiOnly(
  request: APIRequestContext,
  apiBase: string = playwrightApiBase(),
): Promise<P03P04CorridorSeed> {
  const corridor = await seedP03P04CorridorApiOnly(request, apiBase);
  await confirmFinalPlanAndExpectSnapshot(
    request,
    apiBase,
    corridor.orderId,
    corridor.touristToken,
  );
  await mockPayExpectEscrowed(
    request,
    apiBase,
    corridor.orderId,
    corridor.touristToken,
  );
  return corridor;
}

export async function expectApiErrorBody(
  res: { status: () => number; text: () => Promise<string> },
  status: number,
  errorKey: string,
): Promise<void> {
  expect(res.status()).toBe(status);
  const text = await res.text();
  expect(text).toContain(errorKey);
}

export async function postConfirmFinalPlanRaw(
  request: APIRequestContext,
  apiBase: string,
  orderId: string,
  bearer: string,
  expectedVersion: number,
) {
  return request.post(
    `${apiBase}/api/v1/orders/${encodeURIComponent(orderId)}/confirm-final-plan`,
    {
      headers: jsonWriteHeaders(bearer),
      data: { expected_version: expectedVersion },
    },
  );
}
