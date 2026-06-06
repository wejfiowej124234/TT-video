/**
 * 社区个人中心列表 load-more（Phase ① · 路由 mock · 不依赖 seed 数据量）
 *
 * 运行：`cd frontend && npx playwright test e2e/community-me-l5-b-load-more-mocked.spec.ts --project=chromium`
 */
import { test, expect } from "@playwright/test";

import {
  defaultApiBase,
  ensureCommunityBrowserSessionAccepted,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import { resolveSeedUserId } from "./helpers/communitySocialFlow";
import { likesListEnabledForPlaywright } from "./helpers/communityMeLegacyRedirects";
import {
  installCommunityMeCollectsLoadMoreMocks,
  installCommunityMeLikesLoadMoreMocks,
  installCommunityMePostsLoadMoreMocks,
} from "./helpers/communityMeLoadMoreMocks";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import {
  communityMeCollectsPageShell,
  communityMeLikesPageShell,
  communityMeLoadMorePageButton,
  communityMePostsPageShell,
} from "./helpers/pageShells";

const API_BASE = defaultApiBase();

test.describe.serial("community me load-more mocked (①)", () => {
  test.beforeEach(async ({ context }) => {
    await context.unrouteAll({ behavior: "ignoreErrors" });
  });

  test.beforeEach(async ({ request }) => {
    await skipIfApiDown(request);
    await seedTestAccountsAndReleaseGuideSlot(request, API_BASE);
  });

  test("posts dedicated page load-more appends mocked grid", async ({ page, request }) => {
    test.setTimeout(180_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    test.skip(!tourist, "tourist seed user required");

    await installCommunityMePostsLoadMoreMocks(page, tourist.userId);
    await gotoWithBearerSession(page, "/community/me/posts", tourist);
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);
    await expect(communityMePostsPageShell(page)).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('[data-tt-community-me-posts-page="1"] .grid.grid-cols-3 > *')).toHaveCount(30, {
      timeout: 60_000,
    });

    const loadMore = communityMeLoadMorePageButton(page);
    await expect
      .poll(async () => loadMore.isVisible(), { timeout: 60_000 })
      .toBe(true);

    const before = await page.getByRole("button", { name: /帖子卡片菜单|Post card menu/i }).count();
    expect(before).toBe(30);

    await loadMore.click();
    await expect
      .poll(async () => page.getByRole("button", { name: /帖子卡片菜单|Post card menu/i }).count(), {
        timeout: 60_000,
      })
      .toBe(40);
  });

  test("collects dedicated page load-more appends mocked hydrate batch", async ({ page, request }) => {
    test.setTimeout(120_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    test.skip(!tourist, "tourist seed user required");

    await installCommunityMeCollectsLoadMoreMocks(page);
    await gotoWithBearerSession(page, "/community/me/collects", tourist);
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);
    await expect(communityMeCollectsPageShell(page)).toBeVisible({ timeout: 90_000 });

    await expect
      .poll(async () => page.getByRole("button", { name: /帖子卡片菜单|Post card menu/i }).count(), {
        timeout: 60_000,
      })
      .toBe(24);

    const loadMore = communityMeLoadMorePageButton(page);
    await expect(loadMore).toBeVisible({ timeout: 30_000 });

    await loadMore.click();
    await expect
      .poll(async () => page.getByRole("button", { name: /帖子卡片菜单|Post card menu/i }).count(), {
        timeout: 60_000,
      })
      .toBe(35);
  });

  test("likes dedicated page load-more appends mocked hydrate batch", async ({ page, request }) => {
    test.skip(!likesListEnabledForPlaywright(), "likes list disabled by NEXT_PUBLIC_COMMUNITY_ME_LIKES_LIST");
    test.setTimeout(120_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    test.skip(!tourist, "tourist seed user required");

    await installCommunityMeLikesLoadMoreMocks(page);
    await gotoWithBearerSession(page, "/community/me/likes", tourist);
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);
    await expect(communityMeLikesPageShell(page)).toBeVisible({ timeout: 90_000 });

    await expect
      .poll(async () => page.getByRole("button", { name: /帖子卡片菜单|Post card menu/i }).count(), {
        timeout: 60_000,
      })
      .toBe(24);

    const loadMore = communityMeLoadMorePageButton(page);
    await expect(loadMore).toBeVisible({ timeout: 30_000 });

    await loadMore.click();
    await expect
      .poll(async () => page.getByRole("button", { name: /帖子卡片菜单|Post card menu/i }).count(), {
        timeout: 60_000,
      })
      .toBe(35);
  });
});
