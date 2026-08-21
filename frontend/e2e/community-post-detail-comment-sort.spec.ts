/**
 * ① **R-COMM-COMMENT-IDENTITY-SORT-CONTRAST-1**：帖子详情评论区 **无排序三态 Tab**；
 * 默认 **`GET …/comments?sort=hot`**（互动/回复多优先，同分时间正序）。
 *
 * 依赖：**`traveltrust-api`** + Postgres + **`SEED_TEST_ACCOUNTS`**。
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

test.describe("community post detail · comment default sort (hot · no tabs)", () => {
  test("detail drawer: no sort tablist; initial comments GET uses sort=hot", async ({
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
        data: {
          post_type: "photo",
          media_urls: ["/api/v1/uploads/community-posts/e2e-legacy.png"],
          body: bodyText,
        },
      },
    );
    const created = (await createRes.json()) as { id?: string; status?: string };
    expect(created.status).toBe("ok");
    const postId = (created.id ?? "").trim();
    expect(postId.length).toBeGreaterThan(10);

    const commentBody = `e2e-root-comment-${stamp}`;
    const commentRes = await requestPostWith429Retry(
      request,
      `${API_BASE}/api/v1/community/posts/${postId}/comments`,
      {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        data: { body: commentBody },
      },
    );
    if (!commentRes.ok()) {
      test.skip(true, `POST comment failed HTTP ${commentRes.status} — ${(await commentRes.text()).slice(0, 200)}`);
    }
    const commentJson = (await commentRes.json()) as { status?: string };
    expect(commentJson.status).toBe("ok");

    await gotoWithBearerSession(page, "/community", { token, userId });
    const feedShell = communityFeedPageShell(page);
    await expect(feedShell).toBeVisible({ timeout: 90_000 });

    const waitHot = page.waitForResponse(
      (res) =>
        res.request().method() === "GET" &&
        commentsListUrlPredicate(postId, res.url()) &&
        res.url().includes("sort=hot") &&
        res.ok(),
      { timeout: 90_000 },
    );

    await Promise.all([
      waitHot,
      gotoSmoke(page, `/community?post=${encodeURIComponent(postId)}`, { timeout: 90_000 }),
    ]);

    await expect(feedShell).toBeVisible({ timeout: 90_000 });
    await expectCommunityFeedPostDeepLinkSettled(page, feedShell);

    const postDrawer = communityPostDetailDrawerShell(page);
    await expect
      .poll(async () => (await postDrawer.innerText()).includes(commentBody), { timeout: 90_000 })
      .toBe(true);

    await expect(postDrawer.getByRole("tablist", { name: /Sort comments|评论排序/i })).toHaveCount(0);
    await expect(postDrawer.getByRole("tab", { name: /时间正序|最新优先|互动最热|Latest|Hot|Timeline/i })).toHaveCount(
      0,
    );
  });
});
