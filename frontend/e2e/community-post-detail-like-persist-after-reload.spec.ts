/**
 * ① **TT-NEXT-BATCH A3 / TT-31 B4**：帖子详情 **点赞** 后 **整页 reload**，**`liked_by_me`** 与 UI 心形态一致
 *（与 **`POST|DELETE …/posts/:id/like`**、**`displayLikeCountFromServerAndUi`** 同源；**不**冒充全站跨 Tab 矩阵）。
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
} from "./helpers/playwright429Backoff";
import { communityFeedPageShell, communityPostDetailDrawerShell } from "./helpers/pageShells";
import { expectCommunityFeedPostDeepLinkSettled } from "./helpers/communityFeedPostDeepLink";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { gotoSmoke, reloadSmoke } from "./helpers/smoke-nav";

const API_BASE = defaultApiBase();

test.describe("community post detail · like persists after full reload", () => {
  test("detail drawer: POST like then reload keeps filled heart (liked_by_me)", async ({ page, request }) => {
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
    const postBody = `e2e-like-persist-${stamp}`;
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

    const det0 = await requestGetExpectOkWith429Backoff(request, `${API_BASE}/api/v1/community/posts/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const j0 = (await det0.json()) as { post?: { liked_by_me?: boolean } };
    expect(j0.post, "GET detail before like must return post").toBeTruthy();
    expect(typeof j0.post!.liked_by_me, "Bearer GET detail must include liked_by_me before like").toBe("boolean");
    expect(j0.post!.liked_by_me).toBe(false);

    await gotoWithBearerSession(page, "/community", { token, userId });
    const feedShell = communityFeedPageShell(page);
    await expect(feedShell).toBeVisible({ timeout: 90_000 });

    const deepUrl = `/community?post=${encodeURIComponent(postId)}`;
    await gotoSmoke(page, deepUrl, { timeout: 90_000 });
    await expect(feedShell).toBeVisible({ timeout: 90_000 });
    await expectCommunityFeedPostDeepLinkSettled(page, feedShell);

    const postDrawer = communityPostDetailDrawerShell(page);

    const likeBtn = postDrawer.getByRole("button", { name: /^Like$|^点赞$/ });
    await expect(likeBtn).toBeVisible({ timeout: 30_000 });
    const svg0 = likeBtn.locator("svg").first();
    await expect(svg0).toHaveAttribute("fill", "none");

    /** `POST …/like` 在 handler 层 **`status:"error"`** 时仍可能 **HTTP 200**（与 **`likes.rs`** 同源）；**勿**仅用 **`res.ok()`**。 */
    let likeResponseBody: { status?: string; created?: boolean } | null = null;
    let likeRequestAuth: string | undefined;
    const likeWait = page.waitForResponse(
      async (res) => {
        if (res.request().method() !== "POST") return false;
        if (!res.url().includes(`/api/v1/community/posts/${postId}/like`)) return false;
        if (!res.ok()) return false;
        try {
          const body = (await res.json()) as { status?: string; created?: boolean };
          if (body.status === "ok") {
            likeResponseBody = body;
            likeRequestAuth = res.request().headers()["authorization"];
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
      { timeout: 90_000 },
    );
    await Promise.all([likeWait, likeBtn.click()]);
    expect(likeResponseBody?.status).toBe("ok");
    expect(
      likeResponseBody?.created,
      "first UI like for fresh post must insert a row (created=true); if false, UI auth user may differ from apiLogin token",
    ).toBe(true);
    expect(
      (likeRequestAuth ?? "").toLowerCase().startsWith("bearer "),
      "UI like POST must send Bearer (DB session gate); empty means X-User-Id-only path",
    ).toBe(true);
    expect(likeRequestAuth?.trim(), "UI like must use the same opaque session as apiLogin/gotoWithBearerSession").toBe(
      `Bearer ${token.trim()}`,
    );

    const detAfter = await requestGetExpectOkWith429Backoff(request, `${API_BASE}/api/v1/community/posts/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const j1 = (await detAfter.json()) as { post?: { liked_by_me?: boolean; id?: string } };
    expect(j1.post, "GET detail after UI like must return post object").toBeTruthy();
    expect(typeof j1.post!.liked_by_me, "Bearer GET detail must include liked_by_me (session gate)").toBe(
      "boolean",
    );
    expect(j1.post!.liked_by_me).toBe(true);

    /** `useCommunityFeedPostDeepLink` 剥 **`?post=`**；reload 后 **`gotoSmoke(deepUrl)`** 复开帖。 */
    await reloadSmoke(page, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expect(feedShell).toBeVisible({ timeout: 90_000 });
    await gotoSmoke(page, deepUrl, { timeout: 90_000 });
    await expect(feedShell).toBeVisible({ timeout: 90_000 });
    await expectCommunityFeedPostDeepLinkSettled(page, feedShell);

    const postDrawer2 = communityPostDetailDrawerShell(page);
    const likeBtn2 = postDrawer2.getByRole("button", { name: /^Like$|^点赞$/ });
    await expect(likeBtn2.locator("svg").first()).toHaveAttribute("fill", "currentColor");
  });
});
