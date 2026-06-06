/**
 * G-03 · 社区弹窗/抽屉交互 E2E（Phase ① · 无 UI 结构变更）
 *
 * 运行：`cd frontend && npm run e2e:community-modals-interaction`
 */
import { test, expect } from "@playwright/test";

import {
  ensureCommunityBrowserSessionAccepted,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import {
  communityFeedPageShell,
  communityLoginForPublishShell,
  communityMePageShell,
  communityMeQuickLinksDrawerShell,
  communityReportDrawerShell,
} from "./helpers/pageShells";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { waitCommunityFeedGet200 } from "./helpers/p0RealApiWaits";
import { resolveSeedUserId } from "./helpers/communitySocialFlow";
import { API_BASE } from "./market-subsite-shared";

test.describe("G-03 · community modals interaction (①)", () => {
  test.describe.configure({ mode: "serial", retries: 1 });

  test.beforeEach(async ({ request }) => {
    await skipIfApiDown(request);
    await seedTestAccountsAndReleaseGuideSlot(request, API_BASE);
  });

  test("COM-G03-01 · anonymous publish opens login modal · Esc closes", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/community");
    await expect(communityFeedPageShell(page)).toBeVisible({ timeout: 45_000 });

    const publishEntry = page
      .locator('[data-testid="community-feed-publish-entry"], [data-testid="community-feed-publish-fab"]')
      .first();
    await expect(publishEntry).toBeVisible({ timeout: 45_000 });
    await publishEntry.click();

    await expect(communityLoginForPublishShell(page)).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press("Escape");
    await expect(communityLoginForPublishShell(page)).toHaveCount(0, { timeout: 10_000 });
  });

  test("COM-G03-02 · /community/me quick-links drawer opens · overlay closes", async ({ page, request }) => {
    test.setTimeout(120_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    expect(tourist).toBeTruthy();
    if (!tourist) return;

    await gotoWithBearerSession(page, "/community/me", tourist);
    await expect(communityMePageShell(page)).toBeVisible({ timeout: 30_000 });
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);
    await expect(page.locator('[data-tt-community-me-surface="community_me_profile"]')).toBeVisible({
      timeout: 45_000,
    });

    const fab = page.getByTitle(/Open or close quick links|展开或收起快捷入口/i);
    await expect(fab).toBeVisible({ timeout: 30_000 });
    await fab.click();
    await expect(communityMeQuickLinksDrawerShell(page)).toBeVisible({ timeout: 15_000 });

    await page.keyboard.press("Escape");
    await expect(communityMeQuickLinksDrawerShell(page)).toHaveCount(0, { timeout: 10_000 });
  });

  test("COM-G03-03 · feed share menu report opens ReportDrawer · Esc closes", async ({ page, request }) => {
    test.setTimeout(120_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    expect(tourist).toBeTruthy();
    if (!tourist) return;

    const feedWait = waitCommunityFeedGet200(page, 90_000);
    await gotoWithBearerSession(page, "/community", tourist);
    await expect(communityFeedPageShell(page)).toBeVisible({ timeout: 30_000 });
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);
    await feedWait;

    const shareBtn = page.getByRole("button", { name: /^Share$|^分享$/ }).first();
    await expect(shareBtn).toBeVisible({ timeout: 45_000 });
    await shareBtn.click();

    const reportItem = page.getByRole("menuitem", { name: /^Report$|^举报$/ });
    await expect(reportItem).toBeVisible({ timeout: 15_000 });
    await reportItem.click();

    await expect(communityReportDrawerShell(page)).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press("Escape");
    await expect(communityReportDrawerShell(page)).toHaveCount(0, { timeout: 10_000 });
  });
});
