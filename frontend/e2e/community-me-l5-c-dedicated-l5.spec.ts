/**
 * 社区个人中心独立页 L5：确认弹窗 · session pin 提示（Phase ①）
 *
 * 运行：`cd frontend && npx playwright test e2e/community-me-l5-c-dedicated-l5.spec.ts --project=chromium`
 */
import { test, expect } from "@playwright/test";

import {
  defaultApiBase,
  ensureCommunityBrowserSessionAccepted,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import { resolveSeedUserId } from "./helpers/communitySocialFlow";
import {
  expectCommunityMeCollectsPageShellReady,
  expectCommunityMeLikesPageShellReady,
  expectCommunityMePostsPageShellReady,
  expectCommunityMeReportsPageShellReady,
} from "./helpers/communityMePageReady";
import { communityMePostCardDeleteMenuitem, openCommunityMePostCardMenu } from "./helpers/communityMeCardMenu";
import { likesListEnabledForPlaywright } from "./helpers/communityMeLegacyRedirects";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import {
  communityDeletePostConfirmShell,
  communityMeCollectsPageShell,
  communityMeLikesPageShell,
  communityMeLoadMorePageButton,
  communityMePageSessionPinNoteShell,
  communityUncollectConfirmShell,
  communityUnlikeConfirmShell,
  communityUserPageShell,
} from "./helpers/pageShells";

const API_BASE = defaultApiBase();

test.describe.serial("community me dedicated pages L5 (①)", () => {
  test.beforeEach(async ({ request }) => {
    await skipIfApiDown(request);
    await seedTestAccountsAndReleaseGuideSlot(request, API_BASE);
  });

  test("reports dedicated page shows L5 shell when logged in", async ({ page, request }) => {
    test.setTimeout(90_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    test.skip(!tourist, "tourist seed user required");

    await gotoWithBearerSession(page, "/community/me/reports", tourist);
    await expectCommunityMeReportsPageShellReady(page, tourist);
    await expect(page.getByRole("heading", { level: 1, name: /我的举报|My reports/i }).first()).toBeVisible({
      timeout: 25_000,
    });
  });

  test("posts page delete opens L5 confirm · Esc cancels", async ({ page, request }) => {
    test.setTimeout(120_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    test.skip(!tourist, "tourist seed user required");

    await gotoWithBearerSession(page, "/community/me/posts", tourist);
    await expectCommunityMePostsPageShellReady(page, tourist);

    const menuCount = await page.getByRole("button", { name: /帖子卡片菜单|Post card menu/i }).count();
    test.skip(menuCount === 0, "tourist has no posts on dedicated page");

    await openCommunityMePostCardMenu(page);
    const deleteItem = communityMePostCardDeleteMenuitem(page);
    await expect(deleteItem).toBeVisible({ timeout: 15_000 });
    test.skip(await deleteItem.isDisabled(), "delete disabled in demo environment");
    await deleteItem.click();

    await expect(communityDeletePostConfirmShell(page)).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("Escape");
    await expect(communityDeletePostConfirmShell(page)).toHaveCount(0, { timeout: 10_000 });
  });

  test("collects page uncollect opens L5 confirm · Esc cancels", async ({ page, request }) => {
    test.setTimeout(120_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    test.skip(!tourist, "tourist seed user required");

    await gotoWithBearerSession(page, "/community/me/collects", tourist);
    await expectCommunityMeCollectsPageShellReady(page, tourist);

    const menuBtn = page.getByRole("button", { name: /帖子卡片菜单|Post card menu/i }).first();
    const menuCount = await menuBtn.count();
    test.skip(menuCount === 0, "tourist has no collects on dedicated page");

    await menuBtn.click({ force: true });
    const uncollectItem = page.getByRole("menuitem", { name: /取消收藏|Remove from saved/i });
    await expect(uncollectItem).toBeVisible({ timeout: 10_000 });
    await uncollectItem.click();

    await expect(communityUncollectConfirmShell(page)).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("Escape");
    await expect(communityUncollectConfirmShell(page)).toHaveCount(0, { timeout: 10_000 });
  });

  test("collects page shows session pin note when 2+ items", async ({ page, request }) => {
    test.setTimeout(120_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    test.skip(!tourist, "tourist seed user required");

    await gotoWithBearerSession(page, "/community/me/collects", tourist);
    await expectCommunityMeCollectsPageShellReady(page, tourist);

    const menuButtons = page.getByRole("button", { name: /帖子卡片菜单|Post card menu/i });
    const count = await menuButtons.count();
    test.skip(count < 2, "need 2+ collects for session pin note");

    await expect(communityMePageSessionPinNoteShell(page)).toBeVisible({ timeout: 10_000 });
  });

  test("self user profile feed delete opens L5 confirm · Esc cancels", async ({ page, request }) => {
    test.setTimeout(120_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    test.skip(!tourist, "tourist session required");

    await gotoWithBearerSession(page, `/community/user/${tourist.userId}`, tourist);
    await expect(communityUserPageShell(page)).toBeVisible({ timeout: 90_000 });
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);

    const menuBtn = page.getByRole("button", { name: /帖子卡片菜单|Post card menu/i }).first();
    const menuCount = await menuBtn.count();
    test.skip(menuCount === 0, "tourist has no posts on profile feed");

    await openCommunityMePostCardMenu(page);
    const deleteItem = communityMePostCardDeleteMenuitem(page);
    await expect(deleteItem).toBeVisible({ timeout: 15_000 });
    test.skip(await deleteItem.isDisabled(), "delete disabled in demo environment");
    await deleteItem.click();

    await expect(communityDeletePostConfirmShell(page)).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("Escape");
    await expect(communityDeletePostConfirmShell(page)).toHaveCount(0, { timeout: 10_000 });
  });

  test("likes page unlike opens L5 confirm · Esc cancels", async ({ page, request }) => {
    test.skip(!likesListEnabledForPlaywright(), "likes list disabled by NEXT_PUBLIC_COMMUNITY_ME_LIKES_LIST");
    test.setTimeout(120_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    test.skip(!tourist, "tourist seed user required");

    await gotoWithBearerSession(page, "/community/me/likes", tourist);
    await expectCommunityMeLikesPageShellReady(page, tourist);

    const menuBtn = page.getByRole("button", { name: /帖子卡片菜单|Post card menu/i }).first();
    const menuCount = await menuBtn.count();
    test.skip(menuCount === 0, "tourist has no likes on dedicated page");

    await menuBtn.click({ force: true });
    const unlikeItem = page.getByRole("menuitem", { name: /取消赞|Remove like/i });
    await expect(unlikeItem).toBeVisible({ timeout: 10_000 });
    await unlikeItem.click();

    await expect(communityUnlikeConfirmShell(page)).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("Escape");
    await expect(communityUnlikeConfirmShell(page)).toHaveCount(0, { timeout: 10_000 });
  });

  test("posts page shows session pin note when 2+ items", async ({ page, request }) => {
    test.setTimeout(120_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    test.skip(!tourist, "tourist seed user required");

    await gotoWithBearerSession(page, "/community/me/posts", tourist);
    await expectCommunityMePostsPageShellReady(page, tourist);

    const menuButtons = page.getByRole("button", { name: /帖子卡片菜单|Post card menu/i });
    const count = await menuButtons.count();
    test.skip(count < 2, "need 2+ posts for session pin note");

    await expect(communityMePageSessionPinNoteShell(page)).toBeVisible({ timeout: 10_000 });
  });

  test("self user profile shows session pin note when 2+ feed items", async ({ page, request }) => {
    test.setTimeout(120_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    test.skip(!tourist, "tourist session required");

    await gotoWithBearerSession(page, `/community/user/${tourist.userId}`, tourist);
    await expect(communityUserPageShell(page)).toBeVisible({ timeout: 90_000 });
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);

    const menuButtons = page.getByRole("button", { name: /帖子卡片菜单|Post card menu/i });
    const count = await menuButtons.count();
    test.skip(count < 2, "need 2+ posts on profile feed for session pin note");

    await expect(communityMePageSessionPinNoteShell(page)).toBeVisible({ timeout: 10_000 });
  });

  test("posts page grid menu offers visibility change", async ({ page, request }) => {
    test.setTimeout(120_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    test.skip(!tourist, "tourist seed user required");

    await gotoWithBearerSession(page, "/community/me/posts", tourist);
    await expectCommunityMePostsPageShellReady(page, tourist);

    const menuCount = await page.getByRole("button", { name: /帖子卡片菜单|Post card menu/i }).count();
    test.skip(menuCount === 0, "tourist has no posts on dedicated page");

    await openCommunityMePostCardMenu(page);
    const visItem = page.getByRole("menuitem", { name: /仅自己可见|Only me|归档|Archived|公开|Public/i }).first();
    await expect(visItem).toBeVisible({ timeout: 10_000 });
    const visLabel = (await visItem.textContent())?.trim() ?? "";
    await visItem.click();

    await expect(page.getByRole("menu")).toHaveCount(0, { timeout: 10_000 });
    if (/仅自己|Only me|Private/i.test(visLabel)) {
      await expect(page.getByText(/仅自己|^Private$/i).first()).toBeVisible({ timeout: 15_000 });
    } else if (/归档|Archived/i.test(visLabel)) {
      await expect(page.getByText(/归档|archived/i).first()).toBeVisible({ timeout: 15_000 });
    }
  });

  test("posts page load more appends grid when cursor available", async ({ page, request }) => {
    test.setTimeout(120_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    test.skip(!tourist, "tourist seed user required");

    await gotoWithBearerSession(page, "/community/me/posts", tourist);
    await expectCommunityMePostsPageShellReady(page, tourist);

    const loadMore = communityMeLoadMorePageButton(page);
    test.skip((await loadMore.count()) === 0, "tourist posts fit in first page — no cursor");

    const before = await page.getByRole("button", { name: /帖子卡片菜单|Post card menu/i }).count();
    await loadMore.click();
    await expect
      .poll(async () => page.getByRole("button", { name: /帖子卡片菜单|Post card menu/i }).count(), {
        timeout: 60_000,
      })
      .toBeGreaterThan(before);
  });

  test("collects page load more appends grid when more ids to hydrate", async ({ page, request }) => {
    test.setTimeout(120_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    test.skip(!tourist, "tourist seed user required");

    await gotoWithBearerSession(page, "/community/me/collects", tourist);
    await expectCommunityMeCollectsPageShellReady(page, tourist);

    const loadMore = communityMeLoadMorePageButton(page);
    test.skip((await loadMore.count()) === 0, "tourist collects fit in first hydrate batch");

    const before = await page.getByRole("button", { name: /帖子卡片菜单|Post card menu/i }).count();
    await loadMore.click();
    await expect
      .poll(async () => page.getByRole("button", { name: /帖子卡片菜单|Post card menu/i }).count(), {
        timeout: 60_000,
      })
      .toBeGreaterThan(before);
  });

  test("likes page load more appends grid when more ids to hydrate", async ({ page, request }) => {
    test.skip(!likesListEnabledForPlaywright(), "likes list disabled by NEXT_PUBLIC_COMMUNITY_ME_LIKES_LIST");
    test.setTimeout(120_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    test.skip(!tourist, "tourist seed user required");

    await gotoWithBearerSession(page, "/community/me/likes", tourist);
    await expectCommunityMeLikesPageShellReady(page, tourist);

    const loadMore = communityMeLoadMorePageButton(page);
    test.skip((await loadMore.count()) === 0, "tourist likes fit in first hydrate batch");

    const before = await page.getByRole("button", { name: /帖子卡片菜单|Post card menu/i }).count();
    await loadMore.click();
    await expect
      .poll(async () => page.getByRole("button", { name: /帖子卡片菜单|Post card menu/i }).count(), {
        timeout: 60_000,
      })
      .toBeGreaterThan(before);
  });

  test("posts page visibility PATCH failure rolls back optimistic UI", async ({ page, request }) => {
    test.setTimeout(120_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    test.skip(!tourist, "tourist seed user required");

    await gotoWithBearerSession(page, "/community/me/posts", tourist);
    await expectCommunityMePostsPageShellReady(page, tourist);

    const menuCount = await page.getByRole("button", { name: /帖子卡片菜单|Post card menu/i }).count();
    test.skip(menuCount === 0, "tourist has no posts on dedicated page");

    const privateBadgesBefore = await page.getByText(/^仅自己$|^Private$/).count();

    await page.route("**/api/v1/community/posts/**", async (route) => {
      if (route.request().method() === "PATCH") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ status: "error", message: "visibility_patch_blocked_for_e2e" }),
        });
        return;
      }
      await route.continue();
    });

    await openCommunityMePostCardMenu(page);
    const visItem = page.getByRole("menuitem", { name: /仅自己可见|Only me|归档|Archived|公开|Public/i }).first();
    await expect(visItem).toBeVisible({ timeout: 10_000 });
    await visItem.click();

    await expect(page.getByText(/更新可见性失败|Could not update visibility/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect
      .poll(async () => page.getByText(/^仅自己$|^Private$/).count(), { timeout: 15_000 })
      .toBe(privateBadgesBefore);
  });
});
