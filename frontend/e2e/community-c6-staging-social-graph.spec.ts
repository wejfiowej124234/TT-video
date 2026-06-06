/**
 * ② C6 staging 社交图 E2E：关注/粉丝 · 私信 · 获赞通知 · Explore 发现 · 用户回访路径。
 *
 * 由 **`scripts/dev/record-community-c6-evidence.sh`** 驱动；须 **`C6_STAGING_EVIDENCE_RUN=1`**。
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
import { requestGetExpectOkWith429Backoff } from "./helpers/playwright429Backoff";
import {
  communityActivityPageShell,
  communityExplorePageShell,
  communityFriendsPageShell,
  communityMessagesThreadPageShell,
  communityUserPageShell,
} from "./helpers/pageShells";

function c6EvidenceGate(): boolean {
  return (
    process.env.C6_STAGING_EVIDENCE_RUN === "1" &&
    Boolean(process.env.C6_STAGING_EVIDENCE_OUT?.trim()) &&
    Boolean(process.env.C6_STAGING_FOLLOWER_EMAIL?.trim()) &&
    Boolean(process.env.C6_STAGING_AUTHOR_EMAIL?.trim()) &&
    Boolean(process.env.C6_STAGING_AUTHOR_USER_ID?.trim()) &&
    Boolean(process.env.C6_STAGING_CONV_ID?.trim()) &&
    Boolean(process.env.C6_STAGING_DM_MARKER?.trim())
  );
}

function resolveOutDir(): string {
  const raw = process.env.C6_STAGING_EVIDENCE_OUT!.trim();
  return resolvePathFromGitBashEnv(raw);
}

(c6EvidenceGate() ? test.describe : test.describe.skip)(
  "community C6 · staging social graph browser",
  () => {
    test.setTimeout(240_000);

    test("Follow · DM · activity likes · explore discovery · revisit paths", async ({
      page,
      request,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      const out = resolveOutDir();
      mkdirSync(out, { recursive: true });

      const apiBase = defaultApiBase();
      const password = process.env.C6_STAGING_PASSWORD?.trim() || "Test123!";
      const followerEmail = process.env.C6_STAGING_FOLLOWER_EMAIL!.trim();
      const authorEmail = process.env.C6_STAGING_AUTHOR_EMAIL!.trim();
      const followerToken = process.env.C6_STAGING_FOLLOWER_TOKEN?.trim();
      const authorToken = process.env.C6_STAGING_AUTHOR_TOKEN?.trim();
      const followerUserId = process.env.C6_STAGING_FOLLOWER_USER_ID?.trim() ?? "";
      const authorUserId = process.env.C6_STAGING_AUTHOR_USER_ID!.trim();
      const convId = process.env.C6_STAGING_CONV_ID!.trim();
      const dmMarker = process.env.C6_STAGING_DM_MARKER!.trim();
      const postId = process.env.C6_STAGING_POST_ID?.trim() ?? "";
      const socialMarker = process.env.C6_STAGING_SOCIAL_MARKER?.trim() ?? "";

      const follower =
        followerToken && followerUserId
          ? { token: followerToken, userId: followerUserId }
          : await apiLoginReturnCredentials(request, apiBase, followerEmail, password);
      const author =
        authorToken && authorUserId
          ? { token: authorToken, userId: authorUserId }
          : await apiLoginReturnCredentials(request, apiBase, authorEmail, password);
      expect(follower?.token).toBeTruthy();
      expect(author?.token).toBeTruthy();
      if (!follower?.token || !author?.token) return;

      const followingProbe = await requestGetExpectOkWith429Backoff(
        request,
        `${apiBase}/api/v1/community/me/following?limit=20`,
        { headers: { Authorization: `Bearer ${follower.token}` } },
      );
      const followingJson = (await followingProbe.json()) as {
        following?: { id?: string }[];
      };
      expect(
        (followingJson.following ?? []).some((u) => String(u.id) === authorUserId),
        "API following includes author",
      ).toBe(true);

      const likesProbe = await requestGetExpectOkWith429Backoff(
        request,
        `${apiBase}/api/v1/community/me/likes-received`,
        { headers: { Authorization: `Bearer ${author.token}` } },
      );
      const likesJson = (await likesProbe.json()) as { likes_received?: number };
      expect(Number(likesJson.likes_received ?? 0), "author likes_received >= 1").toBeGreaterThanOrEqual(
        1,
      );

      await gotoWithBearerSession(page, "/community/friends?tab=following", follower);
      await expect(communityFriendsPageShell(page)).toBeVisible({ timeout: 60_000 });
      await ensureCommunityBrowserSessionAccepted(page, follower, 90_000);
      const authorLink = page.locator(`a[href="/community/user/${authorUserId}"]`).first();
      await expect(authorLink).toBeVisible({ timeout: 60_000 });

      await gotoWithBearerSession(page, `/community/messages/${convId}`, author);
      await expect(communityMessagesThreadPageShell(page)).toBeVisible({ timeout: 60_000 });
      await ensureCommunityBrowserSessionAccepted(page, author, 90_000);
      await expect(page.getByText(dmMarker).first()).toBeVisible({ timeout: 30_000 });

      await gotoWithBearerSession(page, "/community/activity", author);
      await expect(communityActivityPageShell(page)).toBeVisible({ timeout: 60_000 });
      await ensureCommunityBrowserSessionAccepted(page, author, 90_000);
      await expect(page.getByText(/[1-9]\d*/).first()).toBeVisible({ timeout: 60_000 });

      await gotoWithBearerSession(page, `/community/user/${authorUserId}`, follower);
      await expect(communityUserPageShell(page)).toBeVisible({ timeout: 60_000 });
      await ensureCommunityBrowserSessionAccepted(page, follower, 90_000);
      if (postId) {
        const feedCard = page.locator(`[data-tt-community-feed-card="${postId}"]`).first();
        await expect(feedCard.or(page.getByText(socialMarker).first())).toBeVisible({
          timeout: 60_000,
        });
      }

      await gotoWithBearerSession(page, "/community/explore", follower);
      await expect(communityExplorePageShell(page)).toBeVisible({ timeout: 60_000 });
      await ensureCommunityBrowserSessionAccepted(page, follower, 90_000);
      await expect(page.getByRole("main")).toBeVisible({ timeout: 30_000 });
      const discoveryCta = page
        .getByRole("link", { name: /guides|向导|Explore|发现|Follow|关注/i })
        .first();
      await expect(discoveryCta).toBeVisible({ timeout: 60_000 });

      await page.screenshot({ path: join(out, "browser-c6-explore-discovery.png"), fullPage: false });

      const summary = [
        "# C6 staging social graph browser E2E",
        "",
        `- **follower**: \`${followerEmail}\``,
        `- **author**: \`${authorEmail}\` (\`${authorUserId}\`)`,
        `- **conversation_id**: \`${convId}\``,
        `- **dm_marker**: \`${dmMarker}\``,
        `- **post_id**: \`${postId || "n/a"}\``,
        `- **likes_received**: \`${likesJson.likes_received ?? 0}\``,
        "",
        "Surfaces verified: friends/following · DM thread · activity likes · user profile · explore discovery.",
        "",
        "Phase ② C6 slot only — NOT Phase ② GO.",
      ].join("\n");
      writeFileSync(join(out, "browser-c6-social-summary.md"), `${summary}\n`, "utf8");
    });
  },
);
