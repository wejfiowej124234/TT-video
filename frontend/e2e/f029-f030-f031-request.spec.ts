/**
 * **§8.2 · F-029 / F-030 / F-031** — Playwright **`request`** 直连 **traveltrust-api**（与
 * **`internal_indexer_admin_db_api_tests`** **`matrix_93_d_idx_001_*` / `matrix_93_d_adm_003_*`** +
 * **`f031_f032_f033_app_http_db_api_tests`** **`matrix_93_d_com_011_*`** 同形）。
 *
 * - **F-029**：**`GET /health`** **`ok`** **+** **`GET /meta`** **`build`/`api_version`/`database`**（**A-ENV-001** ↔ **`matrix_93_a_env_001b_f029_*`**）。**`GET /api/v1/internal/indexer-status`**（**110** 探针体字段子集；若进程设 **`INTERNAL_API_SECRET`**，须 **`X-Internal-Api-Secret`**）。**`mock-pay` 后** **`GET /api/v1/orders/:id/chain-sync-status`** **`chain_sync.last_event.state=escrowed`**（**B-ESC-004** ↔ **`matrix_93_b_esc_004b_f029_*`**；须 **`skipUnlessOrderMockPayAvailable`**）。
 * - **F-030**：**非 admin** **`Authorization: Bearer`** 调 **`GET /api/v1/admin/schema/migrations`** → **403** **`admin_required`**（权限矩阵「非 admin 全拒」窄口径 **E2E**）。
 * - **F-031**：**`POST …/market/acquisition/listings`** → **`POST /api/v1/community/posts`** 带 **`commerce_showcase_kind`=`acquisition_led`** + **`commerce_market_listing_id`**；**第二用户** **`POST …/community/users/:id/follow`** → **`GET …/feed?mode=follow`** **含收购帖**（与 **`matrix_93_d_com_011f_f031_*` API·IT** **HTTP 对齐**）。
 *
 * **环境**：**`DATABASE_URL`** + **`P3_CHAIN_OFF=1`**（与其它 **`e2e:api-*-local`** 一致）。**不设** **`REQUIRE_IDEMPOTENCY_KEY=1`**（本批无幂等强制写）。
 */
import { test, expect, type APIRequestContext } from "@playwright/test";

import { skipUnlessOrderMockPayAvailable } from "./helpers/skipUnlessOrderMockPayAvailable";

const API_HEALTH = process.env.PLAYWRIGHT_API_HEALTH_URL ?? "http://127.0.0.1:8080/health";
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? "http://127.0.0.1:8080";

async function skipIfApiDown(request: APIRequestContext) {
  const health = await request.get(API_HEALTH).catch(() => null);
  if (!health?.ok()) {
    test.skip(true, `API not reachable at ${API_HEALTH}; start traveltrust-api`);
  }
}

function internalHeaders(): Record<string, string> {
  const sec = (process.env.PLAYWRIGHT_INTERNAL_API_SECRET ?? process.env.INTERNAL_API_SECRET ?? "")
    .trim();
  if (!sec) return {};
  return { "X-Internal-Api-Secret": sec };
}

function jsonHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

test("F-029 · GET /health returns ok and GET /meta includes build api_version database", async ({
  request,
}) => {
  await skipIfApiDown(request);
  const health = await request.get(`${API_BASE}/health`);
  expect(health.ok(), `GET /health ${health.status()}`).toBeTruthy();
  const ht = (await health.text()).trim();
  expect(ht).toBe("ok");

  const meta = await request.get(`${API_BASE}/meta`);
  expect(meta.ok(), `GET /meta ${meta.status()}`).toBeTruthy();
  const mj = (await meta.json()) as Record<string, unknown>;
  expect(mj.build).toBeDefined();
  expect(mj.api_version).toBeDefined();
  expect(mj.database).toBeDefined();
});

test("F-029 · GET internal indexer-status returns ok with indexer block", async ({ request }) => {
  await skipIfApiDown(request);
  const res = await request.get(`${API_BASE}/api/v1/internal/indexer-status`, {
    headers: internalHeaders(),
  });
  expect(res.ok(), `indexer-status ${res.status()}`).toBeTruthy();
  const j = (await res.json()) as Record<string, unknown>;
  expect(j.status).toBe("ok");
  expect(j.indexer).toBeDefined();
  expect(j.state).toBeDefined();
  expect(j.reorg_recovery).toBeDefined();
});

test("F-029 · mock-pay then GET order chain-sync-status shows escrowed last_event", async ({
  request,
}) => {
  await skipIfApiDown(request);
  await skipUnlessOrderMockPayAvailable(request, API_BASE);

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const touristEmail = `e2e-f029cs-t-${suffix}@traveltrust.test`;
  const guideEmail = `e2e-f029cs-g-${suffix}@traveltrust.test`;

  const regT = await request.post(`${API_BASE}/auth/register`, {
    headers: jsonHeaders(),
    data: { email: touristEmail, password: "TestPass12!", nickname: "e2eF29csT" },
  });
  expect(regT.ok()).toBeTruthy();
  const tj = (await regT.json()) as { status?: string; token?: string };
  expect(tj.status).toBe("ok");
  const tokenTourist = tj.token?.trim() ?? "";

  const regG = await request.post(`${API_BASE}/auth/register`, {
    headers: jsonHeaders(),
    data: { email: guideEmail, password: "TestPass12!", nickname: "e2eF29csG" },
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
      bio: "e2e-f029-chain-sync",
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

  const sync = await request.get(
    `${API_BASE}/api/v1/orders/${orderId}/chain-sync-status`,
    { headers: { Authorization: `Bearer ${tokenTourist}` } },
  );
  expect(sync.ok(), `chain-sync-status ${sync.status()}`).toBeTruthy();
  const sj = (await sync.json()) as {
    status?: string;
    order_id?: string;
    chain_sync?: { last_event?: { state?: string }; status?: string };
  };
  expect(sj.status).toBe("ok");
  expect(sj.order_id).toBe(orderId);
  expect(typeof sj.chain_sync?.status).toBe("string");
  expect(sj.chain_sync?.last_event?.state).toBe("escrowed");
});

test("F-030 · tourist Bearer cannot GET admin schema migrations (403 admin_required)", async ({
  request,
}) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `e2e-f030-${suffix}@traveltrust.test`;

  const reg = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password: "TestPass12!", nickname: "e2eF030" },
  });
  expect(reg.ok()).toBeTruthy();
  const rj = (await reg.json()) as { status?: string; token?: string };
  expect(rj.status).toBe("ok");
  const token = rj.token?.trim() ?? "";
  expect(token.length).toBeGreaterThan(0);

  const res = await request.get(`${API_BASE}/api/v1/admin/schema/migrations?limit=2`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status(), await res.text()).toBe(403);
  const ej = (await res.json()) as { error?: string; message?: string };
  expect(ej.error === "admin_required" || ej.message === "admin_required").toBeTruthy();
});

test("F-031 · acquisition listing then community post acquisition_led showcase", async ({
  request,
}) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `e2e-f031-${suffix}@traveltrust.test`;

  const reg = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password: "TestPass12!", nickname: "e2eF031" },
  });
  expect(reg.ok()).toBeTruthy();
  const rj = (await reg.json()) as { status?: string; token?: string };
  expect(rj.status).toBe("ok");
  const token = rj.token?.trim() ?? "";

  const pub = await request.post(`${API_BASE}/api/v1/market/acquisition/listings`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: {
      payload: {
        kind: "acquisition_carry_studio_v1",
        title: `e2e-f031-listing-${suffix}`,
      },
    },
  });
  expect(pub.ok(), `POST acquisition/listings ${pub.status()}`).toBeTruthy();
  const pj = (await pub.json()) as { status?: string; listing_id?: string };
  expect(pj.status).toBe("ok");
  const listingId = pj.listing_id ?? "";
  expect(listingId.length).toBeGreaterThan(0);

  const post = await request.post(`${API_BASE}/api/v1/community/posts`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: {
      body: `e2e-f031 showcase ${suffix}`,
      post_type: "text",
      commerce_showcase_kind: "acquisition_led",
      commerce_market_listing_id: listingId,
    },
  });
  expect(post.ok(), `POST community/posts ${post.status()}`).toBeTruthy();
  const cj = (await post.json()) as { status?: string; id?: string };
  expect(cj.status).toBe("ok");
  expect((cj.id ?? "").length).toBeGreaterThan(0);
});

test("F-031 · acquisition post then HTTP follow and follower follow-feed includes post", async ({
  request,
}) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const authorEmail = `e2e-f031b-a-${suffix}@traveltrust.test`;
  const followerEmail = `e2e-f031b-b-${suffix}@traveltrust.test`;

  const regA = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: authorEmail, password: "TestPass12!", nickname: "e2eF31bA" },
  });
  expect(regA.ok()).toBeTruthy();
  const aj = (await regA.json()) as { status?: string; token?: string };
  expect(aj.status).toBe("ok");
  const tokenAuthor = aj.token?.trim() ?? "";

  const regB = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: followerEmail, password: "TestPass12!", nickname: "e2eF31bB" },
  });
  expect(regB.ok()).toBeTruthy();
  const bj = (await regB.json()) as { status?: string; token?: string };
  expect(bj.status).toBe("ok");
  const tokenFollower = bj.token?.trim() ?? "";

  const meA = await request.get(`${API_BASE}/api/v1/me`, {
    headers: { Authorization: `Bearer ${tokenAuthor}` },
  });
  expect(meA.ok()).toBeTruthy();
  const meAj = (await meA.json()) as { status?: string; user?: { id?: string } };
  expect(meAj.status).toBe("ok");
  const authorUserId = meAj.user?.id ?? "";
  expect(authorUserId.length).toBeGreaterThan(0);

  const pub = await request.post(`${API_BASE}/api/v1/market/acquisition/listings`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenAuthor}`,
    },
    data: {
      payload: {
        kind: "acquisition_carry_studio_v1",
        title: `e2e-f031b-listing-${suffix}`,
      },
    },
  });
  expect(pub.ok(), `POST acquisition/listings ${pub.status()}`).toBeTruthy();
  const pj = (await pub.json()) as { status?: string; listing_id?: string };
  expect(pj.status).toBe("ok");
  const listingId = pj.listing_id ?? "";
  expect(listingId.length).toBeGreaterThan(0);

  const post = await request.post(`${API_BASE}/api/v1/community/posts`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenAuthor}`,
    },
    data: {
      body: `e2e-f031b acquisition ${suffix}`,
      post_type: "text",
      commerce_showcase_kind: "acquisition_led",
      commerce_market_listing_id: listingId,
    },
  });
  expect(post.ok(), `POST community/posts ${post.status()}`).toBeTruthy();
  const cj = (await post.json()) as { status?: string; id?: string };
  expect(cj.status).toBe("ok");
  const postId = cj.id ?? "";
  expect(postId.length).toBeGreaterThan(0);

  const follow = await request.post(
    `${API_BASE}/api/v1/community/users/${authorUserId}/follow`,
    { headers: { Authorization: `Bearer ${tokenFollower}` } },
  );
  expect(follow.ok(), `POST follow ${follow.status()}`).toBeTruthy();
  const fj0 = (await follow.json()) as { status?: string };
  expect(fj0.status).toBe("ok");

  const feed = await request.get(
    `${API_BASE}/api/v1/community/feed?mode=follow&limit=20`,
    { headers: { Authorization: `Bearer ${tokenFollower}` } },
  );
  expect(feed.ok(), `GET follow feed ${feed.status()}`).toBeTruthy();
  const fj = (await feed.json()) as { status?: string; posts?: Array<{ id?: string }> };
  expect(fj.status).toBe("ok");
  const posts = fj.posts ?? [];
  expect(posts.some((p) => p.id === postId)).toBe(true);
});
