/**
 * **§8.2 · F-027 / F-028 / F-033** — Playwright **`request`**（与 **`review_submit_db_pool_idempotent_contract`** /
 * **`idempotency_http_contract_tests`** / **`matrix_93_d_itn_002_f033_*`** 同形）。
 *
 * - **F-027**：订单 **`accept`→`mock-pay`→`POST …/confirm-completion`（向导）** → **`POST …/reviews`（旅客）** → **`GET …/reviews`** **`items`** 含 **`comment`**（**B-ESC-003**）。
 * - **F-028**：**`REQUIRE_IDEMPOTENCY_KEY=1`** 下 **`POST /api/v1/trust-growth/ingest`** 同 **`Idempotency-Key`** 双发 → **HTTP 200** 且 **JSON 体逐字一致**（**B-IDM-001**）。
 * - **F-033**：**`POST /api/v1/itineraries/custom`** → **`POST …/custom/drafts`** → **`GET …/custom/drafts/:id`**（**D-ITN-002** + **D-ITN-003** **`matrix_93_d_itn_003b_f033_*`** ↔ **R-002** **`gen-r002-iss007-prereport`** **锚** + **PG 草稿**）。
 *
 * **环境**：**`DATABASE_URL`** + **`P3_CHAIN_OFF=1`**；**F-027** 须经 **`skipUnlessOrderMockPayAvailable`**；**F-028** 须经 **`REQUIRE_IDEMPOTENCY_KEY=1`**（由 **`e2e:api-f027-f028-f033-local`** 脚本注入）。该模式下 **所有变异 POST**（含 **`/auth/register`**）须带 **`Idempotency-Key`**。
 */
import { test, expect, type APIRequestContext } from "@playwright/test";

import { skipUnlessOrderMockPayAvailable } from "./helpers/skipUnlessOrderMockPayAvailable";

const API_HEALTH = process.env.PLAYWRIGHT_API_HEALTH_URL ?? "http://127.0.0.1:8080/health";
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? "http://127.0.0.1:8080";

/** `REQUIRE_IDEMPOTENCY_KEY=1` 时写路径门禁；每请求唯一键，避免与幂等缓存碰撞。 */
function jsonWriteHeaders(idemKey: string, bearerToken?: string): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    "Idempotency-Key": idemKey,
  };
  if (bearerToken) {
    h.Authorization = `Bearer ${bearerToken}`;
  }
  return h;
}

async function skipIfApiDown(request: APIRequestContext) {
  const health = await request.get(API_HEALTH).catch(() => null);
  if (!health?.ok()) {
    test.skip(true, `API not reachable at ${API_HEALTH}; start traveltrust-api`);
  }
}

test.describe.serial("§8.2 F-027/028/033 — reviews, idempotency replay, custom itinerary drafts", () => {
  test("F-027 · completed order POST review then GET lists comment", async ({ request }) => {
    await skipIfApiDown(request);
    await skipUnlessOrderMockPayAvailable(request, API_BASE);

    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const touristEmail = `e2e-f027-t-${suffix}@traveltrust.test`;
    const guideEmail = `e2e-f027-g-${suffix}@traveltrust.test`;

    const regT = await request.post(`${API_BASE}/auth/register`, {
      headers: jsonWriteHeaders(`e2e-f027-reg-t-${suffix}`),
      data: { email: touristEmail, password: "TestPass12!", nickname: "e2eF27T" },
    });
    expect(regT.ok()).toBeTruthy();
    const tj = (await regT.json()) as { status?: string; token?: string };
    expect(tj.status).toBe("ok");
    const tokenTourist = tj.token?.trim() ?? "";

    const regG = await request.post(`${API_BASE}/auth/register`, {
      headers: jsonWriteHeaders(`e2e-f027-reg-g-${suffix}`),
      data: { email: guideEmail, password: "TestPass12!", nickname: "e2eF27G" },
    });
    expect(regG.ok()).toBeTruthy();
    const gj = (await regG.json()) as { status?: string; token?: string };
    expect(gj.status).toBe("ok");
    const tokenGuide = gj.token?.trim() ?? "";

    const gc = await request.post(`${API_BASE}/api/v1/guides`, {
      headers: jsonWriteHeaders(`e2e-f027-guides-${suffix}`, tokenGuide),
      data: {
        city: "Shanghai",
        country_code: "CN",
        languages: ["zh"],
        service_types: ["walking"],
        bio: "e2e-f027",
      },
    });
    expect(gc.ok()).toBeTruthy();
    const guideRowId =
      ((await gc.json()) as { guide?: { id?: string } }).guide?.id ?? "";
    expect(guideRowId.length).toBeGreaterThan(0);

    const stake = await request.post(`${API_BASE}/api/v1/guides/${guideRowId}/stake`, {
      headers: jsonWriteHeaders(`e2e-f027-stake-${suffix}`, tokenGuide),
      data: { amount: "1" },
    });
    expect(stake.ok()).toBeTruthy();

    const create = await request.post(`${API_BASE}/api/v1/orders`, {
      headers: jsonWriteHeaders(`e2e-f027-order-create-${suffix}`, tokenTourist),
      data: {
        guide_id: guideRowId,
        amount: "100",
        currency: "USD",
      },
    });
    expect(create.ok()).toBeTruthy();
    const orderId =
      ((await create.json()) as { order?: { id?: string } }).order?.id ?? "";
    expect(orderId.length).toBeGreaterThan(0);

    const accept = await request.post(`${API_BASE}/api/v1/orders/${orderId}/accept`, {
      headers: jsonWriteHeaders(`e2e-f027-accept-${suffix}`, tokenGuide),
      data: {},
    });
    expect(accept.ok()).toBeTruthy();

    const pay = await request.post(`${API_BASE}/api/v1/orders/${orderId}/mock-pay`, {
      headers: jsonWriteHeaders(`e2e-f027-mock-pay-${suffix}`, tokenTourist),
      data: {},
    });
    expect(pay.ok()).toBeTruthy();

    const done = await request.post(`${API_BASE}/api/v1/orders/${orderId}/confirm-completion`, {
      headers: jsonWriteHeaders(`e2e-f027-confirm-${suffix}`, tokenGuide),
      data: {},
    });
    expect(done.ok(), `confirm-completion ${done.status()}`).toBeTruthy();

    const comment = `e2e-f027-rev-${suffix}`;
    const idemReview =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `e2e-f027-rev-idem-${suffix}`;
    const rev = await request.post(`${API_BASE}/api/v1/orders/${orderId}/reviews`, {
      headers: jsonWriteHeaders(idemReview, tokenTourist),
      data: { score: 5, comment },
    });
    expect(rev.ok(), `POST reviews ${rev.status()}`).toBeTruthy();
    const rv = (await rev.json()) as { status?: string };
    expect(rv.status).toBe("ok");

    const list = await request.get(`${API_BASE}/api/v1/orders/${orderId}/reviews`, {
      headers: { Authorization: `Bearer ${tokenTourist}` },
    });
    expect(list.ok(), `GET reviews ${list.status()}`).toBeTruthy();
    const lj = (await list.json()) as {
      status?: string;
      items?: Array<{ comment?: string | null }>;
    };
    expect(lj.status).toBe("ok");
    const items = lj.items ?? [];
    expect(items.some((it) => it.comment === comment)).toBe(true);
  });

  test("F-028 · trust-growth ingest duplicate Idempotency-Key returns identical JSON body", async ({
    request,
  }) => {
    await skipIfApiDown(request);
    if ((process.env.REQUIRE_IDEMPOTENCY_KEY ?? "").trim() !== "1") {
      test.skip(
        true,
        "REQUIRE_IDEMPOTENCY_KEY=1 required (set by npm run e2e:api-f027-f028-f033-local)",
      );
    }

    const run = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const idemKey = `e2e-f028-${run}`;
    const payload = {
      event: "trust_growth_moment_view",
      payload: { moment: `e2e_m_${run}`, variant_id: `e2e_v_${run}` },
    };

    const res1 = await request.post(`${API_BASE}/api/v1/trust-growth/ingest`, {
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idemKey,
      },
      data: payload,
    });
    expect(res1.ok(), `first ingest ${res1.status()}`).toBeTruthy();
    const j1 = (await res1.json()) as Record<string, unknown>;

    const res2 = await request.post(`${API_BASE}/api/v1/trust-growth/ingest`, {
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idemKey,
      },
      data: payload,
    });
    expect(res2.ok(), `second ingest ${res2.status()}`).toBeTruthy();
    const j2 = (await res2.json()) as Record<string, unknown>;
    expect(j2).toEqual(j1);
    expect(j1.ok).toBe(true);
    expect(j1.status).toBe("ok");
  });

  test("F-033 · POST custom itinerary then draft POST+GET round-trip", async ({ request }) => {
    await skipIfApiDown(request);

    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const email = `e2e-f033-${suffix}@traveltrust.test`;

    const reg = await request.post(`${API_BASE}/auth/register`, {
      headers: jsonWriteHeaders(`e2e-f033-reg-${suffix}`),
      data: { email, password: "TestPass12!", nickname: "e2eF33" },
    });
    expect(reg.ok()).toBeTruthy();
    const rj = (await reg.json()) as { status?: string; token?: string };
    expect(rj.status).toBe("ok");
    const token = rj.token?.trim() ?? "";

    const custom = await request.post(`${API_BASE}/api/v1/itineraries/custom`, {
      headers: jsonWriteHeaders(`e2e-f033-custom-${suffix}`, token),
      data: {
        creator_type: "tourist",
        country: "中国",
        total_days: 2,
        amount: 1500,
        currency: "USD",
        day_plans: [
          { city: "北京", attractions: ["故宫"], food: [], hotel: "Hotel A" },
          { city: "上海", attractions: [], food: ["小笼"], hotel: null },
        ],
      },
    });
    expect(custom.ok(), `POST custom ${custom.status()}`).toBeTruthy();
    const cj = (await custom.json()) as { status?: string; order_id?: string; order_status?: string };
    expect(cj.status).toBe("ok");
    expect(cj.order_status).toBe("draft");
    expect((cj.order_id ?? "").length).toBeGreaterThan(0);

    const draftPost = await request.post(`${API_BASE}/api/v1/itineraries/custom/drafts`, {
      headers: jsonWriteHeaders(`e2e-f033-draft-${suffix}`, token),
      data: { payload: { note: `e2e-f033-${suffix}` } },
    });
    expect(draftPost.ok(), `POST drafts ${draftPost.status()}`).toBeTruthy();
    const dj = (await draftPost.json()) as { status?: string; draft_id?: string };
    expect(dj.status).toBe("ok");
    const draftId = dj.draft_id ?? "";
    expect(draftId.length).toBeGreaterThan(0);

    const draftGet = await request.get(
      `${API_BASE}/api/v1/itineraries/custom/drafts/${encodeURIComponent(draftId)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(draftGet.ok(), `GET draft ${draftGet.status()}`).toBeTruthy();
    const gj = (await draftGet.json()) as { status?: string; draft_id?: string };
    expect(gj.status).toBe("ok");
    expect(gj.draft_id).toBe(draftId);
  });
});
