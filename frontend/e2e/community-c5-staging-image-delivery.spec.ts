/**
 * ② C5 staging 图片交付 E2E：浏览器同源 Feed 读路径 + 公开图片 URL 可渲染（staging · production CDN pending）。
 *
 * 由 **`scripts/dev/record-community-c5-evidence.sh`** 驱动；须 **`C5_STAGING_EVIDENCE_RUN=1`**。
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

function c5EvidenceGate(): boolean {
  return (
    process.env.C5_STAGING_EVIDENCE_RUN === "1" &&
    Boolean(process.env.C5_STAGING_EVIDENCE_OUT?.trim()) &&
    Boolean(process.env.C5_STAGING_IMAGE_POST_ID?.trim()) &&
    Boolean(process.env.C5_STAGING_IMAGE_MARKER?.trim()) &&
    Boolean(process.env.C5_STAGING_IMAGE_TAG?.trim())
  );
}

function resolveOutDir(): string {
  const raw = process.env.C5_STAGING_EVIDENCE_OUT!.trim();
  return resolvePathFromGitBashEnv(raw);
}

function normalizeBrowserMediaUrl(raw: string): string {
  const u = raw.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const apiIdx = u.indexOf("/api/v1/");
  if (apiIdx >= 0) return u.slice(apiIdx);
  return u.startsWith("/") ? u : `/${u}`;
}

(c5EvidenceGate() ? test.describe : test.describe.skip)(
  "community C5 · staging image delivery browser",
  () => {
    test.setTimeout(180_000);

    test("Browser loads staging image URLs and reads multi-image feed", async ({ page, request }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      const out = resolveOutDir();
      mkdirSync(out, { recursive: true });
      const marker = process.env.C5_STAGING_IMAGE_MARKER!.trim();
      const postId = process.env.C5_STAGING_IMAGE_POST_ID!.trim();
      const topicTag = process.env.C5_STAGING_IMAGE_TAG!.trim();
      const apiBase = defaultApiBase();
      const email = process.env.C5_STAGING_IMAGE_EMAIL?.trim();
      const password = process.env.C5_STAGING_IMAGE_PASSWORD?.trim() || "Test123!";
      const sessionToken = process.env.C5_STAGING_IMAGE_TOKEN?.trim();
      const sessionUserId = process.env.C5_STAGING_IMAGE_USER_ID?.trim();

      const feedProbe = await requestGetExpectOkWith429Backoff(
        request,
        `${apiBase}/api/v1/community/feed?limit=50&tag=${encodeURIComponent(topicTag)}`,
      );
      const feedJson = (await feedProbe.json()) as {
        posts?: { id?: string; body?: string; media_urls?: string[]; cover_url?: string }[];
      };
      const apiRow = (feedJson.posts ?? []).find(
        (p) => String(p.id) === postId || (p.body ?? "").includes(marker),
      );
      expect(apiRow, `post ${postId} / marker must appear in tagged feed API`).toBeTruthy();
      const mediaUrls = (apiRow?.media_urls ?? []).map(normalizeBrowserMediaUrl);
      expect(mediaUrls.length, "feed API media_urls >= 2").toBeGreaterThanOrEqual(2);
      expect(apiRow?.cover_url?.length, "feed API cover_url set").toBeGreaterThan(0);

      if (sessionToken) {
        await gotoWithBearerSession(page, "/community", {
          token: sessionToken,
          userId: sessionUserId ?? "",
        });
      } else if (email) {
        const cred = await apiLoginReturnCredentials(request, apiBase, email, password);
        await gotoWithBearerSession(page, "/community", {
          token: cred?.token ?? "c5-staging-guest",
          userId: cred?.userId || sessionUserId || "",
        });
      } else {
        await page.goto("/community");
      }
      const drawer = communityPublishDrawerShell(page);
      await expect(drawer.or(page.getByRole("main"))).toBeVisible({ timeout: 90_000 });

      const browserFeed = await page.evaluate(async ({ tag, id, bodyMarker }) => {
        const token = localStorage.getItem("traveltrust_session_token");
        const headers: Record<string, string> = { Accept: "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;
        const surfaces = [
          `/api/v1/community/feed?limit=20&tag=${encodeURIComponent(tag)}`,
          `/api/v1/community/feed?limit=20&mode=recommend&tag=${encodeURIComponent(tag)}`,
        ];
        const out: { surface: string; ok: boolean; mediaCount: number }[] = [];
        for (const path of surfaces) {
          const res = await fetch(path, { headers });
          if (!res.ok) {
            out.push({ surface: path, ok: false, mediaCount: 0 });
            continue;
          }
          const j = (await res.json()) as {
            posts?: { id?: string; body?: string; media_urls?: string[] }[];
          };
          const row = (j.posts ?? []).find(
            (p) => String(p.id) === id || (p.body ?? "").includes(bodyMarker),
          );
          out.push({
            surface: path,
            ok: Boolean(row),
            mediaCount: row?.media_urls?.length ?? 0,
          });
        }
        return out;
      }, { tag: topicTag, id: postId, bodyMarker: marker });

      for (const row of browserFeed) {
        expect(row.ok, `browser fetch ${row.surface} must include post`).toBe(true);
        expect(row.mediaCount, `browser fetch ${row.surface} media_urls >= 2`).toBeGreaterThanOrEqual(2);
      }

      const imageLoad = await page.evaluate(async (urls: string[]) => {
        const loadOne = (src: string) =>
          new Promise<{ src: string; width: number; cacheControl: string }>((resolve, reject) => {
            const img = new Image();
            img.onload = async () => {
              let cacheControl = "";
              try {
                const head = await fetch(src, { method: "GET" });
                cacheControl = head.headers.get("cache-control") ?? "";
              } catch {
                cacheControl = "";
              }
              resolve({ src, width: img.naturalWidth, cacheControl });
            };
            img.onerror = () => reject(new Error(`failed to load ${src}`));
            img.src = src.startsWith("http") ? src : `${window.location.origin}${src}`;
          });
        return Promise.all(urls.map(loadOne));
      }, mediaUrls.slice(0, 2));

      for (const row of imageLoad) {
        expect(row.width, `image naturalWidth > 0 (${row.src})`).toBeGreaterThan(0);
        expect(row.cacheControl, `cache-control immutable (${row.src})`).toMatch(/immutable/);
        expect(row.cacheControl, `cache-control max-age=86400 (${row.src})`).toMatch(/max-age=86400/);
      }

      await page.setContent(
        `<div id="c5-proof">${imageLoad
          .map((r) => `<img src="${r.src}" alt="c5-staging" style="width:120px;height:120px;object-fit:cover;margin:4px" />`)
          .join("")}</div>`,
      );
      await expect(page.locator("#c5-proof img")).toHaveCount(2);
      await page.locator("#c5-proof").screenshot({
        path: join(out, "browser-c5-feed-multi-image.png"),
      });

      const summary = [
        "# C5 staging multi-image display E2E",
        "",
        `- **post_id**: \`${postId}\``,
        `- **topic_tag**: \`${topicTag}\``,
        `- **marker**: \`${marker}\``,
        `- **browser surfaces**: feed + recommend (tag filter)`,
        `- **feed API media_urls**: ${mediaUrls.length}`,
        `- **images loaded in browser**: ${imageLoad.length}`,
        `- **cache-control sample**: \`${imageLoad[0]?.cacheControl ?? ""}\``,
        `- **CDN boundary**: **staging image delivery PASS** · **production CDN pending**`,
        "",
      ].join("\n");
      writeFileSync(join(out, "browser-c5-image-summary.md"), summary, "utf8");

      expect(true).toBe(true);
    });
  },
);
