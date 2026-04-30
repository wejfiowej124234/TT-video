/**
 * **§8.2 · F-012 / F-013 / F-014** — Playwright **`request`** 直连 **traveltrust-api**。
 *
 * - **F-012**：**`POST /api/v1/itineraries`** → **`status=ok`**、**`version=1`**、**`order_status=draft`**、**`order_id`**（**D-ITN-001B** ↔ **`matrix_93_d_itn_001b_f012_*`**）。
 * - **F-013**：**`POST /api/v1/orders/:id/confirm-final-plan`**（**`expected_version: 1`**）→ **`snapshot_hash`** 以 **`0x`** 开头。
 * - **F-014**：**`POST /api/v1/community/posts`** 发帖 → **`GET /api/v1/community/feed?limit=20`** → **`posts`** 含该帖 **`id`**（与 **`community_feed_like_collect_db_api_tests`** 同源）；**`tags[]` + `GET …/feed?tag=`** **单列过滤**（**D-COM-001C** ↔ **`matrix_93_d_com_001c_f014_*`**）；**`POST /api/v1/community/users/:id/follow`** → **Bearer** **`GET …/feed?mode=follow`** **含被关注者帖**（与 **`matrix_93_d_com_001g_f014_*` API·IT** **HTTP 对齐**）。
 *
 * **环境**：**`PLAYWRIGHT_API_BASE_URL`**；**PG** 由 **`start-api-for-playwright`** 注入；**`P3_CHAIN_OFF=1`** 与 **`e2e:api-b-orders-local`** 同口径。
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

test.describe.serial("§8.2 E2E F-012 / F-013 — itineraries + confirm-final-plan", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `e2e-f012-f013-${suffix}@traveltrust.test`;
  let token = "";
  let orderId = "";

  test("F-012 · POST /api/v1/itineraries creates draft + order_id", async ({ request }) => {
    await skipIfApiDown(request);

    const reg = await request.post(`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: {
        email,
        password: "TestPass12!",
        nickname: "e2eItin",
      },
    });
    expect(reg.ok(), `register HTTP ${reg.status()}`).toBeTruthy();
    const rj = (await reg.json()) as { status?: string; token?: string };
    expect(rj.status).toBe("ok");
    token = rj.token?.trim() ?? "";
    expect(token.length).toBeGreaterThan(0);

    const itin = await request.post(`${API_BASE}/api/v1/itineraries`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: {
        destination: "中国",
        city: "北京",
        travel_date: "2025-07-01",
        days: 2,
        budget_min: 1000.0,
        budget_max: 2000.0,
      },
    });
    expect(itin.ok(), `POST itineraries HTTP ${itin.status()}`).toBeTruthy();
    const ij = (await itin.json()) as {
      status?: string;
      version?: number;
      order_status?: string;
      order_id?: string;
    };
    expect(ij.status).toBe("ok");
    expect(ij.version).toBe(1);
    expect(ij.order_status).toBe("draft");
    orderId = ij.order_id ?? "";
    expect(orderId.length).toBeGreaterThan(0);
  });

  test("F-013 · POST …/confirm-final-plan returns snapshot_hash", async ({ request }) => {
    await skipIfApiDown(request);
    const confirm = await request.post(
      `${API_BASE}/api/v1/orders/${orderId}/confirm-final-plan`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: { expected_version: 1 },
      },
    );
    expect(confirm.ok(), `confirm-final HTTP ${confirm.status()}`).toBeTruthy();
    const cj = (await confirm.json()) as { status?: string; snapshot_hash?: string };
    expect(cj.status).toBe("ok");
    const snap = cj.snapshot_hash ?? "";
    expect(snap.startsWith("0x")).toBe(true);
  });
});

test.describe("§8.2 E2E F-014 — community feed lists created post", () => {
  test("F-014 · POST post then GET feed includes id", async ({ request }) => {
    await skipIfApiDown(request);

    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const email = `e2e-f014-${suffix}@traveltrust.test`;
    const reg = await request.post(`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: {
        email,
        password: "TestPass12!",
        nickname: "e2eFeed",
      },
    });
    expect(reg.ok(), `register HTTP ${reg.status()}`).toBeTruthy();
    const rj = (await reg.json()) as { status?: string; token?: string };
    expect(rj.status).toBe("ok");
    const tok = rj.token?.trim() ?? "";
    expect(tok.length).toBeGreaterThan(0);

    const body = `e2e-f014 feed ${suffix}`;
    const post = await request.post(`${API_BASE}/api/v1/community/posts`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tok}`,
      },
      data: { body, post_type: "text" },
    });
    expect(post.ok(), `POST posts HTTP ${post.status()}`).toBeTruthy();
    const pj = (await post.json()) as { id?: string };
    const postId = pj.id ?? "";
    expect(postId.length).toBeGreaterThan(0);

    const feed = await request.get(`${API_BASE}/api/v1/community/feed?limit=20`);
    expect(feed.ok(), `GET feed HTTP ${feed.status()}`).toBeTruthy();
    const fj = (await feed.json()) as { status?: string; posts?: Array<{ id?: string }> };
    expect(fj.status).toBe("ok");
    const posts = fj.posts ?? [];
    expect(posts.some((p) => p.id === postId)).toBe(true);
  });

  test("F-014 · POST tagged post then GET feed?tag includes same post id", async ({ request }) => {
    await skipIfApiDown(request);
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const email = `e2e-f014tag-${suffix}@traveltrust.test`;
    const tag = `e2e_tag_${suffix.replace(/[^a-zA-Z0-9_]/g, "_")}`;

    const reg = await request.post(`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: {
        email,
        password: "TestPass12!",
        nickname: "e2eF14tag",
      },
    });
    expect(reg.ok(), `register HTTP ${reg.status()}`).toBeTruthy();
    const rj = (await reg.json()) as { status?: string; token?: string };
    expect(rj.status).toBe("ok");
    const tok = rj.token?.trim() ?? "";
    expect(tok.length).toBeGreaterThan(0);

    const body = `e2e-f014 tag body ${suffix}`;
    const post = await request.post(`${API_BASE}/api/v1/community/posts`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tok}`,
      },
      data: { body, post_type: "text", tags: [tag] },
    });
    expect(post.ok(), `POST posts HTTP ${post.status()}`).toBeTruthy();
    const pj = (await post.json()) as { id?: string };
    const postId = pj.id ?? "";
    expect(postId.length).toBeGreaterThan(0);

    const encTag = encodeURIComponent(tag);
    const feed = await request.get(
      `${API_BASE}/api/v1/community/feed?limit=50&tag=${encTag}`,
    );
    expect(feed.ok(), `GET feed tag HTTP ${feed.status()}`).toBeTruthy();
    const fj = (await feed.json()) as { status?: string; posts?: Array<{ id?: string }> };
    expect(fj.status).toBe("ok");
    const posts = fj.posts ?? [];
    expect(posts.some((p) => p.id === postId)).toBe(true);
  });

  test("F-014 · HTTP follow then follower GET feed mode=follow includes author post", async ({
    request,
  }) => {
    await skipIfApiDown(request);
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const authorEmail = `e2e-f014-a-${suffix}@traveltrust.test`;
    const followerEmail = `e2e-f014-b-${suffix}@traveltrust.test`;

    const regA = await request.post(`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email: authorEmail, password: "TestPass12!", nickname: "e2eF14A" },
    });
    expect(regA.ok()).toBeTruthy();
    const aj = (await regA.json()) as { status?: string; token?: string };
    expect(aj.status).toBe("ok");
    const tokenAuthor = aj.token?.trim() ?? "";

    const regB = await request.post(`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email: followerEmail, password: "TestPass12!", nickname: "e2eF14B" },
    });
    expect(regB.ok()).toBeTruthy();
    const bj = (await regB.json()) as { status?: string; token?: string };
    expect(bj.status).toBe("ok");
    const tokenFollower = bj.token?.trim() ?? "";

    const meA = await request.get(`${API_BASE}/api/v1/me`, {
      headers: { Authorization: `Bearer ${tokenAuthor}` },
    });
    expect(meA.ok(), `GET author me ${meA.status()}`).toBeTruthy();
    const meAj = (await meA.json()) as { status?: string; user?: { id?: string } };
    expect(meAj.status).toBe("ok");
    const authorUserId = meAj.user?.id ?? "";
    expect(authorUserId.length).toBeGreaterThan(0);

    const body = `e2e-f014 follow-mode ${suffix}`;
    const post = await request.post(`${API_BASE}/api/v1/community/posts`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenAuthor}`,
      },
      data: { body, post_type: "text" },
    });
    expect(post.ok(), `POST posts ${post.status()}`).toBeTruthy();
    const pj = (await post.json()) as { id?: string };
    const postId = pj.id ?? "";
    expect(postId.length).toBeGreaterThan(0);

    const follow = await request.post(
      `${API_BASE}/api/v1/community/users/${authorUserId}/follow`,
      { headers: { Authorization: `Bearer ${tokenFollower}` } },
    );
    expect(follow.ok(), `POST follow ${follow.status()} ${await follow.text()}`).toBeTruthy();
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
});
