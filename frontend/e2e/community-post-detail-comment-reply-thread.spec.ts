/**
 * ① **TT-NEXT-BATCH A2 / TT-31 B3**：帖子详情 **二级评论**（`parent_id`）在抽屉线程中可读
 *（与 **`POST …/community/posts/:id/comments`** **`body` + `parent_id`**、**`PostDetailDrawerCommentsSection` · `getReplies`** 同源）。
 *
 * 依赖：**`traveltrust-api`** + Postgres + **`SEED_TEST_ACCOUNTS`**（与 **`community-post-detail-comment-sort`** 同源）。
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

test.describe("community post detail · comment reply thread (parent_id)", () => {
  test("detail drawer shows root + direct reply bodies from API thread", async ({ page, request }) => {
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
    await page.waitForTimeout(8_000);

    const stamp = Date.now();
    const postBody = `e2e-reply-thread-post-${stamp}`;
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
        data: { post_type: "text", body: postBody },
      },
    );
    const created = (await createRes.json()) as { id?: string; status?: string };
    expect(created.status).toBe("ok");
    const postId = (created.id ?? "").trim();
    expect(postId.length).toBeGreaterThan(10);

    await page.waitForTimeout(12_000);

    const rootText = `e2e-root-${stamp}`;
    const rootRes = await requestPostExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/community/posts/${postId}/comments`,
      {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        data: { body: rootText },
      },
    );
    const rootJson = (await rootRes.json()) as { status?: string; id?: string | null };
    expect(rootJson.status).toBe("ok");
    const rootId = (rootJson.id ?? "").trim();
    expect(rootId.length).toBeGreaterThan(10);

    await page.waitForTimeout(12_000);

    const replyText = `e2e-reply-${stamp}`;
    const replyRes = await requestPostExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/community/posts/${postId}/comments`,
      {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        data: { body: replyText, parent_id: rootId },
      },
    );
    const replyJson = (await replyRes.json()) as { status?: string };
    expect(replyJson.status).toBe("ok");

    await gotoWithBearerSession(page, "/community", { token, userId });
    const feedShell = communityFeedPageShell(page);
    await expect(feedShell).toBeVisible({ timeout: 90_000 });

    await gotoSmoke(page, `/community?post=${encodeURIComponent(postId)}`, { timeout: 90_000 });
    await expect(feedShell).toBeVisible({ timeout: 90_000 });
    await expectCommunityFeedPostDeepLinkSettled(page, feedShell);

    const postDrawer = communityPostDetailDrawerShell(page);
    await expect
      .poll(async () => {
        const txt = await postDrawer.innerText();
        return txt.includes(rootText) && txt.includes(replyText);
      }, { timeout: 90_000 })
      .toBe(true);
  });
});
