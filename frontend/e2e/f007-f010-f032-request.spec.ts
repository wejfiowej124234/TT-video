/**
 * **§8.2 · F-007 / F-010 / F-032** — Playwright **`request`**（与 **`me_profile_avatar_db_api_tests`** /
 * **`orders_accept_mock_pay_itinerary_confirm_db_api_tests`** / **`trust_growth_api_tests`** 同形）。
 *
 * - **F-007**：**`TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR=1`** 下 **`POST /api/v1/me/profile-avatar`**（**`data:image/jpeg;base64,…`**）→ **`GET /api/v1/me`** **`user.avatar_url`** 为 **`/api/v1/uploads/profile-avatars/<user>.jpg`**（**A-AVA-001** 本机子链；**不**闭 **ISS-008** **S3**）。
 * - **F-010**：**`accept`→`POST …/mock-pay`→`order.status`** **`escrowed`** + **`GET …/orders/:id`** 一致（**B-ESC-001**）；向导 **`POST …/confirm-completion`→`completed`** + 旅客 **`GET …/orders/:id`** 一致（**B-ESC-002**）。
 * - **F-032**：**`GET /api/v1/trust-growth/config`** **`status=ok`** **`pgrow3.storage`** **`postgres`**（**B-TGR-001** 读路径）。
 *
 * **环境**：**`DATABASE_URL`** + **`P3_CHAIN_OFF=1`**；**F-010** 须经 **`skipUnlessOrderMockPayAvailable`**；**F-007** 须 **`TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR=1`**（由 **`e2e:api-f007-f010-f032-local`** 注入）。
 */
import { test, expect, type APIRequestContext } from "@playwright/test";

import { skipUnlessOrderMockPayAvailable } from "./helpers/skipUnlessOrderMockPayAvailable";

const API_HEALTH = process.env.PLAYWRIGHT_API_HEALTH_URL ?? "http://127.0.0.1:8080/health";
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? "http://127.0.0.1:8080";

/** 与 **`me_profile_avatar_db_api_tests::MIN_JPEG_1X1`** 同源之 **1×1** JPEG 字节。 */
const MIN_JPEG_1X1 = Uint8Array.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xff, 0xc4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x37, 0xff, 0xd9,
]);

function jsonHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

async function skipIfApiDown(request: APIRequestContext) {
  const health = await request.get(API_HEALTH).catch(() => null);
  if (!health?.ok()) {
    test.skip(true, `API not reachable at ${API_HEALTH}; start traveltrust-api`);
  }
}

test.describe.serial("§8.2 F-007/010/032 — profile-avatar local, mock-pay escrowed, trust-growth config", () => {
  test("F-007 · POST profile-avatar (local allow) then GET /me has avatar_url", async ({ request }) => {
    await skipIfApiDown(request);
    if ((process.env.TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR ?? "").trim() !== "1") {
      test.skip(
        true,
        "TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR=1 required (set by npm run e2e:api-f007-f010-f032-local)",
      );
    }

    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const email = `e2e-f007-${suffix}@traveltrust.test`;
    const reg = await request.post(`${API_BASE}/auth/register`, {
      headers: jsonHeaders(),
      data: { email, password: "TestPass12!", nickname: "e2eF07" },
    });
    expect(reg.ok(), `register ${reg.status()}`).toBeTruthy();
    const rj = (await reg.json()) as { status?: string; token?: string };
    expect(rj.status).toBe("ok");
    const token = rj.token?.trim() ?? "";
    expect(token.length).toBeGreaterThan(0);

    const b64 = Buffer.from(MIN_JPEG_1X1).toString("base64");
    const dataUrl = `data:image/jpeg;base64,${b64}`;
    const postAv = await request.post(`${API_BASE}/api/v1/me/profile-avatar`, {
      headers: { ...jsonHeaders(), Authorization: `Bearer ${token}` },
      data: { content_base64: dataUrl },
    });
    expect(postAv.ok(), `profile-avatar ${postAv.status()} ${await postAv.text()}`).toBeTruthy();
    const pj = (await postAv.json()) as { avatar_url?: string };
    expect(pj.avatar_url).toBeTruthy();
    expect(pj.avatar_url).toMatch(/^\/api\/v1\/uploads\/profile-avatars\/[0-9a-f-]+\.jpg$/i);

    const me = await request.get(`${API_BASE}/api/v1/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(me.ok(), `GET /me ${me.status()}`).toBeTruthy();
    const mj = (await me.json()) as { user?: { avatar_url?: string | null } };
    expect(mj.user?.avatar_url).toBe(pj.avatar_url);
  });

  test("F-010 · accept then mock-pay leaves order escrowed (GET confirms)", async ({ request }) => {
    await skipIfApiDown(request);
    await skipUnlessOrderMockPayAvailable(request, API_BASE);

    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const touristEmail = `e2e-f010-t-${suffix}@traveltrust.test`;
    const guideEmail = `e2e-f010-g-${suffix}@traveltrust.test`;

    const regT = await request.post(`${API_BASE}/auth/register`, {
      headers: jsonHeaders(),
      data: { email: touristEmail, password: "TestPass12!", nickname: "e2eF10T" },
    });
    expect(regT.ok()).toBeTruthy();
    const tj = (await regT.json()) as { status?: string; token?: string };
    expect(tj.status).toBe("ok");
    const tokenTourist = tj.token?.trim() ?? "";

    const regG = await request.post(`${API_BASE}/auth/register`, {
      headers: jsonHeaders(),
      data: { email: guideEmail, password: "TestPass12!", nickname: "e2eF10G" },
    });
    expect(regG.ok()).toBeTruthy();
    const gj = (await regG.json()) as { status?: string; token?: string };
    expect(gj.status).toBe("ok");
    const tokenGuide = gj.token?.trim() ?? "";

    const gc = await request.post(`${API_BASE}/api/v1/guides`, {
      headers: { ...jsonHeaders(), Authorization: `Bearer ${tokenGuide}` },
      data: {
        city: "Shanghai",
        country_code: "CN",
        languages: ["zh"],
        service_types: ["walking"],
        bio: "e2e-f010",
      },
    });
    expect(gc.ok()).toBeTruthy();
    const guideRowId =
      ((await gc.json()) as { guide?: { id?: string } }).guide?.id ?? "";
    expect(guideRowId.length).toBeGreaterThan(0);

    const stake = await request.post(`${API_BASE}/api/v1/guides/${guideRowId}/stake`, {
      headers: { ...jsonHeaders(), Authorization: `Bearer ${tokenGuide}` },
      data: { amount: "1" },
    });
    expect(stake.ok()).toBeTruthy();

    const create = await request.post(`${API_BASE}/api/v1/orders`, {
      headers: { ...jsonHeaders(), Authorization: `Bearer ${tokenTourist}` },
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
      headers: { ...jsonHeaders(), Authorization: `Bearer ${tokenGuide}` },
      data: {},
    });
    expect(accept.ok()).toBeTruthy();

    const pay = await request.post(`${API_BASE}/api/v1/orders/${orderId}/mock-pay`, {
      headers: { ...jsonHeaders(), Authorization: `Bearer ${tokenTourist}` },
      data: {},
    });
    expect(pay.ok(), `mock-pay ${pay.status()}`).toBeTruthy();
    const payJ = (await pay.json()) as {
      status?: string;
      order?: { status?: string; escrowed_at?: string };
    };
    expect(payJ.status).toBe("ok");
    expect(payJ.order?.status).toBe("escrowed");
    expect(typeof payJ.order?.escrowed_at).toBe("string");

    const get = await request.get(`${API_BASE}/api/v1/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${tokenTourist}` },
    });
    expect(get.ok()).toBeTruthy();
    const og = (await get.json()) as { order?: { status?: string } };
    expect(og.order?.status).toBe("escrowed");
  });

  test("F-010 · mock-pay then guide POST confirm-completion leaves order completed (GET confirms)", async ({
    request,
  }) => {
    await skipIfApiDown(request);
    await skipUnlessOrderMockPayAvailable(request, API_BASE);

    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const touristEmail = `e2e-f010cc-t-${suffix}@traveltrust.test`;
    const guideEmail = `e2e-f010cc-g-${suffix}@traveltrust.test`;

    const regT = await request.post(`${API_BASE}/auth/register`, {
      headers: jsonHeaders(),
      data: { email: touristEmail, password: "TestPass12!", nickname: "e2eF10ccT" },
    });
    expect(regT.ok()).toBeTruthy();
    const tj = (await regT.json()) as { status?: string; token?: string };
    expect(tj.status).toBe("ok");
    const tokenTourist = tj.token?.trim() ?? "";

    const regG = await request.post(`${API_BASE}/auth/register`, {
      headers: jsonHeaders(),
      data: { email: guideEmail, password: "TestPass12!", nickname: "e2eF10ccG" },
    });
    expect(regG.ok()).toBeTruthy();
    const gj = (await regG.json()) as { status?: string; token?: string };
    expect(gj.status).toBe("ok");
    const tokenGuide = gj.token?.trim() ?? "";

    const gc = await request.post(`${API_BASE}/api/v1/guides`, {
      headers: { ...jsonHeaders(), Authorization: `Bearer ${tokenGuide}` },
      data: {
        city: "Shanghai",
        country_code: "CN",
        languages: ["zh"],
        service_types: ["walking"],
        bio: "e2e-f010-b-esc-002",
      },
    });
    expect(gc.ok()).toBeTruthy();
    const guideRowId =
      ((await gc.json()) as { guide?: { id?: string } }).guide?.id ?? "";
    expect(guideRowId.length).toBeGreaterThan(0);

    const stake = await request.post(`${API_BASE}/api/v1/guides/${guideRowId}/stake`, {
      headers: { ...jsonHeaders(), Authorization: `Bearer ${tokenGuide}` },
      data: { amount: "1" },
    });
    expect(stake.ok()).toBeTruthy();

    const create = await request.post(`${API_BASE}/api/v1/orders`, {
      headers: { ...jsonHeaders(), Authorization: `Bearer ${tokenTourist}` },
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
      headers: { ...jsonHeaders(), Authorization: `Bearer ${tokenGuide}` },
      data: {},
    });
    expect(accept.ok()).toBeTruthy();

    const pay = await request.post(`${API_BASE}/api/v1/orders/${orderId}/mock-pay`, {
      headers: { ...jsonHeaders(), Authorization: `Bearer ${tokenTourist}` },
      data: {},
    });
    expect(pay.ok(), `mock-pay ${pay.status()}`).toBeTruthy();

    const cc = await request.post(
      `${API_BASE}/api/v1/orders/${orderId}/confirm-completion`,
      {
        headers: { ...jsonHeaders(), Authorization: `Bearer ${tokenGuide}` },
      },
    );
    expect(cc.ok(), `confirm-completion ${cc.status()} ${await cc.text()}`).toBeTruthy();
    const ccJ = (await cc.json()) as { status?: string; order?: { status?: string } };
    expect(ccJ.status).toBe("ok");
    expect(ccJ.order?.status).toBe("completed");

    const get = await request.get(`${API_BASE}/api/v1/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${tokenTourist}` },
    });
    expect(get.ok()).toBeTruthy();
    const og = (await get.json()) as { order?: { status?: string } };
    expect(og.order?.status).toBe("completed");
  });

  test("F-032 · GET trust-growth/config returns ok + postgres storage hint", async ({ request }) => {
    await skipIfApiDown(request);

    const res = await request.get(`${API_BASE}/api/v1/trust-growth/config`);
    expect(res.ok(), `GET trust-growth/config ${res.status()}`).toBeTruthy();
    const j = (await res.json()) as {
      status?: string;
      ok?: boolean;
      pgrow3?: { storage?: string };
    };
    expect(j.status).toBe("ok");
    expect(j.ok).toBe(true);
    expect(j.pgrow3?.storage).toBe("postgres");
  });
});
