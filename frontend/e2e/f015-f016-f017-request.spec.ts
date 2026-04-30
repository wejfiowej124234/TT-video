/**
 * **§8.2 · F-015 / F-016 / F-017（D 域社区）** — Playwright **`request`** 直连 **traveltrust-api**。
 *
 * - **F-015**：**`POST /api/v1/community/posts`** → **`GET /api/v1/community/posts/:id`**，**`post.body`** 与发帖正文一致（**D-COM-002** / **`matrix_93_d_com_002_*`** 同源）；**Bearer 发帖 → 无头 `GET …/posts/:id`** **公开读**（与 **`matrix_93_d_com_002b_f015_*` API·IT** **对齐**）。
 * - **F-016**：**`POST …/posts/:id/like`** → **`status=ok`** **`created=true`**（首次点赞；**D-COM-003**）；**`DELETE …/like`→`GET` `liked_by_me:false`→再 `POST` `created:true`**（与 **`matrix_93_d_com_003b_f016_*` API·IT** **对齐**）。
 * - **F-017**：**`POST …/posts/:id/collect`** → **`status=ok`** **`created=true`**（首次收藏；**D-COM-008**）；**`DELETE …/collect`→`GET` `collected_by_me:false`→再 `POST` `created:true`**（与 **`matrix_93_d_com_008b_f017_*` API·IT** **对齐**）。
 *
 * **环境**：**`PLAYWRIGHT_API_BASE_URL`** + **PG**（**`start-api-for-playwright`**）；**`P3_CHAIN_OFF=1`** 与 **`e2e:api-itin-feed-local`** 同口径。
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

test("F-015 · POST community post then GET detail matches body", async ({ request }) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `e2e-f015-${suffix}@traveltrust.test`;
  const body = `e2e-f015 detail ${suffix}`;

  const reg = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password: "TestPass12!", nickname: "e2ePost" },
  });
  expect(reg.ok(), `register ${reg.status()}`).toBeTruthy();
  const rj = (await reg.json()) as { status?: string; token?: string };
  expect(rj.status).toBe("ok");
  const token = rj.token?.trim() ?? "";
  expect(token.length).toBeGreaterThan(0);

  const post = await request.post(`${API_BASE}/api/v1/community/posts`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: { body, post_type: "text" },
  });
  expect(post.ok(), `POST posts ${post.status()}`).toBeTruthy();
  const pj = (await post.json()) as { id?: string };
  const postId = pj.id ?? "";
  expect(postId.length).toBeGreaterThan(0);

  const get = await request.get(`${API_BASE}/api/v1/community/posts/${postId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(get.ok(), `GET post ${get.status()}`).toBeTruthy();
  const gj = (await get.json()) as { post?: { id?: string; body?: string } };
  expect(gj.post?.id).toBe(postId);
  expect(gj.post?.body).toBe(body);
});

test("F-015 · Bearer POST post then unauthenticated GET detail matches body", async ({
  request,
}) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `e2e-f015b-${suffix}@traveltrust.test`;
  const body = `e2e-f015b anon ${suffix}`;

  const reg = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password: "TestPass12!", nickname: "e2eF15b" },
  });
  expect(reg.ok()).toBeTruthy();
  const rj = (await reg.json()) as { status?: string; token?: string };
  expect(rj.status).toBe("ok");
  const token = rj.token?.trim() ?? "";

  const post = await request.post(`${API_BASE}/api/v1/community/posts`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: { body, post_type: "text" },
  });
  expect(post.ok()).toBeTruthy();
  const postId = ((await post.json()) as { id?: string }).id ?? "";
  expect(postId.length).toBeGreaterThan(0);

  const anon = await request.get(`${API_BASE}/api/v1/community/posts/${postId}`);
  expect(anon.ok(), `anon GET post ${anon.status()}`).toBeTruthy();
  const aj = (await anon.json()) as { post?: { id?: string; body?: string } };
  expect(aj.post?.id).toBe(postId);
  expect(aj.post?.body).toBe(body);
});

test("F-016 · POST like returns created true", async ({ request }) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `e2e-f016-${suffix}@traveltrust.test`;

  const reg = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password: "TestPass12!", nickname: "e2eLike" },
  });
  expect(reg.ok()).toBeTruthy();
  const rj = (await reg.json()) as { status?: string; token?: string };
  expect(rj.status).toBe("ok");
  const token = rj.token?.trim() ?? "";

  const post = await request.post(`${API_BASE}/api/v1/community/posts`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: { body: `e2e-f016 ${suffix}`, post_type: "text" },
  });
  expect(post.ok()).toBeTruthy();
  const postId = ((await post.json()) as { id?: string }).id ?? "";

  const like = await request.post(`${API_BASE}/api/v1/community/posts/${postId}/like`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(like.ok(), `like ${like.status()}`).toBeTruthy();
  const lj = (await like.json()) as { status?: string; created?: boolean };
  expect(lj.status).toBe("ok");
  expect(lj.created).toBe(true);
});

test("F-016 · DELETE like then GET liked_by_me false then POST like relike", async ({
  request,
}) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `e2e-f016b-${suffix}@traveltrust.test`;

  const reg = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password: "TestPass12!", nickname: "e2eF16b" },
  });
  expect(reg.ok()).toBeTruthy();
  const rj = (await reg.json()) as { status?: string; token?: string };
  expect(rj.status).toBe("ok");
  const token = rj.token?.trim() ?? "";

  const post = await request.post(`${API_BASE}/api/v1/community/posts`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: { body: `e2e-f016b ${suffix}`, post_type: "text" },
  });
  expect(post.ok()).toBeTruthy();
  const postId = ((await post.json()) as { id?: string }).id ?? "";

  const like1 = await request.post(`${API_BASE}/api/v1/community/posts/${postId}/like`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(like1.ok()).toBeTruthy();
  const l1 = (await like1.json()) as { status?: string; created?: boolean };
  expect(l1.status).toBe("ok");
  expect(l1.created).toBe(true);

  const det1 = await request.get(`${API_BASE}/api/v1/community/posts/${postId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(det1.ok()).toBeTruthy();
  const d1 = (await det1.json()) as { post?: { liked_by_me?: boolean } };
  expect(d1.post?.liked_by_me).toBe(true);

  const del = await request.delete(`${API_BASE}/api/v1/community/posts/${postId}/like`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(del.ok(), `DELETE like ${del.status()}`).toBeTruthy();
  const dj = (await del.json()) as { status?: string };
  expect(dj.status).toBe("ok");

  const det2 = await request.get(`${API_BASE}/api/v1/community/posts/${postId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(det2.ok()).toBeTruthy();
  const d2 = (await det2.json()) as { post?: { liked_by_me?: boolean } };
  expect(d2.post?.liked_by_me).toBe(false);

  const like2 = await request.post(`${API_BASE}/api/v1/community/posts/${postId}/like`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(like2.ok()).toBeTruthy();
  const l2 = (await like2.json()) as { status?: string; created?: boolean };
  expect(l2.status).toBe("ok");
  expect(l2.created).toBe(true);
});

test("F-017 · POST collect returns created true", async ({ request }) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `e2e-f017-${suffix}@traveltrust.test`;

  const reg = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password: "TestPass12!", nickname: "e2eCol" },
  });
  expect(reg.ok()).toBeTruthy();
  const rj = (await reg.json()) as { status?: string; token?: string };
  expect(rj.status).toBe("ok");
  const token = rj.token?.trim() ?? "";

  const post = await request.post(`${API_BASE}/api/v1/community/posts`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: { body: `e2e-f017 ${suffix}`, post_type: "text" },
  });
  expect(post.ok()).toBeTruthy();
  const postId = ((await post.json()) as { id?: string }).id ?? "";

  const col = await request.post(`${API_BASE}/api/v1/community/posts/${postId}/collect`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(col.ok(), `collect ${col.status()}`).toBeTruthy();
  const cj = (await col.json()) as { status?: string; created?: boolean };
  expect(cj.status).toBe("ok");
  expect(cj.created).toBe(true);
});

test("F-017 · DELETE collect then GET collected_by_me false then POST collect recollect", async ({
  request,
}) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `e2e-f017b-${suffix}@traveltrust.test`;

  const reg = await request.post(`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password: "TestPass12!", nickname: "e2eF17b" },
  });
  expect(reg.ok()).toBeTruthy();
  const rj = (await reg.json()) as { status?: string; token?: string };
  expect(rj.status).toBe("ok");
  const token = rj.token?.trim() ?? "";

  const post = await request.post(`${API_BASE}/api/v1/community/posts`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: { body: `e2e-f017b ${suffix}`, post_type: "text" },
  });
  expect(post.ok()).toBeTruthy();
  const postId = ((await post.json()) as { id?: string }).id ?? "";

  const c1 = await request.post(`${API_BASE}/api/v1/community/posts/${postId}/collect`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(c1.ok()).toBeTruthy();
  const j1 = (await c1.json()) as { status?: string; created?: boolean };
  expect(j1.status).toBe("ok");
  expect(j1.created).toBe(true);

  const det1 = await request.get(`${API_BASE}/api/v1/community/posts/${postId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(det1.ok()).toBeTruthy();
  const d1 = (await det1.json()) as { post?: { collected_by_me?: boolean } };
  expect(d1.post?.collected_by_me).toBe(true);

  const del = await request.delete(`${API_BASE}/api/v1/community/posts/${postId}/collect`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(del.ok(), `DELETE collect ${del.status()}`).toBeTruthy();
  const dj = (await del.json()) as { status?: string };
  expect(dj.status).toBe("ok");

  const det2 = await request.get(`${API_BASE}/api/v1/community/posts/${postId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(det2.ok()).toBeTruthy();
  const d2 = (await det2.json()) as { post?: { collected_by_me?: boolean } };
  expect(d2.post?.collected_by_me).toBe(false);

  const c2 = await request.post(`${API_BASE}/api/v1/community/posts/${postId}/collect`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(c2.ok()).toBeTruthy();
  const j2 = (await c2.json()) as { status?: string; created?: boolean };
  expect(j2.status).toBe("ok");
  expect(j2.created).toBe(true);
});
