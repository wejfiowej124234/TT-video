/**
 * ① **TT-NEXT-BATCH A2 / TT-31 B3**：帖子详情抽屉 **评论排序三态** 与 **`GET /api/v1/community/posts/:id/comments`** 查询串对拍
 *（`sort=latest` / `sort=hot`；**时间序** 默认可能**省略** `sort=`，仅带 **`limit=`**，与 **`buildCommunityPostCommentsQueryString`** 同源）。
 *
 * 依赖：**`traveltrust-api`** + Postgres + **`SEED_TEST_ACCOUNTS`**（与 **`93-matrix-path-community-feed-post`** 同源）。
 */
import { test, expect } from "@playwright/test";
import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import {
  requestGetExpectOkWith429Backoff,
  requestPostExpectOkWith429Backoff,
  requestPostWith429Retry,
} from "./helpers/playwright429Backoff";
import { communityFeedPageShell, communityPostDetailDrawerShell } from "./helpers/pageShells";
import { expectCommunityFeedPostDeepLinkSettled } from "./helpers/communityFeedPostDeepLink";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { gotoSmoke } from "./helpers/smoke-nav";

const API_BASE = defaultApiBase();

function commentsListUrlPredicate(postId: string, url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.pathname === `/api/v1/community/posts/${postId}/comments` ||
      u.pathname.endsWith(`/community/posts/${postId}/comments`)
    );
  } catch {
    return url.includes(`/community/posts/${postId}/comments`);
  }
}

test.describe("community post detail · comment sort tabs (04 GET …/comments)", () => {
  test("detail drawer: sort Latest / Hot / Timeline triggers GET comments with expected query", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);

    await skipIfApiDown(request);
    await seedTestAccountsAndReleaseGuideSlot(request, API_BASE);

    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred, "tourist@test.com login").toBeTruthy();
    const token = cred!.token;
    const userId = cred!.userId ?? "";

    await requestGetExpectOkWith429Backoff(request, `${API_BASE}/api/v1/community/feed`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const stamp = Date.now();
    const bodyText = `e2e-comment-sort-${stamp}`;
    const idemPost =
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `post-${stamp}`;

    const createRes = await requestPostExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/community/posts`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Idempotency-Key": idemPost,
        },
        data: { post_type: "text", body: bodyText },
      },
    );
    const created = (await createRes.json()) as { id?: string; status?: string };
    expect(created.status).toBe("ok");
    const postId = (created.id ?? "").trim();
    expect(postId.length).toBeGreaterThan(10);

    const commentBody = `e2e-root-comment-${stamp}`;
    const commentRes = await requestPostWith429Retry(request, `${API_BASE}/api/v1/community/posts/${postId}/comments`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      data: { body: commentBody },
    });
    if (!commentRes.ok()) {
      test.skip(true, `POST comment failed HTTP ${commentRes.status} — ${(await commentRes.text()).slice(0, 200)}`);
    }
    const commentJson = (await commentRes.json()) as { status?: string };
    expect(commentJson.status).toBe("ok");

    await gotoWithBearerSession(page, "/community", { token, userId });
    const feedShell = communityFeedPageShell(page);
    await expect(feedShell).toBeVisible({ timeout: 90_000 });

    await gotoSmoke(page, `/community?post=${encodeURIComponent(postId)}`, { timeout: 90_000 });
    await expect(feedShell).toBeVisible({ timeout: 90_000 });
    await expectCommunityFeedPostDeepLinkSettled(page, feedShell);

    const postDrawer = communityPostDetailDrawerShell(page);
    await expect
      .poll(async () => (await postDrawer.innerText()).includes(commentBody), { timeout: 90_000 })
      .toBe(true);

    const sortTabs = postDrawer.getByRole("tablist", { name: /Sort comments|评论排序/i });
    await expect(sortTabs).toBeVisible({ timeout: 30_000 });

    const latestTab = postDrawer.getByRole("tab", { name: /Latest|最新/i });
    const hotTab = postDrawer.getByRole("tab", { name: /^Hot$|^最热$/i });
    const timelineTab = postDrawer.getByRole("tab", { name: /Timeline|时间序/i });

    const waitLatest = page.waitForResponse(
      (res) =>
        res.request().method() === "GET" &&
        commentsListUrlPredicate(postId, res.url()) &&
        res.url().includes("sort=latest") &&
        res.ok(),
      { timeout: 90_000 },
    );
    await Promise.all([waitLatest, latestTab.click()]);

    const waitHot = page.waitForResponse(
      (res) =>
        res.request().method() === "GET" &&
        commentsListUrlPredicate(postId, res.url()) &&
        res.url().includes("sort=hot") &&
        res.ok(),
      { timeout: 90_000 },
    );
    await Promise.all([waitHot, hotTab.click()]);

    const waitChrono = page.waitForResponse(
      (res) => {
        if (res.request().method() !== "GET" || !res.ok()) return false;
        if (!commentsListUrlPredicate(postId, res.url())) return false;
        if (res.url().includes("sort=latest") || res.url().includes("sort=hot")) return false;
        return res.url().includes("limit=");
      },
      { timeout: 90_000 },
    );
    await Promise.all([waitChrono, timelineTab.click()]);
  });
});
