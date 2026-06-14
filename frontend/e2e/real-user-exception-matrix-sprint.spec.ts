/**
 * ① Real User Exception Matrix Sprint — 全新账号 API 异常流矩阵
 * 拒单 · 取消 · 超时 · 重复支付 · 重复评价 · 非参与方 · P03–P06 门闸 parity
 */
import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";

import { postAcceptOrderExpectOk } from "./helpers/bilateralEscrowE2e";
import { seedPublishedOpenItineraryOrder } from "./helpers/bookGuideItineraryFirst";
import {
  expectApiErrorBody,
  jsonWriteHeaders,
  postConfirmFinalPlanRaw,
  postReviewRaw,
  registerExtraRealUserGuideViaApi,
  registerExtraRealUserTouristViaApi,
  seedRealUserCompletedViaApi,
  seedRealUserEscrowedViaApi,
  seedRealUserOpenOrderBoundViaApi,
  seedRealUserP04CorridorApiOnly,
  shortTtlBufferMs,
  sleepMs,
} from "./helpers/realUserExceptionMatrixCorridor";
import { patchBindSeedGuideToOrder } from "./helpers/guideWorkbenchInboxCorridor";
import { skipUnlessOrderMockPayAvailable } from "./helpers/skipUnlessOrderMockPayAvailable";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

test.describe.configure({ mode: "serial" });

test.describe("Real user exception matrix sprint (① local)", {
  tag: "@e2e-real-user-exception-matrix",
}, () => {
  test.beforeEach(async ({ request }) => {
    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) test.skip(true, `API 不可用：${API_HEALTH}`);
    await skipUnlessOrderMockPayAvailable(request, API_BASE);
    if (process.env.SEED_TEST_ACCOUNTS === "1") {
      test.skip(true, "Real user matrix requires SEED_TEST_ACCOUNTS=0");
    }
  });

  test("拒单：非指派向导 accept → not_assigned_guide 403", async ({ request }) => {
    const corridor = await seedRealUserOpenOrderBoundViaApi(request, API_BASE);
    const other = await registerExtraRealUserGuideViaApi(
      request,
      API_BASE,
      corridor.pair.suffix,
    );
    const accept = await request.post(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(corridor.orderId)}/accept`,
      { headers: jsonWriteHeaders(other.token), data: {} },
    );
    await expectApiErrorBody(accept, 403, "not_assigned_guide");
  });

  test("取消：接单前游客 cancel 成功", async ({ request }) => {
    const corridor = await seedRealUserOpenOrderBoundViaApi(request, API_BASE);
    const cancel = await request.post(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(corridor.orderId)}/cancel`,
      { headers: jsonWriteHeaders(corridor.touristToken), data: {} },
    );
    expect(cancel.ok(), await cancel.text()).toBeTruthy();
  });

  test("取消幂等：cancel 两次第二次 invalid_state", async ({ request }) => {
    const corridor = await seedRealUserP04CorridorApiOnly(request, API_BASE);
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

  test("超时：accept_window_expired → 410", async ({ request }) => {
    const corridor = await seedRealUserOpenOrderBoundViaApi(request, API_BASE);
    await sleepMs(shortTtlBufferMs());
    const accept = await request.post(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(corridor.orderId)}/accept`,
      { headers: jsonWriteHeaders(corridor.guideToken), data: {} },
    );
    expect(accept.status()).toBe(410);
    const body = await accept.text();
    expect(body).toContain("accept_window_expired");
  });

  test("超时：payment_window_expired → 410", async ({ request }) => {
    const corridor = await seedRealUserP04CorridorApiOnly(request, API_BASE);
    await sleepMs(shortTtlBufferMs());
    const pay = await request.post(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(corridor.orderId)}/mock-pay`,
      { headers: jsonWriteHeaders(corridor.touristToken), data: {} },
    );
    expect(pay.status()).toBe(410);
    const body = await pay.text();
    expect(body).toContain("payment_window_expired");
  });

  test("重复付款：escrowed 后再 mock-pay → invalid_state", async ({ request }) => {
    const corridor = await seedRealUserEscrowedViaApi(request, API_BASE);
    const dup = await request.post(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(corridor.orderId)}/mock-pay`,
      { headers: jsonWriteHeaders(corridor.touristToken), data: {} },
    );
    expect(dup.status()).toBe(409);
    const dupBody = (await dup.json()) as { error?: string; current?: string };
    expect(dupBody.error).toBe("invalid_state");
    expect(String(dupBody.current ?? "").toLowerCase()).toBe("escrowed");
  });

  test("重复评价：第二次 POST reviews → already_reviewed", async ({ request }) => {
    const corridor = await seedRealUserCompletedViaApi(request, API_BASE);
    const comment = `real-user-exc-rev-${corridor.pair.suffix}`;
    const first = await postReviewRaw(request, API_BASE, corridor.orderId, corridor.touristToken, {
      score: 5,
      comment,
    });
    expect(first.ok(), await first.text()).toBeTruthy();

    const second = await postReviewRaw(request, API_BASE, corridor.orderId, corridor.touristToken, {
      score: 4,
      comment: `${comment}-dup`,
    });
    await expectApiErrorBody(second, 409, "already_reviewed");
  });

  test("完成幂等：confirm-completion 两次第二次 invalid_state", async ({ request }) => {
    const corridor = await seedRealUserEscrowedViaApi(request, API_BASE);
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

  test("冲突预约：第二单绑同一向导 → guide_has_active_order", async ({ request }) => {
    const blocked = await seedRealUserP04CorridorApiOnly(request, API_BASE);
    const outsider = await registerExtraRealUserTouristViaApi(request, API_BASE);
    const order2 = await seedPublishedOpenItineraryOrder(request, API_BASE, outsider.token);

    const patch = await request.patch(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(order2)}/guide`,
      {
        headers: jsonWriteHeaders(outsider.token),
        data: { guide_id: blocked.guideRowId },
      },
    );
    await expectApiErrorBody(patch, 409, "guide_has_active_order");
  });

  test("冲突预约：重叠 trip-dates → schedule_conflict", async ({ request }) => {
    const base = await seedRealUserOpenOrderBoundViaApi(request, API_BASE);
    const creds2 = await registerExtraRealUserTouristViaApi(request, API_BASE);
    const order2 = await seedPublishedOpenItineraryOrder(request, API_BASE, creds2.token);
    await patchBindSeedGuideToOrder(request, API_BASE, creds2.token, order2, base.guideRowId);

    await postAcceptOrderExpectOk(request, base.orderId, base.guideToken, API_BASE);

    const patchDates = await request.patch(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(order2)}/trip-dates`,
      {
        headers: jsonWriteHeaders(creds2.token),
        data: { start_date: base.tripDates.start, end_date: base.tripDates.end },
      },
    );
    await expectApiErrorBody(patchDates, 409, "schedule_conflict");
  });

  test("version_conflict 重试 + already_confirmed 幂等", async ({ request }) => {
    const corridor = await seedRealUserP04CorridorApiOnly(request, API_BASE);
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
    const corridor = await seedRealUserP04CorridorApiOnly(request, API_BASE);
    const oid = corridor.orderId;

    const endpoints = [
      { method: "POST" as const, path: `/api/v1/orders/${oid}/mock-pay` },
      { method: "POST" as const, path: `/api/v1/orders/${oid}/cancel` },
      { method: "POST" as const, path: `/api/v1/orders/${oid}/accept` },
      { method: "POST" as const, path: `/api/v1/orders/${oid}/confirm-final-plan` },
      { method: "POST" as const, path: `/api/v1/orders/${oid}/confirm-completion` },
      { method: "POST" as const, path: `/api/v1/orders/${oid}/reviews` },
    ];

    for (const ep of endpoints) {
      const res = await request.fetch(`${API_BASE}${ep.path}`, {
        method: ep.method,
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": randomUUID(),
        },
        data: ep.path.includes("confirm-final-plan")
          ? { expected_version: 1 }
          : ep.path.includes("reviews")
            ? { score: 5 }
            : {},
      });
      expect(res.status()).toBe(401);
      const text = await res.text();
      expect(text).toMatch(/login_required|unauthorized/);
    }
  });

  test("非参与方/错角色：游客 accept · 向导 mock-pay · 局外人 cancel/review/completion", async ({
    request,
  }) => {
    const corridor = await seedRealUserP04CorridorApiOnly(request, API_BASE);
    const outsider = await registerExtraRealUserTouristViaApi(request, API_BASE);
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
    expect(await outsiderCancel.text()).toMatch(/forbidden|not_tourist/);

    const completed = await seedRealUserCompletedViaApi(request, API_BASE);
    const outsiderReview = await postReviewRaw(
      request,
      API_BASE,
      completed.orderId,
      outsider.token,
      { score: 3, comment: "outsider" },
    );
    expect(outsiderReview.status()).toBe(403);
    expect(await outsiderReview.text()).toMatch(/forbidden/);

    const outsiderDone = await request.post(
      `${API_BASE}/api/v1/orders/${encodeURIComponent(corridor.orderId)}/confirm-completion`,
      { headers: jsonWriteHeaders(outsider.token), data: {} },
    );
    expect(outsiderDone.status()).toBe(403);
    expect(await outsiderDone.text()).toMatch(/forbidden/);
  });
});
