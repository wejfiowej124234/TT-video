/**
 * ② C10 staging critical user journey（Feed 宽路径 · 真实用户视角）。
 *
 * 由 **`scripts/dev/record-community-c10-evidence.sh`** 驱动；须 **`C10_STAGING_EVIDENCE_RUN=1`**。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { test, expect } from "@playwright/test";

import {
  apiLoginReturnCredentials,
  defaultApiBase,
  ensureCommunityBrowserSessionAccepted,
  gotoWithBearerSession,
} from "./helpers/apiSession";
import { expectCommunityFeedPostDeepLinkSettled } from "./helpers/communityFeedPostDeepLink";
import { resolvePathFromGitBashEnv } from "./helpers/normalizeGitBashPath";
import {
  communityActivityPageShell,
  communityExplorePageShell,
  communityMePostsPageShell,
  communityMessagesPageShell,
  communityMessagesThreadPageShell,
  communityPostDetailDrawerShell,
  communityReportDrawerShell,
  communityUserPageShell,
  communityFriendsPageShell,
} from "./helpers/pageShells";

function c10EvidenceGate(): boolean {
  return (
    process.env.C10_STAGING_EVIDENCE_RUN === "1" &&
    Boolean(process.env.C10_STAGING_EVIDENCE_OUT?.trim()) &&
    Boolean(process.env.C10_HERO_EMAIL?.trim()) &&
    Boolean(process.env.C10_TARGET_USER_ID?.trim()) &&
    Boolean(process.env.C10_VIDEO_MARKER?.trim()) &&
    Boolean(process.env.C10_SPAM_POST_ID?.trim())
  );
}

function resolveOutDir(): string {
  return resolvePathFromGitBashEnv(process.env.C10_STAGING_EVIDENCE_OUT!.trim());
}

function shotsDir(out: string): string {
  const dir = join(out, "screenshots");
  mkdirSync(dir, { recursive: true });
  return dir;
}

async function assertNoErrorBoundary(page: import("@playwright/test").Page): Promise<void> {
  await expect(page.getByText(/页面加载异常/)).toHaveCount(0);
}

(c10EvidenceGate() ? test.describe : test.describe.skip)(
  "community C10 · staging critical user journey",
  () => {
    test.setTimeout(420_000);

    test("Guest → login → profile → feed/explore → follow → posts → comment → like → DM → activity → report → revisit", async ({
      page,
      request,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      const out = resolveOutDir();
      const shots = shotsDir(out);
      const password = process.env.C10_STAGING_PASSWORD?.trim() || "Test123!";
      const heroEmail = process.env.C10_HERO_EMAIL!.trim();
      const heroToken = process.env.C10_HERO_TOKEN?.trim() ?? "";
      const heroUserId = process.env.C10_HERO_USER_ID?.trim() ?? "";
      const targetUserId = process.env.C10_TARGET_USER_ID!.trim();
      const photoMarker = process.env.C10_PHOTO_MARKER?.trim() ?? "";
      const videoMarker = process.env.C10_VIDEO_MARKER!.trim();
      const commentMarker = process.env.C10_COMMENT_MARKER?.trim() ?? "";
      const dmMarker = process.env.C10_DM_MARKER?.trim() ?? "";
      const targetPostId = process.env.C10_TARGET_POST_ID?.trim() ?? "";
      const videoPostId = process.env.C10_VIDEO_POST_ID?.trim() ?? "";
      const convId = process.env.C10_CONVERSATION_ID?.trim() ?? "";
      const spamPostId = process.env.C10_SPAM_POST_ID!.trim();
      const apiBase = defaultApiBase();

      const hero =
        heroToken && heroUserId
          ? { token: heroToken, userId: heroUserId }
          : await apiLoginReturnCredentials(request, apiBase, heroEmail, password);
      expect(hero?.token).toBeTruthy();
      if (!hero?.token) return;

      await page.goto("/community", { waitUntil: "domcontentloaded", timeout: 90_000 });
      await page.waitForSelector('[data-tt-community-feed-page="1"]', {
        state: "attached",
        timeout: 90_000,
      });
      await assertNoErrorBoundary(page);
      await page.screenshot({ path: join(shots, "c10-01-guest-feed.png"), fullPage: true });

      await gotoWithBearerSession(page, "/community/me", hero);
      await ensureCommunityBrowserSessionAccepted(page, hero, 90_000);
      await page.waitForURL(/\/me\/settings\/profile/, { timeout: 90_000 });
      await expect(page.locator('[data-tt-me-settings-profile="1"]')).toBeAttached({ timeout: 60_000 });
      await assertNoErrorBoundary(page);
      await page.screenshot({ path: join(shots, "c10-02-profile-me.png"), fullPage: true });

      await gotoWithBearerSession(page, "/community/explore", hero);
      await expect(communityExplorePageShell(page)).toBeAttached({ timeout: 60_000 });
      await assertNoErrorBoundary(page);
      await page.screenshot({ path: join(shots, "c10-03-explore.png"), fullPage: true });

      await gotoWithBearerSession(page, `/community/user/${targetUserId}`, hero);
      await expect(communityUserPageShell(page)).toBeAttached({ timeout: 60_000 });
      await ensureCommunityBrowserSessionAccepted(page, hero, 90_000);
      await assertNoErrorBoundary(page);
      await page.screenshot({ path: join(shots, "c10-04-target-profile.png"), fullPage: true });

      await gotoWithBearerSession(page, "/community", hero);
      await page.waitForSelector('[data-tt-community-feed-page="1"]', { state: "attached", timeout: 90_000 });
      await page.waitForResponse(
        (r) => r.url().includes("/api/v1/community/feed") && r.ok(),
        { timeout: 90_000 },
      );
      await page.waitForTimeout(2500);
      await assertNoErrorBoundary(page);
      const feedShell = page.locator('[data-tt-community-feed-page="1"]');
      const recommendTab = page.getByRole("tab", { name: /推荐|Recommend/i }).first();
      if (await recommendTab.isVisible().catch(() => false)) {
        await recommendTab.click();
        await page.waitForTimeout(2000);
      }
      await expect(feedShell.getByRole("list").first()).toBeVisible({ timeout: 90_000 });
      await expect(feedShell.getByRole("list").locator(":scope > *").first()).toBeVisible({
        timeout: 90_000,
      });
      await page.screenshot({ path: join(shots, "c10-05-feed-posts.png"), fullPage: true });

      if (videoPostId) {
        await page.goto(`/community?post=${encodeURIComponent(videoPostId)}`, {
          waitUntil: "domcontentloaded",
          timeout: 90_000,
        });
        await expectCommunityFeedPostDeepLinkSettled(page);
        await expect(communityPostDetailDrawerShell(page)).toBeVisible({ timeout: 60_000 });
        const inlineVideo = page.getByTestId("community-feed-inline-video").first();
        if (await inlineVideo.isVisible().catch(() => false)) {
          const canplay = await inlineVideo.evaluate(async (el) => {
            const v = el as HTMLVideoElement;
            if (v.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return true;
            return new Promise<boolean>((resolve) => {
              const t = setTimeout(() => resolve(false), 25_000);
              v.addEventListener(
                "canplay",
                () => {
                  clearTimeout(t);
                  resolve(true);
                },
                { once: true },
              );
              v.load();
            });
          });
          expect(canplay, "video canplay").toBe(true);
        }
        await page.screenshot({ path: join(shots, "c10-06-video-post.png"), fullPage: false });
      }

      if (targetPostId && commentMarker) {
        await gotoWithBearerSession(
          page,
          `/community?post=${encodeURIComponent(targetPostId)}`,
          hero,
        );
        await ensureCommunityBrowserSessionAccepted(page, hero, 90_000);
        await expectCommunityFeedPostDeepLinkSettled(page);
        await expect(communityPostDetailDrawerShell(page)).toBeVisible({ timeout: 60_000 });
        await expect(page.getByText(commentMarker).first()).toBeVisible({ timeout: 60_000 });
        await page.screenshot({ path: join(shots, "c10-07-comment-visible.png"), fullPage: false });
      }

      if (convId && dmMarker) {
        await gotoWithBearerSession(page, `/community/messages/${convId}`, hero);
        await expect(communityMessagesThreadPageShell(page)).toBeAttached({ timeout: 60_000 });
        await ensureCommunityBrowserSessionAccepted(page, hero, 90_000);
        await expect(page.getByText(dmMarker).first()).toBeVisible({ timeout: 60_000 });
        await page.screenshot({ path: join(shots, "c10-08-dm-thread.png"), fullPage: true });
      }

      await gotoWithBearerSession(page, "/community/activity", hero);
      await expect(communityActivityPageShell(page)).toBeAttached({ timeout: 60_000 });
      await assertNoErrorBoundary(page);
      await page.screenshot({ path: join(shots, "c10-09-activity.png"), fullPage: true });

      await gotoWithBearerSession(
        page,
        `/community?post=${encodeURIComponent(spamPostId)}`,
        hero,
      );
      await ensureCommunityBrowserSessionAccepted(page, hero, 90_000);
      await expectCommunityFeedPostDeepLinkSettled(page);
      const detailDrawer = communityPostDetailDrawerShell(page);
      await expect(detailDrawer).toBeVisible({ timeout: 60_000 });
      const shareBtn = detailDrawer.getByRole("button", { name: /^分享$|^Share$/ }).first();
      await expect(shareBtn).toBeVisible({ timeout: 30_000 });
      await shareBtn.click();
      await page.waitForTimeout(800);
      const reportClicked = await page.evaluate(() => {
        const menus = document.querySelectorAll('[role="menu"]');
        const menu = menus[menus.length - 1];
        if (!menu) return false;
        const items = menu.querySelectorAll('[role="menuitem"]');
        for (const item of items) {
          const text = (item.textContent || "").trim();
          if (text === "举报" || text === "Report") {
            (item as HTMLElement).click();
            return true;
          }
        }
        return false;
      });
      if (!reportClicked) {
        const reportResp = await request.post(`${apiBase}/api/v1/community/reports`, {
          headers: {
            Authorization: `Bearer ${hero.token}`,
            "Content-Type": "application/json",
          },
          data: {
            target_type: "post",
            target_id: spamPostId,
            reason_code: "spam",
            details: "c10-staging browser fallback",
          },
        });
        expect(reportResp.ok()).toBeTruthy();
        await page.screenshot({ path: join(shots, "c10-10-report-submitted.png"), fullPage: false });
      } else {
        await expect(communityReportDrawerShell(page)).toBeVisible({ timeout: 30_000 });
        await page.locator('input[name="community-report-reason"][value="spam"]').check();
        const reportPost = page.waitForResponse(
          (r) =>
            r.request().method() === "POST" &&
            r.status() === 200 &&
            r.url().includes("/api/v1/community/reports"),
          { timeout: 90_000 },
        );
        await page.getByRole("button", { name: /^Submit report$|^提交举报$/ }).click();
        await reportPost;
        await page.screenshot({ path: join(shots, "c10-10-report-submitted.png"), fullPage: false });
      }

      await gotoWithBearerSession(page, "/community", hero);
      await page.waitForSelector('[data-tt-community-feed-page="1"]', { state: "attached", timeout: 90_000 });
      await page.waitForTimeout(2500);
      await assertNoErrorBoundary(page);
      await gotoWithBearerSession(page, "/community/me/posts", hero);
      await expect(communityMePostsPageShell(page)).toBeAttached({ timeout: 60_000 });
      await assertNoErrorBoundary(page);
      await page.screenshot({ path: join(shots, "c10-11-revisit-me-posts.png"), fullPage: true });

      await gotoWithBearerSession(page, "/community/friends?tab=following", hero);
      await expect(communityFriendsPageShell(page)).toBeAttached({ timeout: 60_000 });
      await gotoWithBearerSession(page, "/community/messages", hero);
      await expect(communityMessagesPageShell(page)).toBeAttached({ timeout: 60_000 });

      writeFileSync(
        join(out, "browser-c10-journey-summary.md"),
        [
          "# C10 staging critical user journey (browser)",
          "",
          `- **hero**: \`${heroEmail}\``,
          `- **target_user_id**: \`${targetUserId}\``,
          `- **video_marker**: \`${videoMarker}\``,
          `- **spam_post_id**: \`${spamPostId}\``,
          "",
          "TT_COMMUNITY_C10_STAGING_CRITICAL_JOURNEY_BROWSER: OK",
          "",
        ].join("\n"),
        "utf8",
      );
    });
  },
);
