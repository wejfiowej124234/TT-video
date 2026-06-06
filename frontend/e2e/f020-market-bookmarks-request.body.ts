/**
 * **§8.2 · F-020** — Playwright **`request`** 直连 **traveltrust-api**（与 Rust **`me_market_bookmarks_db_api_tests`** 同形）。
 * 入口：`f018-f019-f020-request.spec.ts`（侧载本文件）。
 *
 * - **F-020**：旅客+向导 **`POST /guides`** → **`stake`** → **`POST /orders`** 得 **`order.id`** → **`POST /api/v1/me/market-bookmarks`** → **`GET …/me/market-bookmarks`** 的 **`order_ids`** 含该 id（**B-MKT-004**）；**`DELETE …/me/market-bookmarks/order/:id`→`GET`** **`order_ids`** **不含**（**`v1.4.279`**；与 **`matrix_93_b_mkt_004c_f020_*` API·IT** **对齐**）；**order+guide 双星标** 后 **`POST` `target_type=listing`**（**`target_id=order_id`**）→**400** **`invalid_target_type`**→**`GET`** **两列表仍含**（与 **`matrix_93_b_mkt_004i_f020_*` API·IT** **对齐**）。
 *
 * **环境**：**`DATABASE_URL`** + **`P3_CHAIN_OFF=1`**（与 **`e2e:api-b-orders-local`** / **`f015-*`** 同口径）。
 * **限流**：**`/api/v1/me/market-bookmarks`** **`GET`/`POST`/`DELETE`** 同源退避；**`POST` 成功写** 配 **`Idempotency-Key`**；**`invalid_target_type`** 用 **`requestPostWith429Retry`**（**非 429** 不吞体）。
 */
import { test, expect } from "@playwright/test";
import { defaultApiBase } from "./helpers/apiSession";
import { newIdempotencyKey } from "./helpers/idempotencyKey";
import {
  requestDeleteExpectOkWith429Backoff,
  requestGetExpectOkWith429Backoff,
  requestGetWith429Retry,
  requestPostExpectOkWith429Backoff,
  requestPostWith429Retry,
} from "./helpers/playwright429Backoff";
import { skipIfApiDown } from "./helpers/skipIfApiDown";

const API_BASE = defaultApiBase();

test("F-020 · POST me market bookmark for order then GET lists order_id", async ({ request }) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const touristEmail = `e2e-f020-t-${suffix}@traveltrust.test`;
  const guideEmail = `e2e-f020-g-${suffix}@traveltrust.test`;

  const regT = await requestPostWith429Retry(request,`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: touristEmail, password: "TestPass12!", nickname: "e2eF20T" },
  });
  expect(regT.ok()).toBeTruthy();
  const tj = (await regT.json()) as { status?: string; token?: string };
  expect(tj.status).toBe("ok");
  const tokenTourist = tj.token?.trim() ?? "";

  const regG = await requestPostWith429Retry(request,`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: guideEmail, password: "TestPass12!", nickname: "e2eF20G" },
  });
  expect(regG.ok()).toBeTruthy();
  const gj = (await regG.json()) as { status?: string; token?: string };
  expect(gj.status).toBe("ok");
  const tokenGuide = gj.token?.trim() ?? "";

  const gc = await requestPostExpectOkWith429Backoff(request, `${API_BASE}/api/v1/guides`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenGuide}`,
      "Idempotency-Key": newIdempotencyKey("f020-guides"),
    },
    data: {
      city: "Shanghai",
      country_code: "CN",
      languages: ["zh"],
      service_types: ["walking"],
    },
  });
  expect(gc.ok(), `POST guides ${gc.status()}`).toBeTruthy();
  const gcJ = (await gc.json()) as { guide?: { id?: string } };
  const guideRowId = gcJ.guide?.id ?? "";
  expect(guideRowId.length).toBeGreaterThan(0);

  const stake = await requestPostExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/guides/${guideRowId}/stake`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
        "Idempotency-Key": newIdempotencyKey("f020-stake"),
      },
      data: { amount: "1" },
    },
  );
  expect(stake.ok(), `stake ${stake.status()}`).toBeTruthy();

  const create = await requestPostExpectOkWith429Backoff(request, `${API_BASE}/api/v1/orders`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenTourist}`,
      "Idempotency-Key": newIdempotencyKey("f020-order-create"),
    },
    data: {
      guide_id: guideRowId,
      amount: "100",
      currency: "USD",
    },
  });
  expect(create.ok(), `POST orders ${create.status()}`).toBeTruthy();
  const cj = (await create.json()) as { status?: string; order?: { id?: string } };
  expect(cj.status).toBe("ok");
  const orderId = cj.order?.id ?? "";
  expect(orderId.length).toBeGreaterThan(0);

  const bm = await requestPostExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/me/market-bookmarks`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenTourist}`,
        "Idempotency-Key": newIdempotencyKey(`f020-bm-${suffix}`),
      },
      data: {
        target_type: "order",
        target_id: orderId,
      },
    },
  );
  expect(bm.ok(), `POST market-bookmarks ${bm.status()}`).toBeTruthy();
  const bmj = (await bm.json()) as { status?: string };
  expect(bmj.status).toBe("ok");

  const get = await requestGetExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/me/market-bookmarks`,
    { headers: { Authorization: `Bearer ${tokenTourist}` } },
  );
  expect(get.ok(), `GET market-bookmarks ${get.status()}`).toBeTruthy();
  const getJ = (await get.json()) as { status?: string; order_ids?: string[] };
  expect(getJ.status).toBe("ok");
  const ids = getJ.order_ids ?? [];
  expect(ids).toContain(orderId);
});

test("F-020 · DELETE order market bookmark then GET omits order_id", async ({ request }) => {
  /** 全矩阵闸 **`EVIDENCE_MAX_REQUESTS_PER_MINUTE=2`** 下 **`GET`/`DELETE`** 若叠 **429** 退避，默认 **120s** 易假红。 */
  test.setTimeout(300_000);
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const touristEmail = `e2e-f020c-t-${suffix}@traveltrust.test`;
  const guideEmail = `e2e-f020c-g-${suffix}@traveltrust.test`;

  const regT = await requestPostWith429Retry(request,`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: touristEmail, password: "TestPass12!", nickname: "e2eF20cT" },
  });
  expect(regT.ok()).toBeTruthy();
  const tj = (await regT.json()) as { status?: string; token?: string };
  expect(tj.status).toBe("ok");
  const tokenTourist = tj.token?.trim() ?? "";

  const regG = await requestPostWith429Retry(request,`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: guideEmail, password: "TestPass12!", nickname: "e2eF20cG" },
  });
  expect(regG.ok()).toBeTruthy();
  const gj = (await regG.json()) as { status?: string; token?: string };
  expect(gj.status).toBe("ok");
  const tokenGuide = gj.token?.trim() ?? "";

  const gc = await requestPostExpectOkWith429Backoff(request, `${API_BASE}/api/v1/guides`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenGuide}`,
      "Idempotency-Key": newIdempotencyKey("f020-guides"),
    },
    data: {
      city: "Shanghai",
      country_code: "CN",
      languages: ["zh"],
      service_types: ["walking"],
    },
  });
  expect(gc.ok(), `POST guides ${gc.status()}`).toBeTruthy();
  const gcJ = (await gc.json()) as { guide?: { id?: string } };
  const guideRowId = gcJ.guide?.id ?? "";
  expect(guideRowId.length).toBeGreaterThan(0);

  const stake = await requestPostExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/guides/${guideRowId}/stake`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
        "Idempotency-Key": newIdempotencyKey("f020-stake"),
      },
      data: { amount: "1" },
    },
  );
  expect(stake.ok(), `stake ${stake.status()}`).toBeTruthy();

  const create = await requestPostExpectOkWith429Backoff(request, `${API_BASE}/api/v1/orders`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenTourist}`,
      "Idempotency-Key": newIdempotencyKey("f020-order-create"),
    },
    data: {
      guide_id: guideRowId,
      amount: "100",
      currency: "USD",
    },
  });
  expect(create.ok(), `POST orders ${create.status()}`).toBeTruthy();
  const cj = (await create.json()) as { status?: string; order?: { id?: string } };
  expect(cj.status).toBe("ok");
  const orderId = cj.order?.id ?? "";
  expect(orderId.length).toBeGreaterThan(0);

  const bm = await requestPostExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/me/market-bookmarks`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenTourist}`,
        "Idempotency-Key": newIdempotencyKey(`f020c-bm-${suffix}`),
      },
      data: { target_type: "order", target_id: orderId },
    },
  );
  expect(bm.ok(), `POST market-bookmarks ${bm.status()}`).toBeTruthy();

  const get1 = await requestGetExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/me/market-bookmarks`,
    { headers: { Authorization: `Bearer ${tokenTourist}` } },
  );
  expect(get1.ok()).toBeTruthy();
  const g1 = (await get1.json()) as { status?: string; order_ids?: string[] };
  expect(g1.status).toBe("ok");
  expect(g1.order_ids ?? []).toContain(orderId);

  const del = await requestDeleteExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/me/market-bookmarks/order/${orderId}`,
    {
      headers: {
        Authorization: `Bearer ${tokenTourist}`,
        "Idempotency-Key": newIdempotencyKey(`f020c-del-${suffix}`),
      },
    },
  );
  expect(del.ok(), `DELETE bookmark ${del.status()}`).toBeTruthy();

  const get2 = await requestGetExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/me/market-bookmarks`,
    { headers: { Authorization: `Bearer ${tokenTourist}` } },
  );
  expect(get2.ok()).toBeTruthy();
  const g2 = (await get2.json()) as { status?: string; order_ids?: string[] };
  expect(g2.status).toBe("ok");
  expect(g2.order_ids ?? []).not.toContain(orderId);
});

test("F-020 · order+guide bookmarks then invalid listing POST preserves both lists", async ({
  request,
}) => {
  /** 同 DELETE 用例：全矩阵 **`EVIDENCE_MAX_REQUESTS_PER_MINUTE=2`** 下多 **`GET`/`POST`** 叠 **429** 退避，默认 **120s** 易超时假红。 */
  test.setTimeout(300_000);
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const touristEmail = `e2e-f020b-t-${suffix}@traveltrust.test`;
  const guideEmail = `e2e-f020b-g-${suffix}@traveltrust.test`;

  const regT = await requestPostWith429Retry(request,`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: touristEmail, password: "TestPass12!", nickname: "e2eF20bT" },
  });
  expect(regT.ok()).toBeTruthy();
  const tj = (await regT.json()) as { status?: string; token?: string };
  expect(tj.status).toBe("ok");
  const tokenTourist = tj.token?.trim() ?? "";

  const regG = await requestPostWith429Retry(request,`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: guideEmail, password: "TestPass12!", nickname: "e2eF20bG" },
  });
  expect(regG.ok()).toBeTruthy();
  const gj = (await regG.json()) as { status?: string; token?: string };
  expect(gj.status).toBe("ok");
  const tokenGuide = gj.token?.trim() ?? "";

  const gc = await requestPostExpectOkWith429Backoff(request, `${API_BASE}/api/v1/guides`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenGuide}`,
      "Idempotency-Key": newIdempotencyKey("f020-guides"),
    },
    data: {
      city: "Shanghai",
      country_code: "CN",
      languages: ["zh"],
      service_types: ["walking"],
    },
  });
  expect(gc.ok(), `POST guides ${gc.status()}`).toBeTruthy();
  const gcJ = (await gc.json()) as { guide?: { id?: string } };
  const guideRowId = gcJ.guide?.id ?? "";
  expect(guideRowId.length).toBeGreaterThan(0);

  const stake = await requestPostExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/guides/${guideRowId}/stake`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
        "Idempotency-Key": newIdempotencyKey("f020-stake"),
      },
      data: { amount: "1" },
    },
  );
  expect(stake.ok(), `stake ${stake.status()}`).toBeTruthy();

  const create = await requestPostExpectOkWith429Backoff(request, `${API_BASE}/api/v1/orders`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenTourist}`,
      "Idempotency-Key": newIdempotencyKey("f020-order-create"),
    },
    data: {
      guide_id: guideRowId,
      amount: "100",
      currency: "USD",
    },
  });
  expect(create.ok(), `POST orders ${create.status()}`).toBeTruthy();
  const cj = (await create.json()) as { status?: string; order?: { id?: string } };
  expect(cj.status).toBe("ok");
  const orderId = cj.order?.id ?? "";
  expect(orderId.length).toBeGreaterThan(0);

  const bmOrder = await requestPostExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/me/market-bookmarks`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenTourist}`,
        "Idempotency-Key": newIdempotencyKey(`f020b-ord-${suffix}`),
      },
      data: { target_type: "order", target_id: orderId },
    },
  );
  expect(bmOrder.ok(), `POST order bookmark ${bmOrder.status()}`).toBeTruthy();

  const bmGuide = await requestPostExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/me/market-bookmarks`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenTourist}`,
        "Idempotency-Key": newIdempotencyKey(`f020b-gde-${suffix}`),
      },
      data: { target_type: "guide", target_id: guideRowId },
    },
  );
  expect(bmGuide.ok(), `POST guide bookmark ${bmGuide.status()}`).toBeTruthy();

  const bad = await requestPostWith429Retry(request, `${API_BASE}/api/v1/me/market-bookmarks`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenTourist}`,
    },
    data: { target_type: "listing", target_id: orderId },
  });
  expect(bad.status()).toBe(400);
  const badJ = (await bad.json()) as { error?: string };
  expect(badJ.error).toBe("invalid_target_type");

  const get = await requestGetExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/me/market-bookmarks`,
    { headers: { Authorization: `Bearer ${tokenTourist}` } },
  );
  expect(get.ok(), `GET market-bookmarks ${get.status()}`).toBeTruthy();
  const getJ = (await get.json()) as {
    status?: string;
    order_ids?: string[];
    guide_ids?: string[];
  };
  expect(getJ.status).toBe("ok");
  expect(getJ.order_ids ?? []).toContain(orderId);
  expect(getJ.guide_ids ?? []).toContain(guideRowId);
});
