/**
 * **§8.2 · F-025** — Playwright **`request`**（与 **`guides_disputes_db_api_tests`** 同形）。
 * 入口：`f024-f025-f026-request.spec.ts`（侧载本文件）。
 *
 * - **F-025**：下单 → **`accept`** → **`mock-pay`**（**`P3_CHAIN_OFF`**）→ **`POST …/orders/:id/dispute`** → **`GET /disputes`** / **`GET /disputes/:id`**（**B-DSP-002**）；同链再 **`GET …/orders/:id`** **`order.status=disputed`**（**B-TRN-003**）。**B-DSP-003** 见 **`POST …/disputes/:id/resolve`**（须 API **`P3_SEED_ARBITRATOR_EMAIL`** 与 **`PLAYWRIGHT_ARBITRATOR_SEED_EMAIL`** 对齐，**CI** **`build.yml`·`e2e`** 已注入）。
 *
 * **环境**：**`DATABASE_URL`** + **`P3_CHAIN_OFF=1`**；须经 **`skipUnlessOrderMockPayAvailable`**（**`mock-pay`≠501**）。
 * **限流**：**`GET`**（**disputes**、**orders**）与 **`POST`**（**guides** / **stake** / **orders** / **dispute** / **resolve**）遇 **429** 时 **`playwright429Backoff`**。
 */
import { test, expect, type APIRequestContext } from "@playwright/test";

import { apiLoginReturnRoleEnvelope, defaultApiBase } from "./helpers/apiSession";
import { newIdempotencyKey } from "./helpers/idempotencyKey";
import {
  requestGetExpectOkWith429Backoff,
  requestGetWith429Retry,
  requestPostExpectOkWith429Backoff,
  requestPostWith429Retry,
} from "./helpers/playwright429Backoff";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { skipUnlessOrderMockPayAvailable } from "./helpers/skipUnlessOrderMockPayAvailable";

const API_BASE = defaultApiBase();

/** 与 **`build.yml`·`e2e`** **`P3_SEED_ARBITRATOR_EMAIL`** 同源（**B-DSP-003** / **`matrix_93_b_dsp_003b_f025_*`**）。 */
const ARBITRATOR_SEED_EMAIL =
  process.env.PLAYWRIGHT_ARBITRATOR_SEED_EMAIL ?? "e2e-ci-arbitrator-seed@traveltrust.test";

async function bearerRegisterOrLoginArbitrator(request: APIRequestContext): Promise<string> {
  const reg = await requestPostWith429Retry(request, `${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: {
      email: ARBITRATOR_SEED_EMAIL,
      password: "TestPass12!",
      nickname: "e2eArbSeed",
    },
  });
  const rj = (await reg.json()) as { status?: string; token?: string; role?: string; error?: string };
  if (reg.ok() && rj.status === "ok" && (rj.token?.length ?? 0) > 0) {
    if (rj.role !== "arbitrator") {
      throw new Error(
        `B-DSP-003 E2E: expected role=arbitrator for ${ARBITRATOR_SEED_EMAIL}; got ${rj.role}. ` +
          `Set API env P3_SEED_ARBITRATOR_EMAIL to this address (CI: build.yml e2e job).`,
      );
    }
    return rj.token!.trim();
  }
  if (rj.error === "email_already_registered" || reg.status() === 400) {
    const env = await apiLoginReturnRoleEnvelope(
      request,
      API_BASE,
      ARBITRATOR_SEED_EMAIL,
      "TestPass12!",
    );
    expect(env?.token?.length, `arb seed login`).toBeGreaterThan(0);
    expect(env!.role || "arbitrator").toBe("arbitrator");
    return env!.token;
  }
  expect(reg.ok(), `arb seed register ${reg.status()} ${JSON.stringify(rj)}`).toBeTruthy();
  throw new Error(`arb seed register unexpected branch: ${reg.status()} ${JSON.stringify(rj)}`);
}

test.describe.serial("§8.2 F-025 — disputes", () => {
  /** 同 **`f007-f010-f032-request`**：证据链 **`EVIDENCE_MAX_REQUESTS_PER_MINUTE=2`** 下长 API 链偶发假红。 */
  test.describe.configure({
    retries: process.env.EVIDENCE_MAX_REQUESTS_PER_MINUTE === "2" ? 1 : 0,
  });

  test("F-025 · escrowed order open dispute then GET list and detail", async ({ request }) => {
    await skipIfApiDown(request);
    await skipUnlessOrderMockPayAvailable(request, API_BASE);
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const touristEmail = `e2e-f025-t-${suffix}@traveltrust.test`;
    const guideEmail = `e2e-f025-g-${suffix}@traveltrust.test`;

    const regT = await requestPostWith429Retry(request,`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email: touristEmail, password: "TestPass12!", nickname: "e2eF25T" },
    });
    expect(regT.ok()).toBeTruthy();
    const tj = (await regT.json()) as { status?: string; token?: string };
    expect(tj.status).toBe("ok");
    const tokenTourist = tj.token?.trim() ?? "";

    const regG = await requestPostWith429Retry(request,`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email: guideEmail, password: "TestPass12!", nickname: "e2eF25G" },
    });
    expect(regG.ok()).toBeTruthy();
    const gj = (await regG.json()) as { status?: string; token?: string };
    expect(gj.status).toBe("ok");
    const tokenGuide = gj.token?.trim() ?? "";

    const gc = await requestPostExpectOkWith429Backoff(request, `${API_BASE}/api/v1/guides`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
        "Idempotency-Key": newIdempotencyKey(`f025-guides-${suffix}`),
      },
      data: {
        city: "Shanghai",
        country_code: "CN",
        languages: ["zh"],
        service_types: ["walking"],
        bio: "e2e-f025",
      },
    });
    expect(gc.ok()).toBeTruthy();
    const guideRowId =
      ((await gc.json()) as { guide?: { id?: string } }).guide?.id ?? "";
    expect(guideRowId.length).toBeGreaterThan(0);

    const stake = await requestPostExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/guides/${guideRowId}/stake`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenGuide}`,
          "Idempotency-Key": newIdempotencyKey(`f025-stake-${suffix}`),
        },
        data: { amount: "1" },
      },
    );
    expect(stake.ok()).toBeTruthy();

    const create = await requestPostExpectOkWith429Backoff(request, `${API_BASE}/api/v1/orders`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenTourist}`,
        "Idempotency-Key": newIdempotencyKey(`f025-create-${suffix}`),
      },
      data: {
        guide_id: guideRowId,
        amount: "100",
        currency: "USD",
      },
    });
    expect(create.ok(), `POST orders ${create.status()}`).toBeTruthy();
    const orderId = ((await create.json()) as { order?: { id?: string } }).order?.id ?? "";
    expect(orderId.length).toBeGreaterThan(0);

    const accept = await requestPostExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/orders/${orderId}/accept`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenGuide}`,
          "Idempotency-Key": newIdempotencyKey(`f025-accept-${suffix}`),
        },
        data: {},
      },
    );
    expect(accept.ok(), `accept ${accept.status()}`).toBeTruthy();

    const pay = await requestPostExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/orders/${orderId}/mock-pay`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenTourist}`,
          "Idempotency-Key": newIdempotencyKey(`f025-pay-${suffix}`),
        },
        data: {},
      },
    );
    expect(pay.ok(), `mock-pay ${pay.status()}`).toBeTruthy();

    const open = await requestPostExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/orders/${orderId}/dispute`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenTourist}`,
          "Idempotency-Key": newIdempotencyKey(`f025-dispute-${suffix}`),
        },
        data: {},
      },
    );
    expect(open.ok(), `open dispute ${open.status()}`).toBeTruthy();
    const openJ = (await open.json()) as {
      status?: string;
      dispute?: { id?: string; order_id?: string };
    };
    expect(openJ.status).toBe("ok");
    const disputeId = openJ.dispute?.id ?? "";
    expect(disputeId.length).toBeGreaterThan(0);
    expect(openJ.dispute?.order_id).toBe(orderId);

    const list = await requestGetExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/disputes?limit=50`,
      { headers: { Authorization: `Bearer ${tokenTourist}` } },
    );
    expect(list.ok(), `GET disputes ${list.status()}`).toBeTruthy();
    const lj = (await list.json()) as {
      status?: string;
      items?: Array<{ id?: string }>;
      page?: { source?: string };
    };
    expect(lj.status).toBe("ok");
    expect(lj.page?.source).toBe("postgres");
    const ids = lj.items ?? [];
    expect(ids.some((it) => it.id === disputeId)).toBe(true);

    const detail = await requestGetExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/disputes/${disputeId}`,
      { headers: { Authorization: `Bearer ${tokenTourist}` } },
    );
    expect(detail.ok(), `GET dispute ${detail.status()}`).toBeTruthy();
    const dj = (await detail.json()) as {
      status?: string;
      dispute?: { id?: string; order_id?: string };
    };
    expect(dj.status).toBe("ok");
    expect(dj.dispute?.id).toBe(disputeId);
    expect(dj.dispute?.order_id).toBe(orderId);

    const ord = await requestGetExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/orders/${orderId}`,
      { headers: { Authorization: `Bearer ${tokenTourist}` } },
    );
    expect(ord.ok(), `GET order after dispute ${ord.status()}`).toBeTruthy();
    const oj = (await ord.json()) as { status?: string; order?: { status?: string } };
    expect(oj.status).toBe("ok");
    expect(oj.order?.status).toBe("disputed");
  });

  test("F-025 · B-DSP-003 · seed arbitrator POST …/disputes/:id/resolve → resolved (PG)", async ({
    request,
  }) => {
    await skipIfApiDown(request);
    await skipUnlessOrderMockPayAvailable(request, API_BASE);
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const touristEmail = `e2e-bdsp003-t-${suffix}@traveltrust.test`;
    const guideEmail = `e2e-bdsp003-g-${suffix}@traveltrust.test`;

    const regT = await requestPostWith429Retry(request,`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email: touristEmail, password: "TestPass12!", nickname: "e2eB3T" },
    });
    expect(regT.ok()).toBeTruthy();
    const tj = (await regT.json()) as { status?: string; token?: string };
    expect(tj.status).toBe("ok");
    const tokenTourist = tj.token?.trim() ?? "";

    const regG = await requestPostWith429Retry(request,`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email: guideEmail, password: "TestPass12!", nickname: "e2eB3G" },
    });
    expect(regG.ok()).toBeTruthy();
    const gj = (await regG.json()) as { status?: string; token?: string };
    expect(gj.status).toBe("ok");
    const tokenGuide = gj.token?.trim() ?? "";

    const gc = await requestPostExpectOkWith429Backoff(request, `${API_BASE}/api/v1/guides`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
        "Idempotency-Key": newIdempotencyKey(`bdsp003-guides-${suffix}`),
      },
      data: {
        city: "Shanghai",
        country_code: "CN",
        languages: ["zh"],
        service_types: ["walking"],
        bio: "e2e-bdsp003",
      },
    });
    expect(gc.ok()).toBeTruthy();
    const guideRowId = ((await gc.json()) as { guide?: { id?: string } }).guide?.id ?? "";
    expect(guideRowId.length).toBeGreaterThan(0);

    const stake = await requestPostExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/guides/${guideRowId}/stake`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenGuide}`,
          "Idempotency-Key": newIdempotencyKey(`bdsp003-stake-${suffix}`),
        },
        data: { amount: "1" },
      },
    );
    expect(stake.ok()).toBeTruthy();

    const create = await requestPostExpectOkWith429Backoff(request, `${API_BASE}/api/v1/orders`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenTourist}`,
        "Idempotency-Key": newIdempotencyKey(`bdsp003-create-${suffix}`),
      },
      data: {
        guide_id: guideRowId,
        amount: "100",
        currency: "USD",
      },
    });
    expect(create.ok()).toBeTruthy();
    const orderId = ((await create.json()) as { order?: { id?: string } }).order?.id ?? "";
    expect(orderId.length).toBeGreaterThan(0);

    const accept = await requestPostExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/orders/${orderId}/accept`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenGuide}`,
          "Idempotency-Key": newIdempotencyKey(`bdsp003-accept-${suffix}`),
        },
        data: {},
      },
    );
    expect(accept.ok()).toBeTruthy();

    const pay = await requestPostExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/orders/${orderId}/mock-pay`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenTourist}`,
          "Idempotency-Key": newIdempotencyKey(`bdsp003-pay-${suffix}`),
        },
        data: {},
      },
    );
    expect(pay.ok()).toBeTruthy();

    const open = await requestPostExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/orders/${orderId}/dispute`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenTourist}`,
          "Idempotency-Key": newIdempotencyKey(`bdsp003-dispute-${suffix}`),
        },
        data: { reason: "e2e_b_dsp_003" },
      },
    );
    expect(open.ok()).toBeTruthy();
    const openJ = (await open.json()) as { status?: string; dispute?: { id?: string } };
    expect(openJ.status).toBe("ok");
    const disputeId = openJ.dispute?.id ?? "";
    expect(disputeId.length).toBeGreaterThan(0);

    const tokenArb = await bearerRegisterOrLoginArbitrator(request);

    const resolve = await requestPostExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/disputes/${disputeId}/resolve`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenArb}`,
          "Idempotency-Key": newIdempotencyKey(`bdsp003-resolve-${suffix}`),
        },
        data: { refund_ratio: 1.0, slash_guide: false },
      },
    );
    expect(resolve.ok(), `resolve ${resolve.status()}`).toBeTruthy();
    const rv = (await resolve.json()) as { status?: string; dispute?: { status?: string } };
    expect(rv.status).toBe("ok");
    expect(rv.dispute?.status).toBe("resolved");

    const detail = await requestGetExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/disputes/${disputeId}`,
      { headers: { Authorization: `Bearer ${tokenTourist}` } },
    );
    expect(detail.ok()).toBeTruthy();
    const dj = (await detail.json()) as { status?: string; dispute?: { status?: string } };
    expect(dj.status).toBe("ok");
    expect(dj.dispute?.status).toBe("resolved");
  });

});
