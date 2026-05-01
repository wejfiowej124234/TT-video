/**
 * **TT-93 P2 子切片** — **`POST /api/v1/orders/:id/accept`**（Playwright **`request`**，无浏览器）。
 *
 * **不**覆盖 **`/guide`** 工作台 UI；**不**替代 **93** 正文 **P2** **PASS** 收口（须仍回写 **93** / **R-002 §4**）。
 * **互指**：`docs/runbook/TT-93-guide-schedule-next-001.md`。
 *
 * **环境**：**`DATABASE_URL`** + **`P3_CHAIN_OFF=1`**（与 **`f021-f022-f023-request`** 等 **`request`** 族同口径）。
 * **窄跑**：**`PLAYWRIGHT_E2E_NO_WEBSERVER=1`**（见 **`playwright.config.ts`**）。
 */
import { test, expect, type APIRequestContext } from "@playwright/test";

const API_HEALTH = process.env.PLAYWRIGHT_API_HEALTH_URL ?? "http://127.0.0.1:8080/health";
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? "http://127.0.0.1:8080";

async function skipIfApiDown(request: APIRequestContext) {
  const health = await request.get(API_HEALTH).catch(() => null);
  if (!health?.ok()) {
    test.skip(true, `API not reachable at ${API_HEALTH}; start traveltrust-api`);
  }
}

test("TT-93 · guide registers → stake → tourist creates order → POST accept (200)", async ({
  request,
}) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const touristEmail = `e2e-tt93-t-${suffix}@traveltrust.test`;
  const guideEmail = `e2e-tt93-g-${suffix}@traveltrust.test`;

  const regT = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: touristEmail, password: "TestPass12!", nickname: "e2eTT93T" },
  });
  expect(regT.ok()).toBeTruthy();
  const tj = (await regT.json()) as { status?: string; token?: string };
  expect(tj.status).toBe("ok");
  const tokenTourist = tj.token?.trim() ?? "";

  const regG = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: guideEmail, password: "TestPass12!", nickname: "e2eTT93G" },
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
      bio: "e2e-tt93-accept",
    },
  });
  expect(gc.ok(), `POST guides ${gc.status()}`).toBeTruthy();
  const guideRowId = ((await gc.json()) as { guide?: { id?: string } }).guide?.id ?? "";
  expect(guideRowId.length).toBeGreaterThan(0);

  const stake = await request.post(`${API_BASE}/api/v1/guides/${guideRowId}/stake`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenGuide}`,
    },
    data: { amount: "1" },
  });
  expect(stake.ok(), `stake ${stake.status()}`).toBeTruthy();

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
  expect(accept.ok(), `accept ${accept.status()} ${await accept.text()}`).toBeTruthy();
  const accJ = (await accept.json()) as { status?: string; order?: { status?: string } };
  expect(accJ.status).toBe("ok");
  expect((accJ.order?.status ?? "").toLowerCase()).toContain("accept");
});
