/**
 * ② C9 staging Shell Token / Visual Sign-off（Founder Review + 88 §18.7）。
 *
 * 由 **`scripts/dev/record-community-c9-evidence.sh`** 驱动；须 **`C9_STAGING_EVIDENCE_RUN=1`**。
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
import { resolvePathFromGitBashEnv } from "./helpers/normalizeGitBashPath";
import {
  communityActivityPageShell,
  communityExplorePageShell,
  communityFeedPageShell,
  communityFriendsPageShell,
  communityMePageShell,
  communityMessagesPageShell,
  communityUserPageShell,
  didRankPageShell,
} from "./helpers/pageShells";

function c9EvidenceGate(): boolean {
  return (
    process.env.C9_STAGING_EVIDENCE_RUN === "1" &&
    Boolean(process.env.C9_STAGING_EVIDENCE_OUT?.trim()) &&
    Boolean(process.env.C9_SHOWCASE_USER_ID?.trim())
  );
}

function resolveOutDir(): string {
  const raw = process.env.C9_STAGING_EVIDENCE_OUT!.trim();
  return resolvePathFromGitBashEnv(raw);
}

function screenshotDir(out: string): string {
  const dir = join(out, "screenshots");
  mkdirSync(dir, { recursive: true });
  return dir;
}

(c9EvidenceGate() ? test.describe : test.describe.skip)(
  "community C9 · staging shell visual sign-off",
  () => {
    test.setTimeout(300_000);

    test("Community · Profile · Explore · Messages · Friends · Activity · Trust/DID · mobile", async ({
      page,
      browser,
      request,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      const out = resolveOutDir();
      const shots = screenshotDir(out);
      const showcaseUserId = process.env.C9_SHOWCASE_USER_ID!.trim();
      const loginEmail = process.env.C9_STAGING_LOGIN_EMAIL?.trim() ?? "";
      const loginPassword = process.env.C9_STAGING_PASSWORD?.trim() || "Test123!";

      const apiBase = defaultApiBase();
      const feedProbe = await request.get(`${apiBase}/api/v1/community/feed?limit=30`);
      expect(feedProbe.ok()).toBeTruthy();
      const feedJson = (await feedProbe.json()) as {
        posts?: { body?: string; author_nickname?: string; user_id?: string }[];
      };
      const posts = feedJson.posts ?? [];
      expect(posts.length, "feed has posts").toBeGreaterThanOrEqual(10);

      const automationLeak = posts.filter((p) =>
        /^(e2e-|pi1-fe-|browser-minio-)/i.test(String(p.body ?? "").trim()),
      );
      expect(automationLeak.length, "no automation body prefix in public feed sample").toBe(0);

      const showcasePost = posts.find((p) => p.user_id === showcaseUserId);
      expect(showcasePost, "showcase author present in feed").toBeTruthy();

      let session = null as Awaited<ReturnType<typeof apiLoginReturnCredentials>> | null;
      if (loginEmail) {
        session = await apiLoginReturnCredentials(request, apiBase, loginEmail, loginPassword);
      }

      // --- Feed (Community) — guest public catalog for visual sign-off ---
      await page.goto("/community", { waitUntil: "domcontentloaded", timeout: 90_000 });
      await page.waitForSelector('[data-tt-community-feed-page="1"]', {
        state: "attached",
        timeout: 90_000,
      });
      await page
        .waitForResponse(
          (resp) => resp.url().includes("/api/v1/community/feed") && resp.ok(),
          { timeout: 90_000 },
        )
        .catch(() => undefined);
      await page.waitForTimeout(2500);
      await expect(page.getByText(/页面加载异常/)).toHaveCount(0);
      await expect(page.getByText(/分享旅途|游客|查看全文|发布/i).first()).toBeVisible({
        timeout: 90_000,
      });
      const hotTab = page.getByRole("button", { name: /最热|Hot/i }).first();
      if (await hotTab.isVisible().catch(() => false)) {
        await hotTab.click();
        await page.waitForTimeout(2000);
      }
      const feedShell = page.locator('[data-tt-community-feed-page="1"]');
      await expect(feedShell.getByRole("list").first()).toBeVisible({ timeout: 90_000 });
      await expect(feedShell.getByRole("list").locator(":scope > *").first()).toBeVisible({
        timeout: 90_000,
      });
      await page.screenshot({ path: join(shots, "c9-feed-desktop.png"), fullPage: true });

      // --- Explore ---
      if (session?.token) {
        await gotoWithBearerSession(page, "/community/explore", session);
      } else {
        await page.goto("/community/explore", { waitUntil: "domcontentloaded", timeout: 90_000 });
      }
      await expect(communityExplorePageShell(page)).toBeAttached({ timeout: 60_000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: join(shots, "c9-explore-desktop.png"), fullPage: true });

      // --- Friends ---
      if (session?.token) {
        await gotoWithBearerSession(page, "/community/friends", session);
        await ensureCommunityBrowserSessionAccepted(page, session, 60_000);
      } else {
        await page.goto("/community/friends", { waitUntil: "domcontentloaded", timeout: 90_000 });
      }
      await expect(communityFriendsPageShell(page)).toBeAttached({ timeout: 60_000 });
      await page.screenshot({ path: join(shots, "c9-friends-desktop.png"), fullPage: true });

      // --- Messages ---
      if (session?.token) {
        await gotoWithBearerSession(page, "/community/messages", session);
      } else {
        await page.goto("/community/messages", { waitUntil: "domcontentloaded", timeout: 90_000 });
      }
      await expect(communityMessagesPageShell(page)).toBeAttached({ timeout: 60_000 });
      await page.screenshot({ path: join(shots, "c9-messages-desktop.png"), fullPage: true });

      // --- Activity ---
      if (session?.token) {
        await gotoWithBearerSession(page, "/community/activity", session);
      } else {
        await page.goto("/community/activity", { waitUntil: "domcontentloaded", timeout: 90_000 });
      }
      await expect(communityActivityPageShell(page)).toBeAttached({ timeout: 60_000 });
      await page.screenshot({ path: join(shots, "c9-activity-desktop.png"), fullPage: true });

      // --- Profile (public user) ---
      await page.goto(`/community/user/${showcaseUserId}`, {
        waitUntil: "domcontentloaded",
        timeout: 90_000,
      });
      await expect(communityUserPageShell(page)).toBeAttached({ timeout: 60_000 });
      await expect(page.getByRole("main")).toBeVisible({ timeout: 30_000 });
      await page.screenshot({ path: join(shots, "c9-profile-user-desktop.png"), fullPage: true });

      // --- Trust/DID: DID rank entry + community cross-nav ---
      await page.goto("/did-rank", { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expect(didRankPageShell(page)).toBeAttached({ timeout: 90_000 });
      await page.screenshot({ path: join(shots, "c9-did-rank-desktop.png"), fullPage: true });

      // --- Logged-in /community/me (optional · staging login user may lack me shell) ---
      if (session?.token) {
        await gotoWithBearerSession(page, "/community/me", session);
        await ensureCommunityBrowserSessionAccepted(page, session, 90_000);
        const meAttached = await communityMePageShell(page)
          .waitFor({ state: "attached", timeout: 60_000 })
          .then(() => true)
          .catch(() => false);
        if (meAttached) {
          await expect(page.getByText(/DID|钱包|Wallet/i).first()).toBeVisible({ timeout: 60_000 });
          await page.screenshot({ path: join(shots, "c9-profile-me-desktop.png"), fullPage: true });
        }
      }

      // --- Mobile Feed ---
      const mobileCtx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      const mobilePage = await mobileCtx.newPage();
      await mobilePage.goto("/community", { waitUntil: "domcontentloaded", timeout: 90_000 });
      await mobilePage.waitForSelector('[data-tt-community-feed-page="1"]', {
        state: "attached",
        timeout: 90_000,
      });
      await mobilePage.waitForTimeout(2000);
      await mobilePage.screenshot({ path: join(shots, "c9-feed-mobile.png"), fullPage: true });
      await mobileCtx.close();

      const summary = [
        "# C9 staging shell visual sign-off (browser)",
        "",
        `- **showcase_user_id**: \`${showcaseUserId}\``,
        `- **feed_posts_sampled**: ${posts.length}`,
        `- **automation_leak**: ${automationLeak.length}`,
        `- **login_email**: ${loginEmail ? `\`${loginEmail}\`` : "(guest only for /community/me)"}`,
        `- **screenshots**: ${shots}`,
        "",
        "TT_COMMUNITY_C9_STAGING_SHELL_BROWSER: OK",
        "",
      ].join("\n");
      writeFileSync(join(out, "browser-c9-shell-summary.md"), summary, "utf8");
    });
  },
);
