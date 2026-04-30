/**
 * **§8.2 · F-018 / F-019 / F-020** — Playwright **`request`** 直连 **traveltrust-api**（与 Rust **`community_report_me_posts_db_api_tests`** / **`me_market_bookmarks_db_api_tests`** 同形）。
 *
 * - **F-018**：**`POST /api/v1/community/reports`**（**`target_type: post`**）→ **`status=ok`** 且 **`id`** 为 UUID（**D-COM-010**）；**无头 `GET …/posts/:id`** **举报后仍可读**（**`v1.4.279`**；与 **`matrix_93_d_com_010b_f018_*` API·IT** **对齐**）。
 * - **F-019**：发帖后 **`GET /api/v1/community/me/posts?limit=20`** → **`posts`** 含该帖 **`id`**（**D-COM-009**）；**`POST like`→`GET …/me/likes`→`DELETE like`→`GET …/me/likes`** **不含** **`post_id`** **+** **`POST collect`→`GET …/me/collects`→`DELETE collect`→`GET …/me/collects`**（**`v1.4.279`**；与 **`009c`/`009d`/`009b`/`009e` API·IT** **对齐**）。
 * - **F-020**：旅客+向导 **`POST /guides`** → **`stake`** → **`POST /orders`** 得 **`order.id`** → **`POST /api/v1/me/market-bookmarks`** → **`GET …/me/market-bookmarks`** 的 **`order_ids`** 含该 id（**B-MKT-004**）；**`DELETE …/me/market-bookmarks/order/:id`→`GET`** **`order_ids`** **不含**（**`v1.4.279`**；与 **`matrix_93_b_mkt_004c_f020_*` API·IT** **对齐**）；**order+guide 双星标** 后 **`POST` `target_type=listing`**（**`target_id=order_id`**）→**400** **`invalid_target_type`**→**`GET`** **两列表仍含**（与 **`matrix_93_b_mkt_004i_f020_*` API·IT** **对齐**）。
 *
 * **环境**：**`DATABASE_URL`** + **`P3_CHAIN_OFF=1`**（与 **`e2e:api-b-orders-local`** / **`f015-*`** 同口径）。
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

test("F-018 · POST community report returns ok and report id", async ({ request }) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const authorEmail = `e2e-f018-a-${suffix}@traveltrust.test`;
  const reporterEmail = `e2e-f018-r-${suffix}@traveltrust.test`;

  const regA = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: authorEmail, password: "TestPass12!", nickname: "e2eAuthor" },
  });
  expect(regA.ok()).toBeTruthy();
  const regAJ = (await regA.json()) as { status?: string; token?: string };
  expect(regAJ.status).toBe("ok");
  const tokenAuthor = regAJ.token?.trim() ?? "";

  const regR = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: reporterEmail, password: "TestPass12!", nickname: "e2eReporter" },
  });
  expect(regR.ok()).toBeTruthy();
  const regRJ = (await regR.json()) as { status?: string; token?: string };
  expect(regRJ.status).toBe("ok");
  const tokenReporter = regRJ.token?.trim() ?? "";

  const post = await request.post(`${API_BASE}/api/v1/community/posts`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenAuthor}`,
    },
    data: { body: `e2e-f018 target ${suffix}`, post_type: "text" },
  });
  expect(post.ok(), `POST posts ${post.status()}`).toBeTruthy();
  const postId = ((await post.json()) as { id?: string }).id ?? "";
  expect(postId.length).toBeGreaterThan(0);

  const rep = await request.post(`${API_BASE}/api/v1/community/reports`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenReporter}`,
    },
    data: {
      target_type: "post",
      target_id: postId,
      reason_code: "spam",
      details: "e2e-f018 report",
    },
  });
  expect(rep.ok(), `POST reports ${rep.status()}`).toBeTruthy();
  const rj = (await rep.json()) as { status?: string; id?: string };
  expect(rj.status).toBe("ok");
  expect(rj.id?.length).toBeGreaterThan(0);
  expect(rj.id).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );
});

test("F-018 · unauthenticated GET post detail after report still readable", async ({ request }) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const authorEmail = `e2e-f018b-a-${suffix}@traveltrust.test`;
  const reporterEmail = `e2e-f018b-r-${suffix}@traveltrust.test`;

  const regA = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: authorEmail, password: "TestPass12!", nickname: "e2eAuthorB" },
  });
  expect(regA.ok()).toBeTruthy();
  const regAJ = (await regA.json()) as { status?: string; token?: string };
  expect(regAJ.status).toBe("ok");
  const tokenAuthor = regAJ.token?.trim() ?? "";

  const regR = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: reporterEmail, password: "TestPass12!", nickname: "e2eReporterB" },
  });
  expect(regR.ok()).toBeTruthy();
  const regRJ = (await regR.json()) as { status?: string; token?: string };
  expect(regRJ.status).toBe("ok");
  const tokenReporter = regRJ.token?.trim() ?? "";

  const postBody = `e2e-f018b target ${suffix}`;
  const post = await request.post(`${API_BASE}/api/v1/community/posts`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenAuthor}`,
    },
    data: { body: postBody, post_type: "text" },
  });
  expect(post.ok(), `POST posts ${post.status()}`).toBeTruthy();
  const postId = ((await post.json()) as { id?: string }).id ?? "";
  expect(postId.length).toBeGreaterThan(0);

  const rep = await request.post(`${API_BASE}/api/v1/community/reports`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenReporter}`,
    },
    data: {
      target_type: "post",
      target_id: postId,
      reason_code: "spam",
      details: "e2e-f018b report",
    },
  });
  expect(rep.ok(), `POST reports ${rep.status()}`).toBeTruthy();

  const anon = await request.get(`${API_BASE}/api/v1/community/posts/${postId}`);
  expect(anon.ok(), `GET posts/:id ${anon.status()}`).toBeTruthy();
  const detail = (await anon.json()) as {
    status?: string;
    post?: { id?: string; body?: string };
  };
  expect(detail.status).toBe("ok");
  expect(detail.post?.id).toBe(postId);
  expect(detail.post?.body).toBe(postBody);
});

test("F-019 · GET community me posts lists own post", async ({ request }) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `e2e-f019-${suffix}@traveltrust.test`;

  const reg = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password: "TestPass12!", nickname: "e2eMePosts" },
  });
  expect(reg.ok()).toBeTruthy();
  const regJ = (await reg.json()) as { status?: string; token?: string };
  expect(regJ.status).toBe("ok");
  const token = regJ.token?.trim() ?? "";

  const post = await request.post(`${API_BASE}/api/v1/community/posts`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: { body: `e2e-f019 me list ${suffix}`, post_type: "text" },
  });
  expect(post.ok()).toBeTruthy();
  const postId = ((await post.json()) as { id?: string }).id ?? "";

  const list = await request.get(`${API_BASE}/api/v1/community/me/posts?limit=20`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(list.ok(), `GET me/posts ${list.status()}`).toBeTruthy();
  const lj = (await list.json()) as {
    status?: string;
    posts?: Array<{ id?: string }>;
  };
  expect(lj.status).toBe("ok");
  const posts = lj.posts ?? [];
  expect(posts.some((p) => p.id === postId)).toBe(true);
});

test("F-019 · me likes and collects lists reflect like collect delete cycles", async ({ request }) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `e2e-f019b-${suffix}@traveltrust.test`;

  const reg = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password: "TestPass12!", nickname: "e2eMeLists" },
  });
  expect(reg.ok()).toBeTruthy();
  const regJ = (await reg.json()) as { status?: string; token?: string };
  expect(regJ.status).toBe("ok");
  const token = regJ.token?.trim() ?? "";

  const post = await request.post(`${API_BASE}/api/v1/community/posts`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: { body: `e2e-f019b lists ${suffix}`, post_type: "text" },
  });
  expect(post.ok()).toBeTruthy();
  const postId = ((await post.json()) as { id?: string }).id ?? "";
  expect(postId.length).toBeGreaterThan(0);

  const like = await request.post(`${API_BASE}/api/v1/community/posts/${postId}/like`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(like.ok(), `POST like ${like.status()}`).toBeTruthy();
  const likeJ = (await like.json()) as { status?: string; created?: boolean };
  expect(likeJ.status).toBe("ok");
  expect(likeJ.created).toBe(true);

  const likes1 = await request.get(`${API_BASE}/api/v1/community/me/likes?limit=20`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(likes1.ok()).toBeTruthy();
  const lj1 = (await likes1.json()) as {
    status?: string;
    likes?: Array<{ post_id?: string }>;
  };
  expect(lj1.status).toBe("ok");
  expect((lj1.likes ?? []).some((r) => r.post_id === postId)).toBe(true);

  const unlike = await request.delete(`${API_BASE}/api/v1/community/posts/${postId}/like`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(unlike.ok()).toBeTruthy();

  const likes2 = await request.get(`${API_BASE}/api/v1/community/me/likes?limit=20`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(likes2.ok()).toBeTruthy();
  const lj2 = (await likes2.json()) as {
    status?: string;
    likes?: Array<{ post_id?: string }>;
  };
  expect(lj2.status).toBe("ok");
  expect((lj2.likes ?? []).some((r) => r.post_id === postId)).toBe(false);

  const coll = await request.post(`${API_BASE}/api/v1/community/posts/${postId}/collect`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(coll.ok(), `POST collect ${coll.status()}`).toBeTruthy();
  const cj = (await coll.json()) as { status?: string; created?: boolean };
  expect(cj.status).toBe("ok");
  expect(cj.created).toBe(true);

  const col1 = await request.get(`${API_BASE}/api/v1/community/me/collects?limit=20`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(col1.ok()).toBeTruthy();
  const cj1 = (await col1.json()) as {
    status?: string;
    collects?: Array<{ post_id?: string }>;
  };
  expect(cj1.status).toBe("ok");
  expect((cj1.collects ?? []).some((r) => r.post_id === postId)).toBe(true);

  const uncoll = await request.delete(`${API_BASE}/api/v1/community/posts/${postId}/collect`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(uncoll.ok()).toBeTruthy();

  const col2 = await request.get(`${API_BASE}/api/v1/community/me/collects?limit=20`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(col2.ok()).toBeTruthy();
  const cj2 = (await col2.json()) as {
    status?: string;
    collects?: Array<{ post_id?: string }>;
  };
  expect(cj2.status).toBe("ok");
  expect((cj2.collects ?? []).some((r) => r.post_id === postId)).toBe(false);
});

test("F-020 · POST me market bookmark for order then GET lists order_id", async ({ request }) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const touristEmail = `e2e-f020-t-${suffix}@traveltrust.test`;
  const guideEmail = `e2e-f020-g-${suffix}@traveltrust.test`;

  const regT = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: touristEmail, password: "TestPass12!", nickname: "e2eF20T" },
  });
  expect(regT.ok()).toBeTruthy();
  const tj = (await regT.json()) as { status?: string; token?: string };
  expect(tj.status).toBe("ok");
  const tokenTourist = tj.token?.trim() ?? "";

  const regG = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: guideEmail, password: "TestPass12!", nickname: "e2eF20G" },
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
  const cj = (await create.json()) as { status?: string; order?: { id?: string } };
  expect(cj.status).toBe("ok");
  const orderId = cj.order?.id ?? "";
  expect(orderId.length).toBeGreaterThan(0);

  const bm = await request.post(`${API_BASE}/api/v1/me/market-bookmarks`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenTourist}`,
    },
    data: {
      target_type: "order",
      target_id: orderId,
    },
  });
  expect(bm.ok(), `POST market-bookmarks ${bm.status()}`).toBeTruthy();
  const bmj = (await bm.json()) as { status?: string };
  expect(bmj.status).toBe("ok");

  const get = await request.get(`${API_BASE}/api/v1/me/market-bookmarks`, {
    headers: { Authorization: `Bearer ${tokenTourist}` },
  });
  expect(get.ok(), `GET market-bookmarks ${get.status()}`).toBeTruthy();
  const getJ = (await get.json()) as { status?: string; order_ids?: string[] };
  expect(getJ.status).toBe("ok");
  const ids = getJ.order_ids ?? [];
  expect(ids).toContain(orderId);
});

test("F-020 · DELETE order market bookmark then GET omits order_id", async ({ request }) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const touristEmail = `e2e-f020c-t-${suffix}@traveltrust.test`;
  const guideEmail = `e2e-f020c-g-${suffix}@traveltrust.test`;

  const regT = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: touristEmail, password: "TestPass12!", nickname: "e2eF20cT" },
  });
  expect(regT.ok()).toBeTruthy();
  const tj = (await regT.json()) as { status?: string; token?: string };
  expect(tj.status).toBe("ok");
  const tokenTourist = tj.token?.trim() ?? "";

  const regG = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: guideEmail, password: "TestPass12!", nickname: "e2eF20cG" },
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
  const cj = (await create.json()) as { status?: string; order?: { id?: string } };
  expect(cj.status).toBe("ok");
  const orderId = cj.order?.id ?? "";
  expect(orderId.length).toBeGreaterThan(0);

  const bm = await request.post(`${API_BASE}/api/v1/me/market-bookmarks`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenTourist}`,
    },
    data: { target_type: "order", target_id: orderId },
  });
  expect(bm.ok(), `POST market-bookmarks ${bm.status()}`).toBeTruthy();

  const get1 = await request.get(`${API_BASE}/api/v1/me/market-bookmarks`, {
    headers: { Authorization: `Bearer ${tokenTourist}` },
  });
  expect(get1.ok()).toBeTruthy();
  const g1 = (await get1.json()) as { status?: string; order_ids?: string[] };
  expect(g1.status).toBe("ok");
  expect(g1.order_ids ?? []).toContain(orderId);

  const del = await request.delete(`${API_BASE}/api/v1/me/market-bookmarks/order/${orderId}`, {
    headers: { Authorization: `Bearer ${tokenTourist}` },
  });
  expect(del.ok(), `DELETE bookmark ${del.status()}`).toBeTruthy();

  const get2 = await request.get(`${API_BASE}/api/v1/me/market-bookmarks`, {
    headers: { Authorization: `Bearer ${tokenTourist}` },
  });
  expect(get2.ok()).toBeTruthy();
  const g2 = (await get2.json()) as { status?: string; order_ids?: string[] };
  expect(g2.status).toBe("ok");
  expect(g2.order_ids ?? []).not.toContain(orderId);
});

test("F-020 · order+guide bookmarks then invalid listing POST preserves both lists", async ({
  request,
}) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const touristEmail = `e2e-f020b-t-${suffix}@traveltrust.test`;
  const guideEmail = `e2e-f020b-g-${suffix}@traveltrust.test`;

  const regT = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: touristEmail, password: "TestPass12!", nickname: "e2eF20bT" },
  });
  expect(regT.ok()).toBeTruthy();
  const tj = (await regT.json()) as { status?: string; token?: string };
  expect(tj.status).toBe("ok");
  const tokenTourist = tj.token?.trim() ?? "";

  const regG = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: guideEmail, password: "TestPass12!", nickname: "e2eF20bG" },
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
  const cj = (await create.json()) as { status?: string; order?: { id?: string } };
  expect(cj.status).toBe("ok");
  const orderId = cj.order?.id ?? "";
  expect(orderId.length).toBeGreaterThan(0);

  const bmOrder = await request.post(`${API_BASE}/api/v1/me/market-bookmarks`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenTourist}`,
    },
    data: { target_type: "order", target_id: orderId },
  });
  expect(bmOrder.ok(), `POST order bookmark ${bmOrder.status()}`).toBeTruthy();

  const bmGuide = await request.post(`${API_BASE}/api/v1/me/market-bookmarks`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenTourist}`,
    },
    data: { target_type: "guide", target_id: guideRowId },
  });
  expect(bmGuide.ok(), `POST guide bookmark ${bmGuide.status()}`).toBeTruthy();

  const bad = await request.post(`${API_BASE}/api/v1/me/market-bookmarks`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenTourist}`,
    },
    data: { target_type: "listing", target_id: orderId },
  });
  expect(bad.status()).toBe(400);
  const badJ = (await bad.json()) as { error?: string };
  expect(badJ.error).toBe("invalid_target_type");

  const get = await request.get(`${API_BASE}/api/v1/me/market-bookmarks`, {
    headers: { Authorization: `Bearer ${tokenTourist}` },
  });
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
