import type { Page } from "@playwright/test";

const RE_HYDRATE_POST = /\/api\/v1\/community\/posts\/e2e-me-hydrate-/;
const RE_MOCK_ME_POST = /\/api\/v1\/community\/posts\/e2e-me-post-/;
/** Playwright glob（contract 符号名；运行时 list 拦截用 RE_ME_POSTS_LIST） */
const ME_POSTS_LIST_GLOB = "**/api/v1/community/me/posts**";
const RE_ME_POSTS_LIST = /\/api\/v1\/community\/me\/posts(\?|$)/;
const RE_ME_COLLECTS_LIST = /\/api\/v1\/community\/me\/collects(\?|$)/;
const RE_ME_LIKES_LIST = /\/api\/v1\/community\/me\/likes(\?|$)/;

function mockPostListRow(id: string, n: number, userId: string) {
  return {
    id,
    user_id: userId,
    body: `E2E load-more mock post ${n}`,
    post_type: "text",
    destination: "E2E",
    tags: ["e2e"],
    media_urls: [] as string[],
    created_at: "2026-01-01T00:00:00.000Z",
    like_count: 0,
    comment_count: 0,
    collect_count: 0,
    visibility_status: "public",
    author_nickname: "E2E",
    author_avatar_url: null,
    author_role: "traveler",
  };
}

function mockPostDetail(id: string, n: number, userId: string) {
  return {
    status: "ok",
    post: mockPostListRow(id, n, userId),
  };
}

function postIdFromUrl(requestUrl: string): string {
  return requestUrl.split("/posts/")[1]?.split("?")[0] ?? "";
}

async function routeOnPage(
  page: Page,
  url: RegExp | string,
  handler: Parameters<Page["route"]>[1],
): Promise<void> {
  await page.route(url, handler);
}

/** 我的帖子：`next_cursor` 分页 load-more（首屏 30 + 第二页 10）。 */
export async function installCommunityMePostsLoadMoreMocks(page: Page, userId: string): Promise<void> {
  const page1Ids = Array.from({ length: 30 }, (_, i) => `e2e-me-post-p1-${String(i + 1).padStart(2, "0")}`);
  const page2Ids = Array.from({ length: 10 }, (_, i) => `e2e-me-post-p2-${String(i + 1).padStart(2, "0")}`);
  const allIds = [...page1Ids, ...page2Ids];

  await routeOnPage(page, RE_ME_POSTS_LIST, async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    const reqUrl = new URL(route.request().url());
    const cursor = reqUrl.searchParams.get("cursor");
    const ids = cursor === "e2e-page-2" ? page2Ids : page1Ids;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "ok",
        posts: ids.map((id, i) => mockPostListRow(id, i + 1, userId)),
        next_cursor: cursor === "e2e-page-2" ? null : "e2e-page-2",
      }),
    });
  });

  await routeOnPage(page, RE_MOCK_ME_POST, async (route) => {
    if (route.request().method() !== "GET" || route.request().url().includes("/comments")) {
      await route.continue();
      return;
    }
    const id = postIdFromUrl(route.request().url());
    const n = allIds.indexOf(id) + 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockPostDetail(id, n > 0 ? n : 1, userId)),
    });
  });
}

const HYDRATE_MOCK_USER = "e2e-load-more-user";

function idsWithPrefix(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}-${String(i + 1).padStart(2, "0")}`);
}

async function installPostIdHydrateMocks(page: Page, ids: readonly string[]): Promise<void> {
  await routeOnPage(page, RE_HYDRATE_POST, async (route) => {
    if (route.request().method() !== "GET" || route.request().url().includes("/comments")) {
      await route.continue();
      return;
    }
    const id = postIdFromUrl(route.request().url());
    const n = ids.indexOf(id) + 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockPostDetail(id, n > 0 ? n : 1, HYDRATE_MOCK_USER)),
    });
  });
}

/** 收藏：35 条 id，首屏 hydrate 24 后 load-more。 */
export async function installCommunityMeCollectsLoadMoreMocks(page: Page): Promise<void> {
  const ids = idsWithPrefix("e2e-me-hydrate-collect", 35);
  await routeOnPage(page, RE_ME_COLLECTS_LIST, async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "ok",
        collects: ids.map((post_id) => ({ post_id })),
      }),
    });
  });
  await installPostIdHydrateMocks(page, ids);
}

/** 收藏：5 条 id，其中 2 条 hydrate 404 → partialHint（与 Likes 同级）。 */
export async function installCommunityMeCollectsPartialHydrateMocks(page: Page): Promise<void> {
  const okIds = idsWithPrefix("e2e-me-hydrate-collect-ok", 3);
  const failIds = idsWithPrefix("e2e-me-hydrate-collect-fail", 2);
  const allIds = [...okIds, ...failIds];

  await routeOnPage(page, RE_ME_COLLECTS_LIST, async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "ok",
        collects: allIds.map((post_id) => ({ post_id })),
      }),
    });
  });

  await routeOnPage(page, /\/api\/v1\/community\/posts\/e2e-me-hydrate-collect-/, async (route) => {
    if (route.request().method() !== "GET" || route.request().url().includes("/comments")) {
      await route.continue();
      return;
    }
    const id = postIdFromUrl(route.request().url());
    if (failIds.includes(id)) {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ status: "error", message: "not_found" }),
      });
      return;
    }
    const n = okIds.indexOf(id) + 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockPostDetail(id, n > 0 ? n : 1, HYDRATE_MOCK_USER)),
    });
  });
}

/** 赞过：35 条 id，首屏 hydrate 24 后 load-more。 */
export async function installCommunityMeLikesLoadMoreMocks(page: Page): Promise<void> {
  const ids = idsWithPrefix("e2e-me-hydrate-like", 35);
  await routeOnPage(page, RE_ME_LIKES_LIST, async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "ok",
        likes: ids.map((post_id) => ({ post_id })),
      }),
    });
  });
  await installPostIdHydrateMocks(page, ids);
}
