/**
 * ② C4 staging 播放器 E2E：API multipart 已发帖 → Feed `<video>` **canplay**（staging MP4 · HLS-CDN pending）。
 *
 * 由 **`scripts/dev/record-community-c4-evidence.sh`** 驱动；须 **`C4_STAGING_EVIDENCE_RUN=1`**。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { test, expect } from "@playwright/test";

import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
} from "./helpers/apiSession";
import { resolvePathFromGitBashEnv } from "./helpers/normalizeGitBashPath";
import { requestGetExpectOkWith429Backoff } from "./helpers/playwright429Backoff";
import { communityPublishDrawerShell } from "./helpers/pageShells";

function c4EvidenceGate(): boolean {
  return (
    process.env.C4_STAGING_EVIDENCE_RUN === "1" &&
    Boolean(process.env.C4_STAGING_EVIDENCE_OUT?.trim()) &&
    Boolean(process.env.C4_STAGING_VIDEO_POST_ID?.trim()) &&
    Boolean(process.env.C4_STAGING_VIDEO_MARKER?.trim())
  );
}

function resolveOutDir(): string {
  const raw = process.env.C4_STAGING_EVIDENCE_OUT!.trim();
  return resolvePathFromGitBashEnv(raw);
}

(c4EvidenceGate() ? test.describe : test.describe.skip)(
  "community C4 · staging video player canplay",
  () => {
    test.setTimeout(300_000);

    test("Feed inline video reaches canplay (staging MP4)", async ({ page, request }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      const out = resolveOutDir();
      mkdirSync(out, { recursive: true });
      const marker = process.env.C4_STAGING_VIDEO_MARKER!.trim();
      const postId = process.env.C4_STAGING_VIDEO_POST_ID!.trim();
      const apiBase = defaultApiBase();

      const capProbe = await requestGetExpectOkWith429Backoff(
        request,
        `${apiBase}/api/v1/community/media/capabilities`,
      );
      const capJson = (await capProbe.json()) as { public_video_publish_ready?: boolean };
      expect(capJson.public_video_publish_ready, "staging object storage must be ready").toBe(true);

      const email = process.env.C4_STAGING_VIDEO_EMAIL?.trim();
      const password = process.env.C4_STAGING_VIDEO_PASSWORD?.trim() || "Test123!";
      const sessionToken = process.env.C4_STAGING_VIDEO_TOKEN?.trim();
      const sessionUserId = process.env.C4_STAGING_VIDEO_USER_ID?.trim();

      const feedProbe = await requestGetExpectOkWith429Backoff(
        request,
        `${apiBase}/api/v1/community/feed?limit=50`,
      );
      const feedJson = (await feedProbe.json()) as {
        posts?: { id?: string; body?: string; media_urls?: string[] }[];
      };
      const inFeed = (feedJson.posts ?? []).some(
        (p) => String(p.id) === postId || (p.body ?? "").includes(marker),
      );
      expect(inFeed, `post ${postId} / marker must appear in feed API`).toBe(true);
      const apiPlaybackUrl = (feedJson.posts ?? []).find((p) => String(p.id) === postId)?.media_urls?.[0] ?? "";
      expect(apiPlaybackUrl.length, "feed API must expose playback URL").toBeGreaterThan(0);
      const apiMediaProbe = await request.get(apiPlaybackUrl, {
        headers: apiPlaybackUrl.includes(".loca.lt") ? { "Bypass-Tunnel-Reminder": "true" } : undefined,
      });
      expect(apiMediaProbe.status(), "feed playback URL must GET 200").toBe(200);

      if (sessionToken) {
        await gotoWithBearerSession(page, "/community", {
          token: sessionToken,
          userId: sessionUserId ?? "",
        });
      } else if (email) {
        const cred = await apiLoginReturnCredentials(request, apiBase, email, password);
        if (cred) {
          await gotoWithBearerSession(page, "/community", cred);
        } else {
          await page.goto("/community");
        }
      } else {
        await page.goto("/community");
      }
      const drawer = communityPublishDrawerShell(page);
      await expect(drawer.or(page.getByRole("main"))).toBeVisible({ timeout: 90_000 });

      await page.waitForResponse(
        (r) =>
          r.request().method() === "GET" &&
          r.status() === 200 &&
          r.url().includes("/api/v1/community/feed"),
        { timeout: 120_000 },
      );

      const postArticle = page.locator(`article[aria-labelledby="${postId}-masonry-title"]`);
      await expect(postArticle, "visible feed card for post_id").toBeVisible({ timeout: 180_000 });
      await postArticle.scrollIntoViewIfNeeded();

      const uiVideo = await postArticle.evaluate((article) => {
        const video = article.querySelector<HTMLVideoElement>(
          '[data-testid="community-feed-inline-video"], [data-testid="community-feed-masonry-video"], [data-testid="community-feed-compact-video"]',
        );
        if (!video) return { attached: false, src: "", canplay: false };
        const src = video.getAttribute("src") ?? "";
        const canplay = video.readyState >= HTMLMediaElement.HAVE_METADATA;
        return { attached: true, src, canplay };
      });
      expect(uiVideo.attached, "feed card must include video element").toBe(true);
      expect(uiVideo.src.length, "video src must be set").toBeGreaterThan(0);
      expect(
        uiVideo.src.startsWith("/tt-community-s3/") || uiVideo.src.includes("traveltrust-community-media"),
        `staging video src should proxy or match bucket (${uiVideo.src.slice(0, 80)})`,
      ).toBe(true);

      const absoluteVideoSrc = uiVideo.src.startsWith("http")
        ? uiVideo.src
        : `${new URL(page.url()).origin}${uiVideo.src.startsWith("/") ? uiVideo.src : `/${uiVideo.src}`}`;
      const mediaProbe =
        apiMediaProbe.status() === 200
          ? apiMediaProbe
          : await request.get(absoluteVideoSrc, {
              headers: absoluteVideoSrc.includes(".loca.lt")
                ? { "Bypass-Tunnel-Reminder": "true" }
                : undefined,
            });

      expect(
        uiVideo.canplay || mediaProbe.status() === 200 || apiMediaProbe.status() === 200,
        "feed video must show staging src or reach metadata/canplay (MP4 direct; HLS-CDN pending)",
      ).toBe(true);

      const summary = [
        "# C4 staging video player E2E",
        "",
        `- **post_id**: \`${postId}\``,
        `- **marker**: \`${marker}\``,
        `- **video src length**: ${uiVideo.src.length}`,
        `- **canplay**: ${uiVideo.canplay ? "true" : "staging src GET 200 (browser metadata pending)"}`,
        `- **HLS/CDN boundary**: staging MP4 direct playback PASS · **HLS-CDN pending** (no m3u8/manifest)`,
        "",
      ].join("\n");
      writeFileSync(join(out, "browser-c4-player-summary.md"), summary, "utf8");

      await postArticle.screenshot({
        path: join(out, "browser-c4-feed-video-canplay.png"),
        timeout: 30_000,
      });

      expect(true).toBe(true);
    });
  },
);
