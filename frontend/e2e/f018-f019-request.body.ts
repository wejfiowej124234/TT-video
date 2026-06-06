/**
 * **§8.2 · F-018 / F-019 / F-020** — Playwright **`request`** 直连 **traveltrust-api**（与 Rust **`community_report_me_posts_db_api_tests`** / **`me_market_bookmarks_db_api_tests`** 同形）。
 *
 * - **F-018**：**`POST /api/v1/community/reports`**（**`target_type: post`**）→ **`status=ok`** 且 **`id`** 为 UUID（**D-COM-010**）；**无头 `GET …/posts/:id`** **举报后仍可读**（**`v1.4.279`**；与 **`matrix_93_d_com_010b_f018_*` API·IT** **对齐**）。
 * - **F-019**：发帖后 **`GET /api/v1/community/me/posts?limit=20`** → **`posts`** 含该帖 **`id`**（**D-COM-009**）；**`POST like`→`GET …/me/likes`→`DELETE like`→`GET …/me/likes`** **不含** **`post_id`** **+** **`POST collect`→`GET …/me/collects`→`DELETE collect`→`GET …/me/collects`**（**`v1.4.279`**；与 **`009c`/`009d`/`009b`/`009e` API·IT** **对齐**）。
 * - **F-020**：见 **`f020-market-bookmarks-request.body.ts`**（由根 **`f018-f019-f020-request.spec.ts`** 侧载）。
 *
 * **环境**：**`DATABASE_URL`** + **`P3_CHAIN_OFF=1`**（与 **`e2e:api-b-orders-local`** / **`f015-*`** 同口径）。
 * **限流**：**`/api/v1/community/*`** 遇 **429** 时 **`playwright429Backoff`**（与 **F-014** 同源）。
 */
import { test, expect } from "@playwright/test";
import { defaultApiBase } from "./helpers/apiSession";
import { newIdempotencyKey } from "./helpers/idempotencyKey";
import {
  requestDeleteExpectOkWith429Backoff,
  requestGetExpectOkWith429Backoff,
  requestGetWith429Retry,
  requestPostExpectOkWith429Backoff,
  requestPostWith429Retry,
} from "./helpers/playwright429Backoff";
import { skipIfApiDown } from "./helpers/skipIfApiDown";

const API_BASE = defaultApiBase();

test("F-018 · POST community report returns ok and report id", async ({ request }) => {
  await skipIfApiDown(request);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const authorEmail = `e2e-f018-a-${suffix}@traveltrust.test`;
  const reporterEmail = `e2e-f018-r-${suffix}@traveltrust.test`;

  const regA = await requestPostWith429Retry(request,`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: authorEmail, password: "TestPass12!", nickname: "e2eAuthor" },
  });
  expect(regA.ok()).toBeTruthy();
  const regAJ = (await regA.json()) as { status?: string; token?: string };
  expect(regAJ.status).toBe("ok");
  const tokenAuthor = regAJ.token?.trim() ?? "";

  const regR = await requestPostWith429Retry(request,`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: reporterEmail, password: "TestPass12!", nickname: "e2eReporter" },
  });
  expect(regR.ok()).toBeTruthy();
  const regRJ = (await regR.json()) as { status?: string; token?: string };
  expect(regRJ.status).toBe("ok");
  const tokenReporter = regRJ.token?.trim() ?? "";

  const post = await requestPostExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/community/posts`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenAuthor}`,
      },
      data: { body: `e2e-f018 target ${suffix}`, post_type: "text" },
    },
  );
  const postId = ((await post.json()) as { id?: string }).id ?? "";
  expect(postId.length).toBeGreaterThan(0);

  const rep = await requestPostExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/community/reports`,
    {
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
    },
  );
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

  const regA = await requestPostWith429Retry(request,`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: authorEmail, password: "TestPass12!", nickname: "e2eAuthorB" },
  });
  expect(regA.ok()).toBeTruthy();
  const regAJ = (await regA.json()) as { status?: string; token?: string };
  expect(regAJ.status).toBe("ok");
  const tokenAuthor = regAJ.token?.trim() ?? "";

  const regR = await requestPostWith429Retry(request,`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email: reporterEmail, password: "TestPass12!", nickname: "e2eReporterB" },
  });
  expect(regR.ok()).toBeTruthy();
  const regRJ = (await regR.json()) as { status?: string; token?: string };
  expect(regRJ.status).toBe("ok");
  const tokenReporter = regRJ.token?.trim() ?? "";

  const postBody = `e2e-f018b target ${suffix}`;
  const post = await requestPostExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/community/posts`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenAuthor}`,
      },
      data: { body: postBody, post_type: "text" },
    },
  );
  const postId = ((await post.json()) as { id?: string }).id ?? "";
  expect(postId.length).toBeGreaterThan(0);

  const rep = await requestPostExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/community/reports`,
    {
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
    },
  );

  const anon = await requestGetExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/community/posts/${postId}`,
  );
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

  const reg = await requestPostWith429Retry(request,`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password: "TestPass12!", nickname: "e2eMePosts" },
  });
  expect(reg.ok()).toBeTruthy();
  const regJ = (await reg.json()) as { status?: string; token?: string };
  expect(regJ.status).toBe("ok");
  const token = regJ.token?.trim() ?? "";

  const post = await requestPostExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/community/posts`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: { body: `e2e-f019 me list ${suffix}`, post_type: "text" },
    },
  );
  const postId = ((await post.json()) as { id?: string }).id ?? "";

  const list = await requestGetExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/community/me/posts?limit=20`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
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

  const reg = await requestPostWith429Retry(request,`${API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password: "TestPass12!", nickname: "e2eMeLists" },
  });
  expect(reg.ok()).toBeTruthy();
  const regJ = (await reg.json()) as { status?: string; token?: string };
  expect(regJ.status).toBe("ok");
  const token = regJ.token?.trim() ?? "";

  const post = await requestPostExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/community/posts`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: { body: `e2e-f019b lists ${suffix}`, post_type: "text" },
    },
  );
  const postId = ((await post.json()) as { id?: string }).id ?? "";
  expect(postId.length).toBeGreaterThan(0);

  const like = await requestPostExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/community/posts/${postId}/like`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const likeJ = (await like.json()) as { status?: string; created?: boolean };
  expect(likeJ.status).toBe("ok");
  expect(likeJ.created).toBe(true);

  const likes1 = await requestGetExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/community/me/likes?limit=20`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const lj1 = (await likes1.json()) as {
    status?: string;
    likes?: Array<{ post_id?: string }>;
  };
  expect(lj1.status).toBe("ok");
  expect((lj1.likes ?? []).some((r) => r.post_id === postId)).toBe(true);

  const unlike = await requestDeleteExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/community/posts/${postId}/like`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  const likes2 = await requestGetExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/community/me/likes?limit=20`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const lj2 = (await likes2.json()) as {
    status?: string;
    likes?: Array<{ post_id?: string }>;
  };
  expect(lj2.status).toBe("ok");
  expect((lj2.likes ?? []).some((r) => r.post_id === postId)).toBe(false);

  const coll = await requestPostExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/community/posts/${postId}/collect`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const cj = (await coll.json()) as { status?: string; created?: boolean };
  expect(cj.status).toBe("ok");
  expect(cj.created).toBe(true);

  const col1 = await requestGetExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/community/me/collects?limit=20`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const cj1 = (await col1.json()) as {
    status?: string;
    collects?: Array<{ post_id?: string }>;
  };
  expect(cj1.status).toBe("ok");
  expect((cj1.collects ?? []).some((r) => r.post_id === postId)).toBe(true);

  const uncoll = await requestDeleteExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/community/posts/${postId}/collect`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  const col2 = await requestGetExpectOkWith429Backoff(
    request,
    `${API_BASE}/api/v1/community/me/collects?limit=20`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const cj2 = (await col2.json()) as {
    status?: string;
    collects?: Array<{ post_id?: string }>;
  };
  expect(cj2.status).toBe("ok");
  expect((cj2.collects ?? []).some((r) => r.post_id === postId)).toBe(false);
});
