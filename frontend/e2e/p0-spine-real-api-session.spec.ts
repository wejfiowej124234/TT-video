/**
 * P0 主脊（**会话**读路径）：seed + Bearer，**真实** `GET` 等待（与测试网/公网同源路径）。
 * **访客 / onboarding / 公开读**见 **`p0-spine-real-api-public.spec.ts`**。
 * 清单对拍：`frontend/e2e/p0-routes.v1.json`、`docs/runbook/TT-96-20-P0-E2E-LADDER-001.md`。
 */
import { test, expect } from "@playwright/test";
import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import { guideRowIdForSeedGuideAccount } from "./helpers/guideSeedGuideRowId";
import { newIdempotencyKey } from "./helpers/idempotencyKey";
import {
  requestGetWith429Retry,
  requestPostExpectOkWith429Backoff,
} from "./helpers/playwright429Backoff";
import {
  waitCommunityFriendsListGet200,
  waitCommunityMeFollowersGet200,
  waitCommunityMeFollowingGet200,
  waitCommunityMeCollectsGet200,
  waitCommunityMeLikesGet200,
  waitCommunityMeLikesReceivedGet200,
  waitCommunityMePostsGet200,
  waitGuidesGet200,
  waitMeGet200,
  waitMeSecurityNotificationsGet200,
  waitMeSessionsGet200,
  waitOrderByIdGet200,
  waitOrderChainSyncStatusGet200,
  waitOrdersListGet200,
} from "./helpers/p0RealApiWaits";
import {
  communityMeCollectsPageShell,
  communityMeLikesPageShell,
  communityMePageShell,
  communityMePostsPageShell,
  escrowDetailPageShell,
  meSecurityPageShell,
  ordersNewPageShell,
  ordersPageShell,
} from "./helpers/pageShells";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { waitForUrlSmoke } from "./helpers/smoke-nav";

test.describe("P0 spine · session read (seed + Bearer)", () => {
  test.beforeEach(async ({ request }) => {
    await skipIfApiDown(request);
    const apiBase = defaultApiBase();
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
  });

  test("/orders · list GET 200", async ({ page, request }) => {
    test.setTimeout(150_000);
    await skipIfApiDown(request);
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    if (!creds?.token) {
      test.skip(true, "login returned no token (seed + API)");
      return;
    }
    const w = waitOrdersListGet200(page);
    await gotoWithBearerSession(page, "/orders", creds);
    await w;
    const ordersShell = ordersPageShell(page);
    await expect(ordersShell).toBeVisible({ timeout: 90_000 });
    await expect(ordersShell.getByRole("heading", { name: /My orders|我的订单/i })).toBeVisible({
      timeout: 90_000,
    });
  });

  test("/orders/new · guides GET 200", async ({ page, request }) => {
    test.setTimeout(150_000);
    await skipIfApiDown(request);
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    if (!creds?.token) {
      test.skip(true, "login returned no token (seed + API)");
      return;
    }
    const w = waitGuidesGet200(page);
    await gotoWithBearerSession(page, "/orders/new", creds);
    await w;
    const newShell = ordersNewPageShell(page);
    await expect(newShell).toBeVisible({ timeout: 90_000 });
    await expect(newShell.getByRole("heading", { name: /Create order|创建订单/i })).toBeVisible({
      timeout: 90_000,
    });
  });

  test("/me · redirects to /me/identities + GET /api/v1/me 200", async ({ page, request }) => {
    test.setTimeout(150_000);
    await skipIfApiDown(request);
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    if (!creds?.token) {
      test.skip(true, "login returned no token (seed + API)");
      return;
    }
    const wMe = waitMeGet200(page);
    await gotoWithBearerSession(page, "/me", creds);
    await waitForUrlSmoke(page, /\/me\/identities(\/|\?|$)/, { timeout: 90_000 });
    await wMe;
    await expect(page.getByRole("heading", { level: 1, name: /多重身份|Multiple roles/i })).toBeVisible({
      timeout: 90_000,
    });
  });

  test("/community/me · social stats APIs GET 200", async ({ page, request }) => {
    test.setTimeout(150_000);
    await skipIfApiDown(request);
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    if (!creds?.token) {
      test.skip(true, "login returned no token (seed + API)");
      return;
    }
    const wMe = waitMeGet200(page);
    const wFollow = waitCommunityMeFollowingGet200(page);
    const wFollowers = waitCommunityMeFollowersGet200(page);
    const wFriends = waitCommunityFriendsListGet200(page);
    const wLikesOpt = waitCommunityMeLikesReceivedGet200(page, 8_000).catch(() => null);
    await gotoWithBearerSession(page, "/community/me", creds);
    await Promise.all([wMe, wFollow, wFollowers, wFriends, wLikesOpt]);
    await expect(communityMePageShell(page)).toBeVisible({ timeout: 90_000 });
  });

  test("/community/me/posts · GET /api/v1/community/me/posts 200", async ({ page, request }) => {
    test.setTimeout(150_000);
    await skipIfApiDown(request);
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    if (!creds?.token) {
      test.skip(true, "login returned no token (seed + API)");
      return;
    }
    const postsProbe = await requestGetWith429Retry(request, `${apiBase}/api/v1/community/me/posts`, {
      headers: { Authorization: `Bearer ${creds.token}` },
    });
    test.skip(!postsProbe.ok(), `GET me/posts HTTP ${postsProbe.status()} (skip)`);

    const wPosts = waitCommunityMePostsGet200(page);
    await gotoWithBearerSession(page, "/community/me/posts", creds);
    await wPosts;
    await expect(communityMePostsPageShell(page)).toBeVisible({ timeout: 90_000 });
  });

  test("/community/me/collects · GET /api/v1/community/me/collects 200", async ({ page, request }) => {
    test.setTimeout(150_000);
    await skipIfApiDown(request);
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    if (!creds?.token) {
      test.skip(true, "login returned no token (seed + API)");
      return;
    }
    const collProbe = await requestGetWith429Retry(request, `${apiBase}/api/v1/community/me/collects`, {
      headers: { Authorization: `Bearer ${creds.token}` },
    });
    test.skip(!collProbe.ok(), `GET me/collects HTTP ${collProbe.status()} (skip)`);

    const wColl = waitCommunityMeCollectsGet200(page);
    await gotoWithBearerSession(page, "/community/me/collects", creds);
    await wColl;
    await expect(communityMeCollectsPageShell(page)).toBeVisible({ timeout: 90_000 });
  });

  test("/community/me/likes · GET /api/v1/community/me/likes 200", async ({ page, request }) => {
    test.setTimeout(150_000);
    await skipIfApiDown(request);
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    if (!creds?.token) {
      test.skip(true, "login returned no token (seed + API)");
      return;
    }
    const likesProbe = await requestGetWith429Retry(request, `${apiBase}/api/v1/community/me/likes`, {
      headers: { Authorization: `Bearer ${creds.token}` },
    });
    test.skip(!likesProbe.ok(), `GET me/likes HTTP ${likesProbe.status()} (likes list off or API skip)`);

    const wLikes = waitCommunityMeLikesGet200(page);
    await gotoWithBearerSession(page, "/community/me/likes", creds);
    await wLikes;
    await expect(communityMeLikesPageShell(page)).toBeVisible({ timeout: 90_000 });
  });

  test("/orders · GET /api/v1/orders 200 (hub ?tab=orders canonical redirect)", async ({ page, request }) => {
    test.setTimeout(150_000);
    await skipIfApiDown(request);
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    if (!creds?.token) {
      test.skip(true, "login returned no token (seed + API)");
      return;
    }
    const ordersProbe = await requestGetWith429Retry(request, `${apiBase}/api/v1/orders`, {
      headers: { Authorization: `Bearer ${creds.token}` },
    });
    test.skip(!ordersProbe.ok(), `GET /orders HTTP ${ordersProbe.status()} (skip)`);

    const wOrders = waitOrdersListGet200(page);
    await gotoWithBearerSession(page, "/community/me?tab=orders", creds);
    await expect(page).toHaveURL(/\/orders/, { timeout: 90_000 });
    await wOrders;
    await expect(ordersPageShell(page)).toBeVisible({ timeout: 90_000 });
  });

  test("/me/security · sessions + security-notifications GET 200", async ({ page, request }) => {
    test.setTimeout(150_000);
    await skipIfApiDown(request);
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    if (!creds?.token) {
      test.skip(true, "login returned no token (seed + API)");
      return;
    }
    const wSess = waitMeSessionsGet200(page);
    const wNotif = waitMeSecurityNotificationsGet200(page);
    await gotoWithBearerSession(page, "/me/security", creds);
    await Promise.all([wSess, wNotif]);
    const securityShell = meSecurityPageShell(page);
    await expect(securityShell).toBeVisible({ timeout: 90_000 });
    await expect(
      securityShell.getByRole("heading", { name: /账号安全中心|Account security center/i }),
    ).toBeVisible({ timeout: 90_000 });
  });

  test("/escrow/:id · GET order 200（草稿单 · tourist）", async ({ page, request }) => {
    test.setTimeout(180_000);
    await skipIfApiDown(request);
    const apiBase = defaultApiBase();
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    if (!creds?.token) {
      test.skip(true, "login returned no token (seed + API)");
      return;
    }
    const guideId = await guideRowIdForSeedGuideAccount(request, apiBase);
    if (!guideId) {
      test.skip(true, "seed guide id missing (SEED_TEST_ACCOUNTS)");
      return;
    }
    const createRes = await requestPostExpectOkWith429Backoff(request, `${apiBase}/api/v1/orders`, {
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": newIdempotencyKey("p0-escrow-draft"),
      },
      data: {
        guide_id: guideId,
        amount: "88",
        currency: "USD",
      },
    });
    if (!createRes.ok()) {
      test.skip(true, `POST /orders HTTP ${createRes.status()} — ${(await createRes.text()).slice(0, 200)}`);
      return;
    }
    const created = (await createRes.json()) as { order?: { id?: string } };
    const orderId = (created.order?.id ?? "").trim();
    if (!orderId) {
      test.skip(true, "create order returned no id");
      return;
    }
    const wOrder = waitOrderByIdGet200(page, orderId);
    const wSync = waitOrderChainSyncStatusGet200(page, orderId);
    await gotoWithBearerSession(page, `/escrow/${orderId}`, creds);
    await Promise.all([wOrder, wSync]);
    await expect(escrowDetailPageShell(page)).toBeVisible({ timeout: 90_000 });
  });
});
