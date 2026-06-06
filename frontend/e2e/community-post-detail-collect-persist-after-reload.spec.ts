/**
 * ① **TT-NEXT-BATCH A3 / TT-31 B4**：帖子详情 **收藏** 后 **整页 reload**，**`collected_by_me`** 与 UI 书签 SVG **fill** 一致
 *（与 **`POST|DELETE …/posts/:id/collect`**、**`displayCollectCountFromServerAndUi`** 同源；**不**冒充全站跨 Tab 矩阵）。
 *
 * 依赖：**`traveltrust-api`** + Postgres + **`SEED_TEST_ACCOUNTS`**（与 **`community-post-detail-like-persist-after-reload`** 同源）。
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

test.describe("community post detail · collect persists after full reload", () => {
  test("detail drawer: POST collect then reload keeps filled bookmark (collected_by_me)", async ({
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
    const postBody = `e2e-collect-persist-${stamp}`;
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
    const j0 = (await det0.json()) as { post?: { collected_by_me?: boolean } };
    expect(j0.post, "GET detail before collect must return post").toBeTruthy();
    expect(typeof j0.post!.collected_by_me, "Bearer GET detail must include collected_by_me before collect").toBe(
      "boolean",
    );
    expect(j0.post!.collected_by_me).toBe(false);

    await gotoWithBearerSession(page, "/community", { token, userId });
    const feedShell = communityFeedPageShell(page);
    await expect(feedShell).toBeVisible({ timeout: 90_000 });

    const deepUrl = `/community?post=${encodeURIComponent(postId)}`;
    await gotoSmoke(page, deepUrl, { timeout: 90_000 });
    await expect(feedShell).toBeVisible({ timeout: 90_000 });
    await expectCommunityFeedPostDeepLinkSettled(page, feedShell);

    const postDrawer = communityPostDetailDrawerShell(page);

    const collectBtn = postDrawer.getByRole("button", { name: /^Collect$|^收藏$/ });
    await expect(collectBtn).toBeVisible({ timeout: 30_000 });
    const collectSvg0 = collectBtn.locator("svg").first();
    await expect(collectSvg0).toHaveAttribute("fill", "none");

    const collectWait = page.waitForResponse(
      async (res) => {
        if (res.request().method() !== "POST") return false;
        if (!res.url().includes(`/api/v1/community/posts/${postId}/collect`)) return false;
        if (!res.ok()) return false;
        try {
          const body = (await res.json()) as { status?: string };
          return body.status === "ok";
        } catch {
          return false;
        }
      },
      { timeout: 90_000 },
    );
    await Promise.all([collectWait, collectBtn.click()]);

    /** 写后读回：**`request` + `API_BASE` + 同用例 `token`**（与 **`like-persist`** / **`det0`** 同路径）。 */
    const detAfter = await requestGetExpectOkWith429Backoff(request, `${API_BASE}/api/v1/community/posts/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const j1 = (await detAfter.json()) as { post?: { collected_by_me?: boolean; id?: string } };
    expect(j1.post, "GET detail after UI collect must return post object").toBeTruthy();
    expect(typeof j1.post!.collected_by_me, "Bearer GET detail must include collected_by_me (session gate)").toBe(
      "boolean",
    );
    expect(j1.post!.collected_by_me).toBe(true);

    /** `useCommunityFeedPostDeepLink` 会 **`replaceState` 剥 `?post=`**；reload 后须 **`gotoSmoke(deepUrl)`** 再开帖。 */
    await reloadSmoke(page, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expect(feedShell).toBeVisible({ timeout: 90_000 });
    await gotoSmoke(page, deepUrl, { timeout: 90_000 });
    await expect(feedShell).toBeVisible({ timeout: 90_000 });
    await expectCommunityFeedPostDeepLinkSettled(page, feedShell);

    const postDrawer2 = communityPostDetailDrawerShell(page);
    const collectBtn2 = postDrawer2.getByRole("button", { name: /^Collect$|^收藏$/ });
    await expect(collectBtn2.locator("svg").first()).toHaveAttribute("fill", "currentColor");
  });
});
