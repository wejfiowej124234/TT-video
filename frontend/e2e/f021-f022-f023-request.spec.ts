/**
 * **§8.2 · F-021 / F-022 / F-023** — Playwright **`request`** 直连 **traveltrust-api**（与 **`market_subsite_catalog_db_api_tests`** / **`guides_disputes_db_api_tests`** 同形）。
 *
 * - **F-021**：登录后 **`POST /api/v1/market/provider/listings`**（**`payload.kind=merchant_showcase_studio_v1`**）→ **`GET …/market/provider/listings`** **`items`** 含 **`listing_id`**（**B-MKT-005**）；无头 **`GET …/market/provider/listings/:id`** **`listing.id`** 一致（**B-MKT-009**）。
 * - **F-022**：同上 **`acquisition`** / **`acquisition_carry_studio_v1`**（**B-MKT-006**）；无头 **`GET …/market/acquisition/listings/:id`** **`listing.id`** 一致（**B-MKT-010**）。
 * - **F-023**：**`POST /api/v1/guides`** → **`GET /api/v1/guides/:id`** / **`GET …/availability`**（**`Authorization: Bearer`**；全 **`app()`** 经 **`auth_placeholder_layer`**，**非** 裸 **`guides::router()`** **oneshot**）。
 *
 * **环境**：**`DATABASE_URL`** + **`P3_CHAIN_OFF=1`**（与其它 **`e2e:api-*-local`** 同口径）。
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

test("F-021 · POST provider listing then GET catalog includes id", async ({ request }) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `e2e-f021-${suffix}@traveltrust.test`;

  const reg = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password: "TestPass12!", nickname: "e2eF021" },
  });
  expect(reg.ok()).toBeTruthy();
  const regJ = (await reg.json()) as { status?: string; token?: string };
  expect(regJ.status).toBe("ok");
  const token = regJ.token?.trim() ?? "";

  const pub = await request.post(`${API_BASE}/api/v1/market/provider/listings`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: {
      payload: {
        kind: "merchant_showcase_studio_v1",
        title: `e2e-f021 catalog ${suffix}`,
      },
    },
  });
  expect(pub.ok(), `POST provider/listings ${pub.status()}`).toBeTruthy();
  const pubJ = (await pub.json()) as {
    status?: string;
    listing_id?: string;
  };
  expect(pubJ.status).toBe("ok");
  const listingId = pubJ.listing_id ?? "";
  expect(listingId.length).toBeGreaterThan(0);

  const list = await request.get(`${API_BASE}/api/v1/market/provider/listings`);
  expect(list.ok(), `GET provider/listings ${list.status()}`).toBeTruthy();
  const lj = (await list.json()) as {
    status?: string;
    items?: Array<{ id?: string }>;
  };
  expect(lj.status).toBe("ok");
  const items = lj.items ?? [];
  expect(items.some((row) => row.id === listingId)).toBe(true);
});

test("F-021 · POST provider listing then GET listing detail matches id", async ({ request }) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `e2e-f021d-${suffix}@traveltrust.test`;

  const reg = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password: "TestPass12!", nickname: "e2eF021D" },
  });
  expect(reg.ok()).toBeTruthy();
  const regJ = (await reg.json()) as { status?: string; token?: string };
  expect(regJ.status).toBe("ok");
  const token = regJ.token?.trim() ?? "";

  const pub = await request.post(`${API_BASE}/api/v1/market/provider/listings`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: {
      payload: {
        kind: "merchant_showcase_studio_v1",
        title: `e2e-f021-detail ${suffix}`,
      },
    },
  });
  expect(pub.ok(), `POST provider/listings ${pub.status()}`).toBeTruthy();
  const pubJ = (await pub.json()) as {
    status?: string;
    listing_id?: string;
  };
  expect(pubJ.status).toBe("ok");
  const listingId = pubJ.listing_id ?? "";
  expect(listingId.length).toBeGreaterThan(0);

  const detail = await request.get(
    `${API_BASE}/api/v1/market/provider/listings/${listingId}`,
  );
  expect(detail.ok(), `GET provider/listings/:id ${detail.status()}`).toBeTruthy();
  const dj = (await detail.json()) as {
    status?: string;
    listing?: { id?: string; payload?: { title?: string } };
  };
  expect(dj.status).toBe("ok");
  expect(dj.listing?.id).toBe(listingId);
  expect(dj.listing?.payload?.title).toBe(`e2e-f021-detail ${suffix}`);
});

test("F-022 · POST acquisition listing then GET catalog includes id", async ({ request }) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `e2e-f022-${suffix}@traveltrust.test`;

  const reg = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password: "TestPass12!", nickname: "e2eF022" },
  });
  expect(reg.ok()).toBeTruthy();
  const regJ = (await reg.json()) as { status?: string; token?: string };
  expect(regJ.status).toBe("ok");
  const token = regJ.token?.trim() ?? "";

  const pub = await request.post(`${API_BASE}/api/v1/market/acquisition/listings`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: {
      payload: {
        kind: "acquisition_carry_studio_v1",
        title: `e2e-f022 catalog ${suffix}`,
      },
    },
  });
  expect(pub.ok(), `POST acquisition/listings ${pub.status()}`).toBeTruthy();
  const pubJ = (await pub.json()) as {
    status?: string;
    listing_id?: string;
  };
  expect(pubJ.status).toBe("ok");
  const listingId = pubJ.listing_id ?? "";
  expect(listingId.length).toBeGreaterThan(0);

  const list = await request.get(`${API_BASE}/api/v1/market/acquisition/listings`);
  expect(list.ok(), `GET acquisition/listings ${list.status()}`).toBeTruthy();
  const lj = (await list.json()) as {
    status?: string;
    items?: Array<{ id?: string }>;
  };
  expect(lj.status).toBe("ok");
  const items = lj.items ?? [];
  expect(items.some((row) => row.id === listingId)).toBe(true);
});

test("F-022 · POST acquisition listing then GET listing detail matches id", async ({ request }) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `e2e-f022d-${suffix}@traveltrust.test`;

  const reg = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password: "TestPass12!", nickname: "e2eF022D" },
  });
  expect(reg.ok()).toBeTruthy();
  const regJ = (await reg.json()) as { status?: string; token?: string };
  expect(regJ.status).toBe("ok");
  const token = regJ.token?.trim() ?? "";

  const pub = await request.post(`${API_BASE}/api/v1/market/acquisition/listings`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: {
      payload: {
        kind: "acquisition_carry_studio_v1",
        title: `e2e-f022-detail ${suffix}`,
      },
    },
  });
  expect(pub.ok(), `POST acquisition/listings ${pub.status()}`).toBeTruthy();
  const pubJ = (await pub.json()) as {
    status?: string;
    listing_id?: string;
  };
  expect(pubJ.status).toBe("ok");
  const listingId = pubJ.listing_id ?? "";
  expect(listingId.length).toBeGreaterThan(0);

  const detail = await request.get(
    `${API_BASE}/api/v1/market/acquisition/listings/${listingId}`,
  );
  expect(detail.ok(), `GET acquisition/listings/:id ${detail.status()}`).toBeTruthy();
  const dj = (await detail.json()) as {
    status?: string;
    listing?: { id?: string; payload?: { title?: string } };
  };
  expect(dj.status).toBe("ok");
  expect(dj.listing?.id).toBe(listingId);
  expect(dj.listing?.payload?.title).toBe(`e2e-f022-detail ${suffix}`);
});

test("F-023 · POST guide then GET detail and availability", async ({ request }) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `e2e-f023-${suffix}@traveltrust.test`;

  const reg = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password: "TestPass12!", nickname: "e2eF023" },
  });
  expect(reg.ok()).toBeTruthy();
  const regJ = (await reg.json()) as { status?: string; token?: string };
  expect(regJ.status).toBe("ok");
  const token = regJ.token?.trim() ?? "";

  const post = await request.post(`${API_BASE}/api/v1/guides`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: {
      city: "Hangzhou",
      country_code: "CN",
      languages: ["zh"],
      service_types: ["walking"],
      bio: "e2e-f023 matrix_93_b_gde_001",
    },
  });
  expect(post.ok(), `POST guides ${post.status()}`).toBeTruthy();
  const postJ = (await post.json()) as { status?: string; guide?: { id?: string } };
  expect(postJ.status).toBe("ok");
  const guideId = postJ.guide?.id ?? "";
  expect(guideId.length).toBeGreaterThan(0);

  const get = await request.get(`${API_BASE}/api/v1/guides/${guideId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(get.ok(), `GET guides/:id ${get.status()}`).toBeTruthy();
  const getJ = (await get.json()) as {
    status?: string;
    guide?: { city?: string };
  };
  expect(getJ.status).toBe("ok");
  expect(getJ.guide?.city).toBe("Hangzhou");

  const av = await request.get(
    `${API_BASE}/api/v1/guides/${guideId}/availability`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  expect(av.ok(), `GET availability ${av.status()}`).toBeTruthy();
  const avJ = (await av.json()) as {
    status?: string;
    guide_id?: string;
    occupied_ranges?: unknown[];
  };
  expect(avJ.status).toBe("ok");
  expect(avJ.guide_id).toBe(guideId);
  expect(Array.isArray(avJ.occupied_ranges)).toBe(true);
});
