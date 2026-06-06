import { expect, type APIRequestContext } from "@playwright/test";

import { newIdempotencyKey } from "./idempotencyKey";
import { requestPostExpectOkWith429Backoff } from "./playwright429Backoff";

/** 与 `frontend/lib/communityMeListPageSize.ts` · `COMMUNITY_ME_COLLECTS_HYDRATE_PAGE_SIZE` 同源。 */
const ME_COLLECTS_HYDRATE_PAGE_SIZE = 24;

export type TouristSession = { token: string; userId: string };

/** 为 closeout E2E 预置 tourist 文本帖（含 `post_too_fast` 退避）。 */
export async function seedTouristTextPost(
  request: APIRequestContext,
  apiBase: string,
  session: TouristSession,
  label: string,
): Promise<{ postId: string; body: string }> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const body = `e2e-me-l5-${label}-${stamp}`;
  const createRes = await requestPostExpectOkWith429Backoff(request, `${apiBase}/api/v1/community/posts`, {
    headers: {
      Authorization: `Bearer ${session.token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": newIdempotencyKey(`me-l5-post-${label}`),
    },
    data: { post_type: "text", body },
  });
  const created = (await createRes.json()) as { id?: string; status?: string };
  expect(created.status).toBe("ok");
  const postId = (created.id ?? "").trim();
  expect(postId.length).toBeGreaterThan(8);
  return { postId, body };
}

/** 发帖并收藏，供 `/community/me/collects` drawer 用例使用。 */
export async function seedTouristCollectedPost(
  request: APIRequestContext,
  apiBase: string,
  session: TouristSession,
  label: string,
): Promise<{ postId: string; body: string }> {
  const { postId, body } = await seedTouristTextPost(request, apiBase, session, label);
  const colRes = await requestPostExpectOkWith429Backoff(
    request,
    `${apiBase}/api/v1/community/posts/${encodeURIComponent(postId)}/collect`,
    {
      headers: { Authorization: `Bearer ${session.token}` },
    },
  );
  const colJson = (await colRes.json()) as { status?: string };
  expect(colJson.status).toBe("ok");
  return { postId, body };
}

/** `GET …/me/posts` 列表内帖子索引（与页内 thumb 网格顺序一致）。 */
export async function indexInMePostsList(
  request: APIRequestContext,
  apiBase: string,
  session: TouristSession,
  postId: string,
): Promise<number> {
  const res = await request.get(`${apiBase}/api/v1/community/me/posts`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  const json = (await res.json()) as { posts?: Array<{ id?: string }> };
  const idx = (json.posts ?? []).findIndex((p) => (p.id ?? "").trim() === postId);
  expect(idx, `post ${postId} not in me/posts`).toBeGreaterThanOrEqual(0);
  return idx;
}

async function listMeCollectPostIds(
  request: APIRequestContext,
  apiBase: string,
  session: TouristSession,
): Promise<string[]> {
  const res = await request.get(`${apiBase}/api/v1/community/me/collects`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  const json = (await res.json()) as { collects?: Array<{ post_id?: string }> };
  return (json.collects ?? [])
    .map((c) => (c.post_id ?? "").trim())
    .filter((id) => id.length > 0);
}

/** Serial closeout：partialHint 预置后供 drawer 用例复用，避免串行 `post_too_fast`。单独 `-g` 跑 drawer 时会自行 seed。 */
let serialCollectedPostId: string | null = null;

export function setSerialCollectedPostId(postId: string): void {
  serialCollectedPostId = postId;
}

export async function ensureSerialCollectedPost(
  request: APIRequestContext,
  apiBase: string,
  session: TouristSession,
  fallbackLabel: string,
): Promise<{ postId: string }> {
  if (serialCollectedPostId) return { postId: serialCollectedPostId };
  const seeded = await seedTouristCollectedPost(request, apiBase, session, fallbackLabel);
  serialCollectedPostId = seeded.postId;
  return { postId: seeded.postId };
}

/** 与 `hydrateCommunityMeCollectPostIds` 同源：首批 hydrate 内可渲染帖子的网格索引。 */
export async function indexInMeCollectsHydratedGrid(
  request: APIRequestContext,
  apiBase: string,
  session: TouristSession,
  postId: string,
): Promise<number> {
  const ids = await listMeCollectPostIds(request, apiBase, session);
  const rawIdx = ids.findIndex((id) => id === postId);
  expect(rawIdx, `post ${postId} not in me/collects`).toBeGreaterThanOrEqual(0);
  expect(
    rawIdx,
    `post ${postId} must appear in first hydrate batch (${ME_COLLECTS_HYDRATE_PAGE_SIZE})`,
  ).toBeLessThan(ME_COLLECTS_HYDRATE_PAGE_SIZE);

  const batch = ids.slice(0, ME_COLLECTS_HYDRATE_PAGE_SIZE);
  const hydratedIds: string[] = [];
  for (const id of batch) {
    const postRes = await request.get(`${apiBase}/api/v1/community/posts/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    if (!postRes.ok()) continue;
    const postJson = (await postRes.json()) as { post?: unknown };
    if (postJson.post != null) hydratedIds.push(id);
  }

  const gridIdx = hydratedIds.findIndex((id) => id === postId);
  expect(gridIdx, `post ${postId} not hydrated in first collects batch`).toBeGreaterThanOrEqual(0);
  return gridIdx;
}
