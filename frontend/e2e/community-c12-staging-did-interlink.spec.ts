/**
 * ② C12 staging DID / Trust / Reputation interlink E2E（Feed · Profile · Rank · 回链）。
 *
 * 由 **`scripts/dev/record-community-c12-evidence.sh`** 驱动；须 **`C12_STAGING_EVIDENCE_RUN=1`**。
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
  communityFeedPageShell,
  communityFriendsPageShell,
  communityUserPageShell,
  didRankPageShell,
} from "./helpers/pageShells";

function c12EvidenceGate(): boolean {
  return (
    process.env.C12_STAGING_EVIDENCE_RUN === "1" &&
    Boolean(process.env.C12_STAGING_EVIDENCE_OUT?.trim()) &&
    Boolean(process.env.C12_HERO_EMAIL?.trim()) &&
    Boolean(process.env.C12_TARGET_USER_ID?.trim()) &&
    Boolean(process.env.C12_SHOWCASE_USER_ID?.trim()) &&
    Boolean(process.env.C12_MARKER?.trim())
  );
}

function resolveOutDir(): string {
  const raw = process.env.C12_STAGING_EVIDENCE_OUT!.trim();
  return resolvePathFromGitBashEnv(raw);
}

function screenshotDir(out: string): string {
  const dir = join(out, "screenshots");
  mkdirSync(dir, { recursive: true });
  return dir;
}

(c12EvidenceGate() ? test.describe : test.describe.skip)(
  "community C12 · staging DID / Trust interlink browser",
  () => {
    test.setTimeout(300_000);

    test("Feed author · Profile · DID Rank · Community back-nav · follow + identity", async ({
      page,
      request,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      const out = resolveOutDir();
      const shots = screenshotDir(out);

      const apiBase = defaultApiBase();
      const password = process.env.C12_STAGING_PASSWORD?.trim() || "Test123!";
      const heroEmail = process.env.C12_HERO_EMAIL!.trim();
      const targetUserId = process.env.C12_TARGET_USER_ID!.trim();
      const showcaseUserId = process.env.C12_SHOWCASE_USER_ID!.trim();
      const marker = process.env.C12_MARKER!.trim();

      const hero = await apiLoginReturnCredentials(request, apiBase, heroEmail, password);
      expect(hero?.token).toBeTruthy();
      if (!hero?.token) return;

      const meProbe = await request.get(`${apiBase}/api/v1/me`, {
        headers: { Authorization: `Bearer ${hero.token}` },
      });
      expect(meProbe.ok()).toBeTruthy();
      const meJson = (await meProbe.json()) as {
        trust?: { identity_status?: string; risk_level?: string; reputation?: unknown };
        user?: { role?: string; default_wallet_address?: string | null };
      };
      expect(meJson.trust?.identity_status).toBeTruthy();
      expect(meJson.trust?.risk_level).toBeTruthy();

      const feedProbe = await request.get(`${apiBase}/api/v1/community/feed?limit=50`);
      expect(feedProbe.ok()).toBeTruthy();
      const feedJson = (await feedProbe.json()) as {
        posts?: {
          body?: string;
          user_id?: string;
          author_nickname?: string;
          author_role?: string;
        }[];
      };
      const markerPost = (feedJson.posts ?? []).find((p) => String(p.body ?? "") === marker);
      expect(markerPost, "marker post in feed").toBeTruthy();
      expect(markerPost?.author_nickname).toBeTruthy();
      expect(markerPost?.author_role).toBeTruthy();
      expect(String(markerPost?.user_id)).toBe(targetUserId);

      await gotoWithBearerSession(page, "/community", hero);
      await expect(communityFeedPageShell(page)).toBeAttached({ timeout: 90_000 });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: join(shots, "c12-01-feed-author-identity.png"), fullPage: false });

      await gotoWithBearerSession(page, `/community/user/${targetUserId}`, hero);
      await expect(communityUserPageShell(page)).toBeAttached({ timeout: 60_000 });
      await expect(page.getByText(marker, { exact: false }).first()).toBeVisible({ timeout: 60_000 });
      await page.screenshot({ path: join(shots, "c12-02-profile-user.png"), fullPage: false });

      await gotoWithBearerSession(page, "/community/me", hero);
      await page.waitForURL("**/me/settings/profile**", { timeout: 60_000 });
      await expect(page.locator('[data-tt-me-settings-profile="1"]')).toBeAttached({ timeout: 60_000 });
      await ensureCommunityBrowserSessionAccepted(page, hero, 90_000);
      await expect(page.getByText(/DID|钱包|Wallet/i).first()).toBeVisible({ timeout: 60_000 });
      await page.screenshot({ path: join(shots, "c12-03-profile-me-did-wallet.png"), fullPage: false });

      await page.goto("/did-rank?period=all", { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expect(didRankPageShell(page)).toBeAttached({ timeout: 90_000 });
      await expect(page.getByRole("main", { name: /Ranking|排行榜/i })).toBeVisible({ timeout: 60_000 });
      await page.screenshot({ path: join(shots, "c12-04-did-rank-board.png"), fullPage: false });

      const rankProfileLink = page.locator(`a[href="/community/user/${showcaseUserId}"]`).first();
      if (await rankProfileLink.count()) {
        await rankProfileLink.click();
      } else {
        await page.goto(`/community/user/${showcaseUserId}`, {
          waitUntil: "domcontentloaded",
          timeout: 90_000,
        });
      }
      await expect(communityUserPageShell(page)).toBeAttached({ timeout: 60_000 });
      await page.screenshot({ path: join(shots, "c12-05-did-rank-to-profile.png"), fullPage: false });

      const headerCommunity = page.getByRole("link", { name: /Community|社区/i }).first();
      if (await headerCommunity.count()) {
        await headerCommunity.click();
      } else {
        await page.goto("/community", { waitUntil: "domcontentloaded", timeout: 90_000 });
      }
      await expect(communityFeedPageShell(page)).toBeAttached({ timeout: 90_000 });
      await page.screenshot({ path: join(shots, "c12-06-community-back-from-profile.png"), fullPage: false });

      await gotoWithBearerSession(page, "/community/friends?tab=following", hero);
      await expect(communityFriendsPageShell(page)).toBeAttached({ timeout: 60_000 });
      await expect(page.locator(`a[href="/community/user/${targetUserId}"]`).first()).toBeVisible({
        timeout: 60_000,
      });
      await page.screenshot({ path: join(shots, "c12-07-friends-following-identity.png"), fullPage: false });

      await page.goto("/did-rank?period=all&board=guide", {
        waitUntil: "domcontentloaded",
        timeout: 90_000,
      });
      await expect(didRankPageShell(page)).toBeAttached({ timeout: 90_000 });
      await expect(page.getByRole("tab", { name: /向导榜|Guides/i })).toBeVisible({ timeout: 30_000 });
      await page.screenshot({ path: join(shots, "c12-08-did-rank-guide-tab.png"), fullPage: false });

      const summary = [
        "# C12 staging DID / Trust interlink (browser)",
        "",
        `- **hero_email**: \`${heroEmail}\``,
        `- **target_user_id**: \`${targetUserId}\``,
        `- **showcase_user_id**: \`${showcaseUserId}\``,
        `- **marker**: \`${marker}\``,
        `- **trust.identity_status**: \`${meJson.trust?.identity_status ?? ""}\``,
        `- **trust.risk_level**: \`${meJson.trust?.risk_level ?? ""}\``,
        `- **screenshots**: ${shots}`,
        "",
        "TT_COMMUNITY_C12_STAGING_DID_INTERLINK_BROWSER: OK",
        "",
      ].join("\n");
      writeFileSync(join(out, "browser-c12-did-interlink-summary.md"), summary, "utf8");
    });
  },
);
