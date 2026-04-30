/**
 * **§8.2 · F-008 / F-009 / F-011（B 域订单）** — Playwright **`request`** 直连 **traveltrust-api**（与 **95 §8.2** E2E 列互证）。
 *
 * - **F-008**：注册旅客/向导 → **`POST /api/v1/guides`** → **`POST …/guides/:id/stake`** → **`POST /api/v1/orders`** **200** + **`status=ok`** + **`order.id`**。
 * - **F-009**：**`GET /api/v1/orders`** → **`items`** 含上一步 **`order.id`**。
 * - **F-011**：**`POST /api/v1/orders/:id/set-escrow-address`** → **`GET /api/v1/orders/:id`** 读回 **`order.escrow_address`**（链下占位地址；**真链托管**仍 **ISS-007**）。
 *
 * **环境**：**`PLAYWRIGHT_API_BASE_URL`**、**`PLAYWRIGHT_API_HEALTH_URL`**；须 **PG** + **`DATABASE_URL`**（由 **`start-api-for-playwright`** 注入）；**`P3_CHAIN_OFF=1`** 与 **`e2e:api-b-orders-local`** 脚本一致。
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

test.describe.serial("§8.2 E2E F-008/009/011 — B-domain orders (request)", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const touristEmail = `e2e-b-ord-t-${suffix}@traveltrust.test`;
  const guideEmail = `e2e-b-ord-g-${suffix}@traveltrust.test`;
  let tokenTourist = "";
  let tokenGuide = "";
  let guideRowId = "";
  let orderId = "";
  const escrowAddr = "0x1234567890123456789012345678901234567890";

  test("F-008 · register + guide + stake + POST /api/v1/orders", async ({ request }) => {
    await skipIfApiDown(request);

    const regT = await request.post(`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: {
        email: touristEmail,
        password: "TestPass12!",
        nickname: "e2eBTourist",
      },
    });
    expect(regT.ok(), `tourist register HTTP ${regT.status()}`).toBeTruthy();
    const regTJ = (await regT.json()) as { status?: string; token?: string };
    expect(regTJ.status).toBe("ok");
    tokenTourist = regTJ.token?.trim() ?? "";
    expect(tokenTourist.length).toBeGreaterThan(0);

    const regG = await request.post(`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: {
        email: guideEmail,
        password: "TestPass12!",
        nickname: "e2eBGuide",
      },
    });
    expect(regG.ok(), `guide register HTTP ${regG.status()}`).toBeTruthy();
    const regGJ = (await regG.json()) as { status?: string; token?: string };
    expect(regGJ.status).toBe("ok");
    tokenGuide = regGJ.token?.trim() ?? "";
    expect(tokenGuide.length).toBeGreaterThan(0);

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
      },
    });
    expect(gc.ok(), `POST guides HTTP ${gc.status()}`).toBeTruthy();
    const gcJ = (await gc.json()) as { guide?: { id?: string } };
    guideRowId = gcJ.guide?.id ?? "";
    expect(guideRowId.length).toBeGreaterThan(0);

    const stake = await request.post(`${API_BASE}/api/v1/guides/${guideRowId}/stake`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenGuide}`,
      },
      data: { amount: "1" },
    });
    expect(stake.ok(), `stake HTTP ${stake.status()}`).toBeTruthy();

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
    expect(create.ok(), `POST orders HTTP ${create.status()}`).toBeTruthy();
    const cj = (await create.json()) as {
      status?: string;
      order?: { id?: string; status?: string };
    };
    expect(cj.status).toBe("ok");
    orderId = cj.order?.id ?? "";
    expect(orderId.length).toBeGreaterThan(0);
    expect(cj.order?.status).toBe("created");
  });

  test("F-009 · GET /api/v1/orders includes created order", async ({ request }) => {
    await skipIfApiDown(request);
    const list = await request.get(`${API_BASE}/api/v1/orders`, {
      headers: { Authorization: `Bearer ${tokenTourist}` },
    });
    expect(list.ok(), `GET orders HTTP ${list.status()}`).toBeTruthy();
    const lj = (await list.json()) as { items?: Array<{ id?: string }> };
    const items = lj.items ?? [];
    expect(items.some((it) => it.id === orderId)).toBe(true);
  });

  test("F-011 · set-escrow-address then GET detail read-back", async ({ request }) => {
    await skipIfApiDown(request);
    const setEsc = await request.post(
      `${API_BASE}/api/v1/orders/${orderId}/set-escrow-address`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenTourist}`,
        },
        data: { escrow_address: escrowAddr },
      },
    );
    expect(setEsc.ok(), `set-escrow HTTP ${setEsc.status()}`).toBeTruthy();
    const sj = (await setEsc.json()) as { status?: string; escrow_address?: string };
    expect(sj.status).toBe("ok");
    expect(sj.escrow_address).toBe(escrowAddr);

    const detail = await request.get(`${API_BASE}/api/v1/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${tokenTourist}` },
    });
    expect(detail.ok(), `GET order HTTP ${detail.status()}`).toBeTruthy();
    const dj = (await detail.json()) as { order?: { escrow_address?: string } };
    expect(dj.order?.escrow_address).toBe(escrowAddr);
  });
});
