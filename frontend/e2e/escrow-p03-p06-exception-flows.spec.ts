/**
 * ① 本地 · P03–P06 + GD/P06 异常流验收
 * 冲突预约阻断 · 重复付款阻断 · 取消/完成幂等 · version_conflict 重试 · 未登录/错角色门闸
 */
import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";

import { postAcceptOrderExpectOk } from "./helpers/bilateralEscrowE2e";
import { seedPublishedOpenItineraryOrder } from "./helpers/bookGuideItineraryFirst";
import {
  apiLogin,
  patchTripDatesExpectOk,
  pickFutureTripDatesYmd,
} from "./helpers/escrowP05P06Corridor";
import {
  expectApiErrorBody,
  jsonWriteHeaders,
  postConfirmFinalPlanRaw,
  seedP03P04CorridorApiOnly,
  seedP03P06EscrowedApiOnly,
} from "./helpers/escrowP03P06ExceptionFlows";
import { registerFreshTouristForCorridor } from "./helpers/landingItineraryApiSeed";
import {
  PUBLIC_CATALOG_HANGZHOU_GUIDE_EMAIL,
  PUBLIC_CATALOG_HANGZHOU_GUIDE_ID,
  releasePublicCatalogHangzhouGuideSlotIfBlocked,
  TRUST_GATE_E2E_PASSWORD,
} from "./helpers/publicCatalogHangzhouGuide";
import { releaseSeedGuideSlotIfBlocked } from "./helpers/releaseSeedGuideSlot";
import { skipUnlessOrderMockPayAvailable } from "./helpers/skipUnlessOrderMockPayAvailable";
import { seedTrustGateE2eFixtures } from "./helpers/trustGateE2eFixtures";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

test.describe.configure({ mode: "serial" });

test.describe("P03–P06 exception flows (① local)", {
  tag: "@e2e-chain-off-mock-pay",
}, () => {
  test.beforeEach(async ({ request }) => {
    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) test.skip(true, `API 不可用：${API_HEALTH}`);
    await skipUnlessOrderMockPayAvailable(request, API_BASE);
    await seedTrustGateE2eFixtures(request, API_BASE);
    await releaseSeedGuideSlotIfBlocked(request, API_BASE);
    await releasePublicCatalogHangzhouGuideSlotIfBlocked(request, API_BASE);
  });

  test("冲突预约：第二单绑同一向导 → guide_has_active_order", async ({ request }) => {
    const blocked = await seedP03P04CorridorApiOnly(request, API_BASE);
    const creds2 = await registerFreshTouristForCorridor(request, API_BASE);
    const order2 = await seedPublishedOpenItineraryOrder(request, API_BASE, creds2.token);

    const patch = await request.patch(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(order2)}/guide`,
      {
        headers: jsonWriteHeaders(creds2.token),
        data: { guide_id: blocked.guideId },
      },
    );
    await expectApiErrorBody(patch, 409, "guide_has_active_order");
  });

  test("冲突预约：重叠 trip-dates → schedule_conflict", async ({ request }) => {
    const tripDates = pickFutureTripDatesYmd();
    const guideId = PUBLIC_CATALOG_HANGZHOU_GUIDE_ID;
    const guideToken = await apiLogin(
      request,
      API_BASE,
      PUBLIC_CATALOG_HANGZHOU_GUIDE_EMAIL,
      TRUST_GATE_E2E_PASSWORD,
    );

    const creds1 = await registerFreshTouristForCorridor(request, API_BASE);
    const order1 = await seedPublishedOpenItineraryOrder(request, API_BASE, creds1.token);
    const patch1 = await request.patch(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(order1)}/guide`,
      { headers: jsonWriteHeaders(creds1.token), data: { guide_id: guideId } },
    );
    expect(patch1.ok(), await patch1.text()).toBeTruthy();
    await patchTripDatesExpectOk(
      request,
      API_BASE,
      order1,
      creds1.token,
      tripDates.start,
      tripDates.end,
    );

    const creds2 = await registerFreshTouristForCorridor(request, API_BASE);
    const order2 = await seedPublishedOpenItineraryOrder(request, API_BASE, creds2.token);
    const patch2Guide = await request.patch(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(order2)}/guide`,
      { headers: jsonWriteHeaders(creds2.token), data: { guide_id: guideId } },
    );
    expect(patch2Guide.ok(), await patch2Guide.text()).toBeTruthy();

    await postAcceptOrderExpectOk(request, order1, guideToken, API_BASE);

    const patchDates = await request.patch(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(order2)}/trip-dates`,
      {
        headers: jsonWriteHeaders(creds2.token),
        data: { start_date: tripDates.start, end_date: tripDates.end },
      },
    );
    await expectApiErrorBody(patchDates, 409, "schedule_conflict");
  });

  test("重复付款：escrowed 后再 mock-pay → invalid_state", async ({ request }) => {
    const corridor = await seedP03P06EscrowedApiOnly(request, API_BASE);
    const dup = await request.post(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(corridor.orderId)}/mock-pay`,
      {
        headers: jsonWriteHeaders(corridor.touristToken),
        data: {},
      },
    );
    expect(dup.status()).toBe(409);
    const dupBody = (await dup.json()) as { error?: string; current?: string };
    expect(dupBody.error).toBe("invalid_state");
    expect(String(dupBody.current ?? "").toLowerCase()).toBe("escrowed");
  });

  test("取消幂等：cancel 两次第二次 invalid_state", async ({ request }) => {
    const corridor = await seedP03P04CorridorApiOnly(request, API_BASE);
    const url = `${API_BASE}/api/v1/orders/${encodeURIComponent(corridor.orderId)}/cancel`;

    const first = await request.post(url, {
      headers: jsonWriteHeaders(corridor.touristToken),
      data: {},
    });
    expect(first.ok(), await first.text()).toBeTruthy();

    const second = await request.post(url, {
      headers: jsonWriteHeaders(corridor.touristToken),
      data: {},
    });
    await expectApiErrorBody(second, 409, "invalid_state");
  });

  test("完成幂等：confirm-completion 两次第二次 invalid_state", async ({ request }) => {
    const corridor = await seedP03P06EscrowedApiOnly(request, API_BASE);
    const url = `${API_BASE}/api/v1/orders/${encodeURIComponent(corridor.orderId)}/confirm-completion`;

    const first = await request.post(url, {
      headers: jsonWriteHeaders(corridor.guideToken),
      data: {},
    });
    expect(first.ok(), await first.text()).toBeTruthy();

    const second = await request.post(url, {
      headers: jsonWriteHeaders(corridor.guideToken),
      data: {},
    });
    await expectApiErrorBody(second, 409, "invalid_state");
  });

  test("version_conflict 重试 + already_confirmed 幂等", async ({ request }) => {
    const corridor = await seedP03P04CorridorApiOnly(request, API_BASE);
    const { orderId, touristToken } = corridor;

    const pre = await request.get(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}`,
      { headers: { Authorization: `Bearer ${touristToken}` } },
    );
    expect(pre.ok()).toBeTruthy();
    const currentVersion =
      ((await pre.json()) as { itinerary?: { version?: number } }).itinerary?.version ?? 1;

    const stale = await postConfirmFinalPlanRaw(
      request,
      API_BASE,
      orderId,
      touristToken,
      currentVersion + 99,
    );
    expect(stale.status()).toBe(409);
    const staleBody = (await stale.json()) as {
      error?: string;
      current_version?: number;
    };
    expect(staleBody.error).toBe("version_conflict");
    expect(staleBody.current_version).toBe(currentVersion);

    const retry = await postConfirmFinalPlanRaw(
      request,
      API_BASE,
      orderId,
      touristToken,
      staleBody.current_version ?? currentVersion,
    );
    expect(retry.ok(), await retry.text()).toBeTruthy();

    const dup = await postConfirmFinalPlanRaw(
      request,
      API_BASE,
      orderId,
      touristToken,
      staleBody.current_version ?? currentVersion,
    );
    await expectApiErrorBody(dup, 409, "already_confirmed");
  });

  test("未登录门闸：写接口无 Bearer → login_required 401", async ({ request }) => {
    const corridor = await seedP03P04CorridorApiOnly(request, API_BASE);
    const oid = corridor.orderId;

    const endpoints = [
      { method: "POST" as const, path: `/api/v1/orders/${oid}/mock-pay` },
      { method: "POST" as const, path: `/api/v1/orders/${oid}/cancel` },
      { method: "POST" as const, path: `/api/v1/orders/${oid}/accept` },
      { method: "POST" as const, path: `/api/v1/orders/${oid}/confirm-final-plan` },
      { method: "POST" as const, path: `/api/v1/orders/${oid}/confirm-completion` },
    ];

    for (const ep of endpoints) {
      const res = await request.fetch(`${API_BASE}${ep.path}`, {
        method: ep.method,
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": randomUUID(),
        },
        data: ep.path.includes("confirm-final-plan") ? { expected_version: 1 } : {},
      });
      expect(res.status()).toBe(401);
      const text = await res.text();
      expect(text).toMatch(/login_required|unauthorized/);
    }
  });

  test("错角色门闸：游客 accept / 向导 mock-pay / 非参与方 cancel", async ({ request }) => {
    const corridor = await seedP03P04CorridorApiOnly(request, API_BASE);
    const outsider = await registerFreshTouristForCorridor(request, API_BASE);
    const url = (action: string) =>
      `${API_BASE}/api/v1/orders/${encodeURIComponent(corridor.orderId)}/${action}`;

    const touristAccept = await request.post(url("accept"), {
      headers: jsonWriteHeaders(corridor.touristToken),
      data: {},
    });
    await expectApiErrorBody(touristAccept, 403, "not_guide");

    const guidePay = await request.post(url("mock-pay"), {
      headers: jsonWriteHeaders(corridor.guideToken),
      data: {},
    });
    await expectApiErrorBody(guidePay, 403, "not_tourist");

    const outsiderCancel = await request.post(url("cancel"), {
      headers: jsonWriteHeaders(outsider.token),
      data: {},
    });
    expect(outsiderCancel.status()).toBe(403);
    const cancelText = await outsiderCancel.text();
    expect(cancelText).toMatch(/forbidden|not_tourist/);
  });
});
