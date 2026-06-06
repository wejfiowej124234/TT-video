/**
 * **§8.2 · F-026** — Playwright **`request`**（与 **`messages_db_api_tests`** 同形）。
 * 入口：`f024-f025-f026-request.spec.ts`（侧载本文件）。
 *
 * - **F-026**：同上至 **`mock-pay`** → **`POST|GET …/orders/:id/messages`**（**B-MSG-002**）；**旅客 `POST`→向导 `GET` 同路径**（**B-MSG-002C** ↔ **`matrix_93_b_msg_002c_f026_*`**）。
 *
 * **环境**：**`DATABASE_URL`** + **`P3_CHAIN_OFF=1`**；须经 **`skipUnlessOrderMockPayAvailable`**。
 * **限流**：**GET** 与 **POST** 遇 **429** 时 **`playwright429Backoff`**。
 */
import { test, expect } from "@playwright/test";

import { defaultApiBase } from "./helpers/apiSession";
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

test.describe.serial("§8.2 F-026 — order messages", () => {
  test.describe.configure({
    retries: process.env.EVIDENCE_MAX_REQUESTS_PER_MINUTE === "2" ? 2 : 0,
  });

  test("F-026 · POST order message then GET lists content", async ({ request }) => {
    await skipIfApiDown(request);
    await skipUnlessOrderMockPayAvailable(request, API_BASE);
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const touristEmail = `e2e-f026-t-${suffix}@traveltrust.test`;
    const guideEmail = `e2e-f026-g-${suffix}@traveltrust.test`;

    const regT = await requestPostWith429Retry(request,`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email: touristEmail, password: "TestPass12!", nickname: "e2eF26T" },
    });
    expect(regT.ok()).toBeTruthy();
    const tj = (await regT.json()) as { status?: string; token?: string };
    expect(tj.status).toBe("ok");
    const tokenTourist = tj.token?.trim() ?? "";

    const regG = await requestPostWith429Retry(request,`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email: guideEmail, password: "TestPass12!", nickname: "e2eF26G" },
    });
    expect(regG.ok()).toBeTruthy();
    const gj = (await regG.json()) as { status?: string; token?: string };
    expect(gj.status).toBe("ok");
    const tokenGuide = gj.token?.trim() ?? "";

    const gc = await requestPostExpectOkWith429Backoff(request, `${API_BASE}/api/v1/guides`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
        "Idempotency-Key": newIdempotencyKey(`f026-guides-${suffix}`),
      },
      data: {
        city: "Shanghai",
        country_code: "CN",
        languages: ["zh"],
        service_types: ["walking"],
        bio: "e2e-f026",
      },
    });
    expect(gc.ok()).toBeTruthy();
    const guideRowId =
      ((await gc.json()) as { guide?: { id?: string } }).guide?.id ?? "";

    await requestPostExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/guides/${guideRowId}/stake`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenGuide}`,
          "Idempotency-Key": newIdempotencyKey(`f026-stake-${suffix}`),
        },
        data: { amount: "1" },
      },
    );

    const create = await requestPostExpectOkWith429Backoff(request, `${API_BASE}/api/v1/orders`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenTourist}`,
        "Idempotency-Key": newIdempotencyKey(`f026-create-${suffix}`),
      },
      data: {
        guide_id: guideRowId,
        amount: "100",
        currency: "USD",
      },
    });
    expect(create.ok()).toBeTruthy();
    const orderId =
      ((await create.json()) as { order?: { id?: string } }).order?.id ?? "";

    await requestPostExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/orders/${orderId}/accept`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenGuide}`,
          "Idempotency-Key": newIdempotencyKey(`f026-accept-${suffix}`),
        },
        data: {},
      },
    );
    await requestPostExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/orders/${orderId}/mock-pay`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenTourist}`,
          "Idempotency-Key": newIdempotencyKey(`f026-pay-${suffix}`),
        },
        data: {},
      },
    );

    const line = `e2e-f026-msg-${suffix}`;
    const post = await requestPostExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/orders/${orderId}/messages`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenTourist}`,
          "Idempotency-Key": newIdempotencyKey(`f026-msg-${suffix}`),
        },
        data: { content: line },
      },
    );
    expect(post.ok(), `POST messages ${post.status()}`).toBeTruthy();
    const pj = (await post.json()) as { status?: string; message?: { content?: string } };
    expect(pj.status).toBe("ok");
    expect(pj.message?.content).toBe(line);

    const get = await requestGetExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/orders/${orderId}/messages`,
      { headers: { Authorization: `Bearer ${tokenTourist}` } },
    );
    expect(get.ok(), `GET messages ${get.status()}`).toBeTruthy();
    const gj2 = (await get.json()) as {
      status?: string;
      items?: Array<{ content?: string }>;
    };
    expect(gj2.status).toBe("ok");
    const items = gj2.items ?? [];
    expect(items.some((m) => m.content === line)).toBe(true);
  });

  test("F-026 · tourist POST order message then guide GET lists same line", async ({ request }) => {
    await skipIfApiDown(request);
    await skipUnlessOrderMockPayAvailable(request, API_BASE);
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const touristEmail = `e2e-f026c-t-${suffix}@traveltrust.test`;
    const guideEmail = `e2e-f026c-g-${suffix}@traveltrust.test`;

    const regT = await requestPostWith429Retry(request,`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email: touristEmail, password: "TestPass12!", nickname: "e2eF26cT" },
    });
    expect(regT.ok()).toBeTruthy();
    const tj = (await regT.json()) as { status?: string; token?: string };
    expect(tj.status).toBe("ok");
    const tokenTourist = tj.token?.trim() ?? "";

    const regG = await requestPostWith429Retry(request,`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email: guideEmail, password: "TestPass12!", nickname: "e2eF26cG" },
    });
    expect(regG.ok()).toBeTruthy();
    const gj = (await regG.json()) as { status?: string; token?: string };
    expect(gj.status).toBe("ok");
    const tokenGuide = gj.token?.trim() ?? "";

    const gc = await requestPostExpectOkWith429Backoff(request, `${API_BASE}/api/v1/guides`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
        "Idempotency-Key": newIdempotencyKey(`f026c-guides-${suffix}`),
      },
      data: {
        city: "Shanghai",
        country_code: "CN",
        languages: ["zh"],
        service_types: ["walking"],
        bio: "e2e-f026c",
      },
    });
    expect(gc.ok()).toBeTruthy();
    const guideRowId =
      ((await gc.json()) as { guide?: { id?: string } }).guide?.id ?? "";

    await requestPostExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/guides/${guideRowId}/stake`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenGuide}`,
          "Idempotency-Key": newIdempotencyKey(`f026c-stake-${suffix}`),
        },
        data: { amount: "1" },
      },
    );

    const create = await requestPostExpectOkWith429Backoff(request, `${API_BASE}/api/v1/orders`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenTourist}`,
        "Idempotency-Key": newIdempotencyKey(`f026c-create-${suffix}`),
      },
      data: {
        guide_id: guideRowId,
        amount: "100",
        currency: "USD",
      },
    });
    expect(create.ok()).toBeTruthy();
    const orderId =
      ((await create.json()) as { order?: { id?: string } }).order?.id ?? "";

    await requestPostExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/orders/${orderId}/accept`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenGuide}`,
          "Idempotency-Key": newIdempotencyKey(`f026c-accept-${suffix}`),
        },
        data: {},
      },
    );
    await requestPostExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/orders/${orderId}/mock-pay`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenTourist}`,
          "Idempotency-Key": newIdempotencyKey(`f026c-pay-${suffix}`),
        },
        data: {},
      },
    );

    const line = `e2e-f026c-msg-${suffix}`;
    const post = await requestPostExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/orders/${orderId}/messages`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenTourist}`,
          "Idempotency-Key": newIdempotencyKey(`f026c-msg-${suffix}`),
        },
        data: { content: line },
      },
    );
    expect(post.ok(), `POST messages ${post.status()}`).toBeTruthy();
    const pj = (await post.json()) as { status?: string; message?: { content?: string } };
    expect(pj.status).toBe("ok");
    expect(pj.message?.content).toBe(line);

    const getG = await requestGetExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/orders/${orderId}/messages`,
      { headers: { Authorization: `Bearer ${tokenGuide}` } },
    );
    expect(getG.ok(), `guide GET messages ${getG.status()}`).toBeTruthy();
    const mg = (await getG.json()) as {
      status?: string;
      items?: Array<{ content?: string }>;
    };
    expect(mg.status).toBe("ok");
    expect((mg.items ?? []).some((m) => m.content === line)).toBe(true);
  });
});
