/**
 * ME-P0 L5 parity 收尾（Phase ①）：PostDetailDrawer 内联、Collects partialHint、Reports AuthGate/VM。
 *
 * PostDetailDrawer / partialHint 用 API fixture 预置 tourist 数据（不依赖 seed 存量）；串行块内仅 partialHint seed 一次发帖，drawer 用例复用同一 `postId` 以避免 `post_too_fast`。
 *
 * 运行：`cd frontend && npx playwright test e2e/community-me-l5-a-parity-closeout.spec.ts --project=chromium`
 */
import { test, expect, type Page } from "@playwright/test";

import {
  defaultApiBase,
  ensureCommunityBrowserSessionAccepted,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import {
  ensureSerialCollectedPost,
  indexInMeCollectsHydratedGrid,
  indexInMePostsList,
  seedTouristCollectedPost,
  setSerialCollectedPostId,
} from "./helpers/communityMeL5ParityFixture";
import { resolveSeedUserId } from "./helpers/communitySocialFlow";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import {
  communityMeCollectsPageShell,
  communityMeNotesDrawerShell,
  communityMePageShell,
  communityMePostsPageShell,
  communityMeReportsPageShell,
  communityMeSurfaceShell,
  communityPostDetailDrawerShell,
} from "./helpers/pageShells";

const API_BASE = defaultApiBase();
const viewFullPostRe = /View full|查看全文/i;
const partialCollectHintRe = /could not be loaded|未能加载详情/i;
const RE_ME_COLLECTS = /\/api\/v1\/community\/me\/collects(\?|$)/;

async function expectLoggedInCollectsPage(page: Page) {
  await expect
    .poll(async () => communityMeCollectsPageShell(page).isVisible(), { timeout: 90_000 })
    .toBe(true);
}

async function expectLoggedInPostsPage(page: Page) {
  await expect
    .poll(async () => communityMePostsPageShell(page).isVisible(), { timeout: 90_000 })
    .toBe(true);
}

async function openPostDetailDrawerAtIndex(page: Page, surfaceSelector: string, index: number) {
  const surface = page.locator(surfaceSelector);
  const openPost = surface.getByRole("button", { name: viewFullPostRe }).nth(index);
  await expect
    .poll(async () => surface.getByRole("button", { name: viewFullPostRe }).count(), { timeout: 90_000 })
    .toBeGreaterThan(index);
  await expect(openPost).toBeVisible({ timeout: 30_000 });
  await openPost.click();
  await expect(communityPostDetailDrawerShell(page)).toBeVisible({ timeout: 15_000 });
}

test.describe.serial("community me L5 parity closeout (①)", () => {
  test.beforeEach(async ({ request }) => {
    await skipIfApiDown(request);
    await seedTestAccountsAndReleaseGuideSlot(request, API_BASE);
  });

  test("collects dedicated page shows partialHint when hydrate partially fails", async ({ page, request }) => {
    test.setTimeout(180_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    test.skip(!tourist, "tourist seed user required");

    const { postId } = await seedTouristCollectedPost(request, API_BASE, tourist, "partial-hint");
    setSerialCollectedPostId(postId);

    const missingIds = [
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000002",
    ];
    const allCollectIds = [postId, ...missingIds];

    await page.context().route(RE_ME_COLLECTS, async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "ok",
          collects: allCollectIds.map((post_id) => ({ post_id })),
        }),
      });
    });

    await gotoWithBearerSession(page, "/community/me/collects", tourist);
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);
    await expectLoggedInCollectsPage(page);

    await expect(page.getByRole("status").filter({ hasText: partialCollectHintRe })).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByRole("button", { name: /帖子卡片菜单|Post card menu/i })).toHaveCount(1, {
      timeout: 30_000,
    });
  });

  test("collects dedicated page opens PostDetailDrawer inline without /community/post navigation", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    test.skip(!tourist, "tourist seed user required");

    const { postId } = await ensureSerialCollectedPost(request, API_BASE, tourist, "drawer-collects");
    const gridIndex = await indexInMeCollectsHydratedGrid(request, API_BASE, tourist, postId);

    await gotoWithBearerSession(page, "/community/me/collects", tourist);
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);
    await expectLoggedInCollectsPage(page);

    await openPostDetailDrawerAtIndex(page, '[data-tt-community-me-collects-page="1"]', gridIndex);
    await expect(page).toHaveURL(/\/community\/me\/collects/, { timeout: 10_000 });
    expect(page.url()).not.toMatch(/\/community\/post\//);
  });

  test("posts dedicated page opens PostDetailDrawer inline without /community/post navigation", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    test.skip(!tourist, "tourist seed user required");

    const { postId } = await ensureSerialCollectedPost(request, API_BASE, tourist, "drawer-posts");
    const gridIndex = await indexInMePostsList(request, API_BASE, tourist, postId);

    await gotoWithBearerSession(page, "/community/me/posts", tourist);
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);
    await expectLoggedInPostsPage(page);

    await openPostDetailDrawerAtIndex(page, '[data-tt-community-me-posts-page="1"]', gridIndex);
    await expect(page).toHaveURL(/\/community\/me\/posts/, { timeout: 10_000 });
    expect(page.url()).not.toMatch(/\/community\/post\//);
  });

  test("logged-in reports page renders VM shell", async ({ page, request }) => {
    test.setTimeout(180_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    test.skip(!tourist, "tourist seed user required");

    await gotoWithBearerSession(page, "/community/me", tourist);
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);
    await expect
      .poll(async () => communityMePageShell(page).isVisible(), { timeout: 90_000 })
      .toBe(true);

    await gotoWithBearerSession(page, "/community/me/reports", tourist);
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);
    await expect
      .poll(async () => communityMeReportsPageShell(page).isVisible(), { timeout: 90_000 })
      .toBe(true);

    await expect(page.getByRole("heading", { level: 1, name: /我的举报|My reports/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.locator('[data-tt-community-me-surface="community_me_reports_auth_gate"]'),
    ).toHaveCount(0);
  });
});

test.describe("community me L5 parity closeout · guest hub drawer (①)", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("guest collects hub drawer shows auth gate and stays on hub URL", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/community/me");
    await expect(communityMePageShell(page)).toBeVisible({ timeout: 90_000 });
    await page.getByRole("button", { name: /收藏|Collections/i }).click();
    const drawer = communityMeNotesDrawerShell(page);
    await expect(drawer).toBeVisible({ timeout: 90_000 });
    await expect(communityMeSurfaceShell(drawer, "community_me_collects_auth_gate")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page).toHaveURL(/\/community\/me/, { timeout: 10_000 });
    expect(page.url()).not.toMatch(/\/community\/post\//);
  });

  test("guest reports page shows AuthGate invalid surface", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/community/me/reports");
    await expect(
      page.locator(
        '[data-tt-community-me-surface="community_me_reports_auth_gate"][data-tt-data-state="invalid"]',
      ),
    ).toBeVisible({ timeout: 90_000 });
    await expect(communityMeReportsPageShell(page)).toHaveCount(0);
  });
});
