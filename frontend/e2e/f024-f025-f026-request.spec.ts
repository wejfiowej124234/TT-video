/**
 * **§8.2 · F-024 / F-025 / F-026** — Playwright **`request`**（与 **`guides_disputes_db_api_tests`** / **`messages_db_api_tests`** 同形）。
 *
 * - **F-024**：**`POST …/guides`** → **`POST …/stake`**（**`amount: "100"`**）→ **`GET /api/v1/guides?city=Shanghai`** **`items`** 含 **`guide.id`**（**B-GDE-003** / **MANUAL-P1** 窄口径 **E2E** 旁证；**真链质押**仍 **ISS-007**）。
 * **Payment rail (2026-07-08 SSOT):** **`mock-pay`** below = **chain_off sandbox only** (`P3_CHAIN_OFF=1` · ①/②).
 * **Production core payment** = USDC **Approve + Deposit** on Escrow (G3-02 · PAY-W01..W16) — **forbidden on prod**.
 *
 * - **F-025**：下单 → **`accept`** → **`mock-pay`**（**`P3_CHAIN_OFF`** · sandbox）→ **`POST …/orders/:id/dispute`** → **`GET /disputes`** / **`GET /disputes/:id`**（**B-DSP-002**）；同链再 **`GET …/orders/:id`** **`order.status=disputed`**（**B-TRN-003**）。**B-DSP-003** 见同文件 **`POST …/disputes/:id/resolve`**（须 API **`P3_SEED_ARBITRATOR_EMAIL`** 与 **`PLAYWRIGHT_ARBITRATOR_SEED_EMAIL`** 对齐，**CI** **`build.yml`·`e2e`** 已注入）。
 * - **F-026**：同上至 **`mock-pay`** → **`POST|GET …/orders/:id/messages`**（**B-MSG-002**）；**旅客 `POST`→向导 `GET` 同路径**（**B-MSG-002C** ↔ **`matrix_93_b_msg_002c_f026_*`**）。
 *
 * **环境**：**`DATABASE_URL`** + **`P3_CHAIN_OFF=1`**；**F-025/F-026** 须经 **`skipUnlessOrderMockPayAvailable`**（**`mock-pay`≠501**）。
 */
import { test, expect, type APIRequestContext } from "@playwright/test";

import { skipUnlessOrderMockPayAvailable } from "./helpers/skipUnlessOrderMockPayAvailable";

const API_HEALTH = process.env.PLAYWRIGHT_API_HEALTH_URL ?? "http://127.0.0.1:8080/health";
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? "http://127.0.0.1:8080";

/** 与 **`build.yml`·`e2e`** **`P3_SEED_ARBITRATOR_EMAIL`** 同源（**B-DSP-003** / **`matrix_93_b_dsp_003b_f025_*`**）。 */
const ARBITRATOR_SEED_EMAIL =
  process.env.PLAYWRIGHT_ARBITRATOR_SEED_EMAIL ?? "e2e-ci-arbitrator-seed@traveltrust.test";

async function bearerRegisterOrLoginArbitrator(request: APIRequestContext): Promise<string> {
  const reg = await request.post(`${API_BASE}/auth/register`, {
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
    const login = await request.post(`${API_BASE}/auth/login`, {
      headers: { "Content-Type": "application/json" },
      data: { email: ARBITRATOR_SEED_EMAIL, password: "TestPass12!" },
    });
    expect(login.ok(), `arb seed login ${login.status()}`).toBeTruthy();
    const lj = (await login.json()) as { status?: string; token?: string; role?: string };
    expect(lj.status).toBe("ok");
    expect(lj.role ?? "arbitrator").toBe("arbitrator");
    return lj.token?.trim() ?? "";
  }
  expect(reg.ok(), `arb seed register ${reg.status()} ${JSON.stringify(rj)}`).toBeTruthy();
  throw new Error(`arb seed register unexpected branch: ${reg.status()} ${JSON.stringify(rj)}`);
}

async function skipIfApiDown(request: APIRequestContext) {
  const health = await request.get(API_HEALTH).catch(() => null);
  if (!health?.ok()) {
    test.skip(true, `API not reachable at ${API_HEALTH}; start traveltrust-api`);
  }
}

test.describe.serial("§8.2 F-024/025/026 — guides stake list, disputes, order messages", () => {
  test("F-024 · stake then GET guides list includes active guide", async ({ request }) => {
    await skipIfApiDown(request);
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const guideEmail = `e2e-f024-g-${suffix}@traveltrust.test`;

    const regG = await request.post(`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email: guideEmail, password: "TestPass12!", nickname: "e2eF024G" },
    });
    expect(regG.ok()).toBeTruthy();
    const regGJ = (await regG.json()) as { status?: string; token?: string };
    expect(regGJ.status).toBe("ok");
    const tokenGuide = regGJ.token?.trim() ?? "";

    const gc = await request.post(`${API_BASE}/api/v1/guides`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
      },
      data: {
        city: "Shanghai",
        country_code: "CN",
        languages: ["zh"],
        service_types: ["walking"],
        bio: "e2e-f024 stake list",
      },
    });
    expect(gc.ok(), `POST guides ${gc.status()}`).toBeTruthy();
    const gcJ = (await gc.json()) as { guide?: { id?: string } };
    const guideRowId = gcJ.guide?.id ?? "";
    expect(guideRowId.length).toBeGreaterThan(0);

    const stake = await request.post(`${API_BASE}/api/v1/guides/${guideRowId}/stake`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
      },
      data: { amount: "100" },
    });
    expect(stake.ok(), `stake ${stake.status()}`).toBeTruthy();
    const sj = (await stake.json()) as { status?: string; guide_status?: string; stake_amount?: string };
    expect(sj.status).toBe("ok");
    // stake 成功体以 status/stake_amount 为准；guide_status 为历史字段，列表命中为 F-024 主断言
    if (sj.guide_status !== undefined) {
      expect(sj.guide_status).toBe("active");
    }

    const list = await request.get(`${API_BASE}/api/v1/guides?city=Shanghai`);
    expect(list.ok(), `GET guides ${list.status()}`).toBeTruthy();
    const lj = (await list.json()) as {
      status?: string;
      items?: Array<{ id?: string }>;
    };
    expect(lj.status).toBe("ok");
    const items = lj.items ?? [];
    expect(items.some((it) => it.id === guideRowId)).toBe(true);
  });

  test("F-025 · escrowed order open dispute then GET list and detail", async ({ request }) => {
    await skipIfApiDown(request);
    await skipUnlessOrderMockPayAvailable(request, API_BASE);
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const touristEmail = `e2e-f025-t-${suffix}@traveltrust.test`;
    const guideEmail = `e2e-f025-g-${suffix}@traveltrust.test`;

    const regT = await request.post(`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email: touristEmail, password: "TestPass12!", nickname: "e2eF25T" },
    });
    expect(regT.ok()).toBeTruthy();
    const tj = (await regT.json()) as { status?: string; token?: string };
    expect(tj.status).toBe("ok");
    const tokenTourist = tj.token?.trim() ?? "";

    const regG = await request.post(`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email: guideEmail, password: "TestPass12!", nickname: "e2eF25G" },
    });
    expect(regG.ok()).toBeTruthy();
    const gj = (await regG.json()) as { status?: string; token?: string };
    expect(gj.status).toBe("ok");
    const tokenGuide = gj.token?.trim() ?? "";

    const gc = await request.post(`${API_BASE}/api/v1/guides`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
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

    const stake = await request.post(`${API_BASE}/api/v1/guides/${guideRowId}/stake`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
      },
      data: { amount: "1" },
    });
    expect(stake.ok()).toBeTruthy();

    const create = await request.post(`${API_BASE}/api/v1/orders`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenTourist}`,
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

    const accept = await request.post(`${API_BASE}/api/v1/orders/${orderId}/accept`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
      },
      data: {},
    });
    expect(accept.ok(), `accept ${accept.status()}`).toBeTruthy();

    const pay = await request.post(`${API_BASE}/api/v1/orders/${orderId}/mock-pay`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenTourist}`,
      },
      data: {},
    });
    expect(pay.ok(), `mock-pay ${pay.status()}`).toBeTruthy();

    const open = await request.post(`${API_BASE}/api/v1/orders/${orderId}/dispute`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenTourist}`,
      },
      data: {},
    });
    expect(open.ok(), `open dispute ${open.status()}`).toBeTruthy();
    const openJ = (await open.json()) as {
      status?: string;
      dispute?: { id?: string; order_id?: string };
    };
    expect(openJ.status).toBe("ok");
    const disputeId = openJ.dispute?.id ?? "";
    expect(disputeId.length).toBeGreaterThan(0);
    expect(openJ.dispute?.order_id).toBe(orderId);

    const list = await request.get(`${API_BASE}/api/v1/disputes?limit=50`, {
      headers: { Authorization: `Bearer ${tokenTourist}` },
    });
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

    const detail = await request.get(`${API_BASE}/api/v1/disputes/${disputeId}`, {
      headers: { Authorization: `Bearer ${tokenTourist}` },
    });
    expect(detail.ok(), `GET dispute ${detail.status()}`).toBeTruthy();
    const dj = (await detail.json()) as {
      status?: string;
      dispute?: { id?: string; order_id?: string };
    };
    expect(dj.status).toBe("ok");
    expect(dj.dispute?.id).toBe(disputeId);
    expect(dj.dispute?.order_id).toBe(orderId);

    const ord = await request.get(`${API_BASE}/api/v1/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${tokenTourist}` },
    });
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

    const regT = await request.post(`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email: touristEmail, password: "TestPass12!", nickname: "e2eB3T" },
    });
    expect(regT.ok()).toBeTruthy();
    const tj = (await regT.json()) as { status?: string; token?: string };
    expect(tj.status).toBe("ok");
    const tokenTourist = tj.token?.trim() ?? "";

    const regG = await request.post(`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email: guideEmail, password: "TestPass12!", nickname: "e2eB3G" },
    });
    expect(regG.ok()).toBeTruthy();
    const gj = (await regG.json()) as { status?: string; token?: string };
    expect(gj.status).toBe("ok");
    const tokenGuide = gj.token?.trim() ?? "";

    const gc = await request.post(`${API_BASE}/api/v1/guides`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
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

    const stake = await request.post(`${API_BASE}/api/v1/guides/${guideRowId}/stake`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
      },
      data: { amount: "1" },
    });
    expect(stake.ok()).toBeTruthy();

    const create = await request.post(`${API_BASE}/api/v1/orders`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenTourist}`,
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

    const accept = await request.post(`${API_BASE}/api/v1/orders/${orderId}/accept`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
      },
      data: {},
    });
    expect(accept.ok()).toBeTruthy();

    const pay = await request.post(`${API_BASE}/api/v1/orders/${orderId}/mock-pay`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenTourist}`,
      },
      data: {},
    });
    expect(pay.ok()).toBeTruthy();

    const open = await request.post(`${API_BASE}/api/v1/orders/${orderId}/dispute`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenTourist}`,
      },
      data: { reason: "e2e_b_dsp_003" },
    });
    expect(open.ok()).toBeTruthy();
    const openJ = (await open.json()) as { status?: string; dispute?: { id?: string } };
    expect(openJ.status).toBe("ok");
    const disputeId = openJ.dispute?.id ?? "";
    expect(disputeId.length).toBeGreaterThan(0);

    const tokenArb = await bearerRegisterOrLoginArbitrator(request);

    const resolve = await request.post(`${API_BASE}/api/v1/disputes/${disputeId}/resolve`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenArb}`,
      },
      data: { refund_ratio: 1.0, slash_guide: false },
    });
    expect(resolve.ok(), `resolve ${resolve.status()}`).toBeTruthy();
    const rv = (await resolve.json()) as { status?: string; dispute?: { status?: string } };
    expect(rv.status).toBe("ok");
    expect(rv.dispute?.status).toBe("resolved");

    const detail = await request.get(`${API_BASE}/api/v1/disputes/${disputeId}`, {
      headers: { Authorization: `Bearer ${tokenTourist}` },
    });
    expect(detail.ok()).toBeTruthy();
    const dj = (await detail.json()) as { status?: string; dispute?: { status?: string } };
    expect(dj.status).toBe("ok");
    expect(dj.dispute?.status).toBe("resolved");
  });

  test("F-026 · POST order message then GET lists content", async ({ request }) => {
    await skipIfApiDown(request);
    await skipUnlessOrderMockPayAvailable(request, API_BASE);
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const touristEmail = `e2e-f026-t-${suffix}@traveltrust.test`;
    const guideEmail = `e2e-f026-g-${suffix}@traveltrust.test`;

    const regT = await request.post(`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email: touristEmail, password: "TestPass12!", nickname: "e2eF26T" },
    });
    expect(regT.ok()).toBeTruthy();
    const tj = (await regT.json()) as { status?: string; token?: string };
    expect(tj.status).toBe("ok");
    const tokenTourist = tj.token?.trim() ?? "";

    const regG = await request.post(`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email: guideEmail, password: "TestPass12!", nickname: "e2eF26G" },
    });
    expect(regG.ok()).toBeTruthy();
    const gj = (await regG.json()) as { status?: string; token?: string };
    expect(gj.status).toBe("ok");
    const tokenGuide = gj.token?.trim() ?? "";

    const gc = await request.post(`${API_BASE}/api/v1/guides`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
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

    await request.post(`${API_BASE}/api/v1/guides/${guideRowId}/stake`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
      },
      data: { amount: "1" },
    });

    const create = await request.post(`${API_BASE}/api/v1/orders`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenTourist}`,
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

    await request.post(`${API_BASE}/api/v1/orders/${orderId}/accept`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
      },
      data: {},
    });
    await request.post(`${API_BASE}/api/v1/orders/${orderId}/mock-pay`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenTourist}`,
      },
      data: {},
    });

    const line = `e2e-f026-msg-${suffix}`;
    const post = await request.post(`${API_BASE}/api/v1/orders/${orderId}/messages`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenTourist}`,
      },
      data: { content: line },
    });
    expect(post.ok(), `POST messages ${post.status()}`).toBeTruthy();
    const pj = (await post.json()) as { status?: string; message?: { content?: string } };
    expect(pj.status).toBe("ok");
    expect(pj.message?.content).toBe(line);

    const get = await request.get(`${API_BASE}/api/v1/orders/${orderId}/messages`, {
      headers: { Authorization: `Bearer ${tokenTourist}` },
    });
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

    const regT = await request.post(`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email: touristEmail, password: "TestPass12!", nickname: "e2eF26cT" },
    });
    expect(regT.ok()).toBeTruthy();
    const tj = (await regT.json()) as { status?: string; token?: string };
    expect(tj.status).toBe("ok");
    const tokenTourist = tj.token?.trim() ?? "";

    const regG = await request.post(`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email: guideEmail, password: "TestPass12!", nickname: "e2eF26cG" },
    });
    expect(regG.ok()).toBeTruthy();
    const gj = (await regG.json()) as { status?: string; token?: string };
    expect(gj.status).toBe("ok");
    const tokenGuide = gj.token?.trim() ?? "";

    const gc = await request.post(`${API_BASE}/api/v1/guides`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
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

    await request.post(`${API_BASE}/api/v1/guides/${guideRowId}/stake`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
      },
      data: { amount: "1" },
    });

    const create = await request.post(`${API_BASE}/api/v1/orders`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenTourist}`,
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

    await request.post(`${API_BASE}/api/v1/orders/${orderId}/accept`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
      },
      data: {},
    });
    await request.post(`${API_BASE}/api/v1/orders/${orderId}/mock-pay`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenTourist}`,
      },
      data: {},
    });

    const line = `e2e-f026c-msg-${suffix}`;
    const post = await request.post(`${API_BASE}/api/v1/orders/${orderId}/messages`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenTourist}`,
      },
      data: { content: line },
    });
    expect(post.ok(), `POST messages ${post.status()}`).toBeTruthy();
    const pj = (await post.json()) as { status?: string; message?: { content?: string } };
    expect(pj.status).toBe("ok");
    expect(pj.message?.content).toBe(line);

    const getG = await request.get(`${API_BASE}/api/v1/orders/${orderId}/messages`, {
      headers: { Authorization: `Bearer ${tokenGuide}` },
    });
    expect(getG.ok(), `guide GET messages ${getG.status()}`).toBeTruthy();
    const mg = (await getG.json()) as {
      status?: string;
      items?: Array<{ content?: string }>;
    };
    expect(mg.status).toBe("ok");
    expect((mg.items ?? []).some((m) => m.content === line)).toBe(true);
  });
});
