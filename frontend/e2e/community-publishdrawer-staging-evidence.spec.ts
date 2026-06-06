/**
 * ② **Staging** 浏览器证据：PublishDrawer + 真实对象存储 multipart（**禁止**复用 ① MinIO / `127.0.0.1:19000` / `tourist@test.com` 默认）。
 *
 * **仅**由 **`scripts/evidence/run-community-publishdrawer-staging-evidence.sh`** 驱动：须 **`STAGING_EVIDENCE_RUN=1`** 及显式 **`STAGING_*`** / **`PLAYWRIGHT_COMMUNITY_STAGING_PUBLISHDRAWER_EVIDENCE_OUT`**。未满足时本 **`describe`** 整体 **`skip`**，避免污染默认 **`chromium`** 跑法。
 *
 * 产出目录由脚本写入 **`PLAYWRIGHT_COMMUNITY_STAGING_PUBLISHDRAWER_EVIDENCE_OUT`**（例如 **`evidence/community-media-staging-chain/<timestamp>/`**）。**结论仅限 ② staging**；**不得**写 ③ production 已通过。
 *
 * HAR：若 **`STAGING_ALLOW_HAR=0`**，不设置 **`PLAYWRIGHT_COMMUNITY_STAGING_PUBLISHDRAWER_RECORD_HAR_PATH`**；summary 须写明替代证据（**`browser-network-api.log`** + 可选 **`STAGING_GATEWAY_LOG_REFERENCE`**）。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { test, expect, type Response } from "@playwright/test";

import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import { resolvePathFromGitBashEnv } from "./helpers/normalizeGitBashPath";
import { requestGetExpectOkWith429Backoff } from "./helpers/playwright429Backoff";
import { communityLoginForPublishShell, communityPublishDrawerShell } from "./helpers/pageShells";

function stagingEvidenceGate(): boolean {
  return (
    process.env.STAGING_EVIDENCE_RUN === "1" &&
    Boolean(process.env.STAGING_PLAYWRIGHT_BASE_URL?.trim()) &&
    Boolean(process.env.STAGING_API_BASE_URL?.trim()) &&
    Boolean(process.env.STAGING_TEST_USER?.trim()) &&
    Boolean(process.env.STAGING_TEST_PASSWORD?.trim()) &&
    Boolean(process.env.PLAYWRIGHT_COMMUNITY_STAGING_PUBLISHDRAWER_EVIDENCE_OUT?.trim()) &&
    (process.env.STAGING_ALLOW_HAR === "0" || process.env.STAGING_ALLOW_HAR === "1")
  );
}

function resolveStagingEvidenceOutDir(): string {
  const raw = process.env.PLAYWRIGHT_COMMUNITY_STAGING_PUBLISHDRAWER_EVIDENCE_OUT?.trim();
  if (!raw) {
    throw new Error("PLAYWRIGHT_COMMUNITY_STAGING_PUBLISHDRAWER_EVIDENCE_OUT is required for staging evidence");
  }
  return resolvePathFromGitBashEnv(raw);
}

/** Staging：页 origin 须与配置的 Next **`PLAYWRIGHT_BASE_URL`** origin 严格一致（不做 localhost/127 互换）。 */
function originsMatchStagingNext(pageOrigin: string, configuredNextBase: string): boolean {
  try {
    return new URL(pageOrigin).origin === new URL(configuredNextBase).origin;
  } catch {
    return false;
  }
}

function assertNotLocalMinioAssumptions(apiBase: string, nextBase: string, email: string): void {
  const blob = `${apiBase}\n${nextBase}\n${email}`;
  expect(/127\.0\.0\.1|localhost:19000|minio12345/i.test(blob), "staging evidence forbids local MinIO / :19000 / minio12345 in URLs or user context").toBe(
    false,
  );
  expect(email.trim().toLowerCase() === "tourist@test.com", "use STAGING_TEST_USER — not tourist@test.com").toBe(false);
}

function isMultipartChainResponse(res: Response): boolean {
  const req = res.request();
  const m = req.method();
  const u = res.url();
  if (m === "POST" && u.includes("/api/v1/community/media-assets/sessions")) return true;
  if (m === "PUT" && (u.includes("x-id=UploadPart") || u.includes("uploadId="))) return true;
  if (m === "POST" && u.includes("/api/v1/community/posts") && !u.includes("upload-media")) return true;
  if (m === "GET" && (u.includes("/api/v1/community/feed") || u.includes("/api/v1/community/me/following"))) return true;
  return false;
}

(stagingEvidenceGate() ? test.describe : test.describe.skip)(
  "community PublishDrawer · staging multipart browser evidence",
  () => {
    test.setTimeout(360_000);

    test("HAR or network log + multipart + Feed video canplay (staging)", async ({ page, request }) => {
      const out = resolveStagingEvidenceOutDir();
      mkdirSync(out, { recursive: true });

      const stagingUser = process.env.STAGING_TEST_USER!.trim();
      const stagingPassword = process.env.STAGING_TEST_PASSWORD!.trim();
      const allowHar = process.env.STAGING_ALLOW_HAR === "1";
      const gatewayRef = process.env.STAGING_GATEWAY_LOG_REFERENCE?.trim() ?? "";

      const consolePath = join(out, "browser-console.log");
      const capDumpPath = join(out, "browser-capabilities-from-page.json");
      const networkApiPath = join(out, "browser-network-api.log");
      const multipartChainPath = join(out, "browser-multipart-chain.log");
      const createPostJsonPath = join(out, "browser-create-post-response.json");
      const summaryPath = join(out, "browser-evidence-summary.md");

      const lines: string[] = [];
      const apiNetLines: string[] = [];
      const multipartLines: string[] = [];
      const maxApiNetLines = 2_500;

      page.on("console", (msg) => {
        lines.push(`[${msg.type()}] ${msg.text()}`);
      });
      page.on("pageerror", (err) => {
        lines.push(`[pageerror] ${String(err)}`);
      });
      page.on("response", (res) => {
        try {
          const req = res.request();
          const u = res.url();
          const m = req.method();
          if (u.includes("/api/") && apiNetLines.length < maxApiNetLines) {
            apiNetLines.push(`${res.status()}\t${m}\t${u}`);
          }
          if (isMultipartChainResponse(res)) {
            multipartLines.push(`${new Date().toISOString()}\t${res.status()}\t${m}\t${u}`);
          }
        } catch {
          /* ignore */
        }
      });

      const apiBase = defaultApiBase();
      const nextBase = (process.env.PLAYWRIGHT_BASE_URL ?? "").replace(/\/$/, "");
      if (!nextBase) throw new Error("PLAYWRIGHT_BASE_URL must be set (staging script maps STAGING_PLAYWRIGHT_BASE_URL)");
      const nextOrigin = new URL(nextBase).origin;
      const apiOrigin = new URL(apiBase).origin;

      assertNotLocalMinioAssumptions(apiBase, nextBase, stagingUser);

      const capProbe = await requestGetExpectOkWith429Backoff(
        request,
        `${apiBase}/api/v1/community/media/capabilities`,
      );
      const capProbeJson = (await capProbe.json()) as {
        public_video_publish_ready?: boolean;
        max_video_seconds?: number;
      };
      expect(capProbeJson.public_video_publish_ready).toBe(true);
      expect(capProbeJson.max_video_seconds).toBe(180);

      if (process.env.STAGING_SEED_BEFORE_LOGIN === "1") {
        await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
      }

      const cred = await apiLoginReturnCredentials(request, apiBase, stagingUser, stagingPassword);
      if (!cred) {
        throw new Error("apiLoginReturnCredentials returned null — check STAGING_TEST_USER / STAGING_TEST_PASSWORD and staging API");
      }

      const capMatcher = (r: { request: () => { method: () => string }; url: () => string }) =>
        r.request().method() === "GET" && r.url().includes("/api/v1/community/media/capabilities");

      await gotoWithBearerSession(page, "/community", cred);

      const pageOriginAfterNav = new URL(page.url()).origin;
      expect(
        originsMatchStagingNext(pageOriginAfterNav, nextOrigin),
        `page origin ${pageOriginAfterNav} must equal configured Next origin ${nextOrigin}`,
      ).toBe(true);
      expect(pageOriginAfterNav, "page must not be served from API origin").not.toBe(apiOrigin);

      await page.waitForSelector('[data-tt-community-feed-page="1"]', { timeout: 120_000 });
      await page.waitForResponse(
        (r) => {
          if (r.request().method() !== "GET" || r.status() !== 200) return false;
          const u = r.url();
          return u.includes("/api/v1/community/feed") || u.includes("/api/v1/community/me/following");
        },
        { timeout: 120_000 },
      );

      await expect(communityLoginForPublishShell(page)).toHaveCount(0);

      const ls = await page.evaluate(() => ({
        tokenLen: (localStorage.getItem("traveltrust_session_token") ?? "").length,
        userId: localStorage.getItem("traveltrust_user_id"),
      }));
      expect(ls.tokenLen, "session bearer must be in localStorage").toBeGreaterThan(0);
      const expectUid = cred.userId?.trim() ?? "";
      if (expectUid) {
        expect(ls.userId?.trim(), "localStorage user id must match API login").toBe(expectUid);
      }

      const publishSel =
        '[data-testid="community-feed-publish-entry"],[data-testid="community-feed-publish-fab"]';
      let publishSurface: "row-scoped" | "row-global" | "fab" | "publish-query" = "publish-query";
      let publishSurfaceResolved = false;
      try {
        await page.waitForSelector(publishSel, { state: "attached", timeout: 45_000 });
        publishSurfaceResolved = true;
      } catch {
        publishSurfaceResolved = false;
      }

      const feedRoot = page.locator('[data-tt-community-feed-page="1"]');
      const pubEntryInFeed = feedRoot.getByTestId("community-feed-publish-entry").first();
      const pubEntryGlobal = page.getByTestId("community-feed-publish-entry").first();
      const pubFab = page.getByTestId("community-feed-publish-fab").first();

      const drawer = communityPublishDrawerShell(page);

      let capRes: Response;

      if (publishSurfaceResolved) {
        const nEntryFeed = await pubEntryInFeed.count();
        const nEntryAny = await pubEntryGlobal.count();
        const nFab = await pubFab.count();
        if (nEntryFeed === 0 && nEntryAny === 0 && nFab === 0) {
          throw new Error("Publish controls missing after attach wait (staging UI regression).");
        }
        const capTimeout = 180_000;
        let capWait: Promise<Response>;
        if (nFab > 0 && nEntryFeed === 0 && nEntryAny === 0) {
          publishSurface = "fab";
          capWait = page.waitForResponse(capMatcher, { timeout: capTimeout });
          await pubFab.click({ force: true });
        } else if (nEntryFeed > 0) {
          publishSurface = "row-scoped";
          capWait = page.waitForResponse(capMatcher, { timeout: capTimeout });
          await pubEntryInFeed.click({ force: true });
        } else if (nEntryAny > 0) {
          publishSurface = "row-global";
          capWait = page.waitForResponse(capMatcher, { timeout: capTimeout });
          await pubEntryGlobal.click({ force: true });
        } else {
          publishSurface = "fab";
          capWait = page.waitForResponse(capMatcher, { timeout: capTimeout });
          await pubFab.click({ force: true });
        }
        await expect(drawer).toBeVisible({ timeout: 120_000 });
        capRes = await capWait;
      } else {
        const capWait = page.waitForResponse(capMatcher, { timeout: 240_000 });
        await gotoWithBearerSession(page, "/community?publish=1", cred);
        expect(originsMatchStagingNext(new URL(page.url()).origin, nextOrigin)).toBe(true);
        await page.waitForSelector('[data-tt-community-feed-page="1"]', { timeout: 120_000 });
        await expect(communityLoginForPublishShell(page)).toHaveCount(0);
        await expect(drawer).toBeVisible({ timeout: 120_000 });
        capRes = await capWait;
      }

      expect(capRes.ok(), await capRes.text().catch(() => "")).toBeTruthy();
      const capJson = (await capRes.json()) as Record<string, unknown>;
      expect(capJson.public_video_publish_ready).toBe(true);
      expect(capJson.max_video_seconds).toBe(180);
      writeFileSync(capDumpPath, `${JSON.stringify(capJson, null, 2)}\n`, "utf8");

      const typeSection = drawer.locator("section").filter({ hasText: /Type|类型/ }).first();
      await typeSection.waitFor({ state: "attached", timeout: 60_000 });
      const videoTypeBtn = typeSection.locator("button").nth(1);
      await expect(videoTypeBtn).toBeEnabled({ timeout: 120_000 });
      await videoTypeBtn.click({ force: true });
      await expect(drawer.getByText("180")).toBeVisible({ timeout: 120_000 });
      await page.screenshot({
        path: join(out, "browser-publishdrawer-01-video-180-capabilities.png"),
        fullPage: true,
      });

      const mp4 = join(process.cwd(), "e2e", "fixtures", "minimal-1s-h264.mp4");
      const videoInput = drawer.locator('input[type="file"][accept*="video"]');
      await videoInput.setInputFiles(mp4);
      await expect(drawer.locator("video")).toBeVisible({ timeout: 120_000 });
      await page.screenshot({
        path: join(out, "browser-publishdrawer-02-video-preview.png"),
        fullPage: true,
      });

      const bodyText = `browser-staging-multipart-${Date.now()}`;
      await drawer.locator("textarea").first().fill(bodyText);
      await expect(drawer.locator("footer").getByRole("button", { name: /Publish|发布/ })).toBeEnabled({
        timeout: 120_000,
      });

      await page.waitForTimeout(9_000);

      const sessionP = page.waitForResponse(
        (r) =>
          r.request().method() === "POST" &&
          r.url().includes("/api/v1/community/media-assets/sessions") &&
          !r.url().includes("/parts") &&
          !r.url().includes("/complete") &&
          r.status() === 200,
        { timeout: 180_000 },
      );
      const partsP = page.waitForResponse(
        (r) =>
          r.request().method() === "POST" &&
          r.url().includes("/api/v1/community/media-assets/sessions/") &&
          r.url().includes("/parts") &&
          r.status() === 200,
        { timeout: 180_000 },
      );
      const putP = page.waitForResponse(
        (r) =>
          r.request().method() === "PUT" &&
          (r.url().includes("x-id=UploadPart") || r.url().includes("uploadId=")) &&
          r.status() === 200,
        { timeout: 180_000 },
      );
      const completeP = page.waitForResponse(
        (r) =>
          r.request().method() === "POST" &&
          r.url().includes("/api/v1/community/media-assets/sessions/") &&
          r.url().includes("/complete") &&
          r.status() === 200,
        { timeout: 180_000 },
      );
      const postP = page.waitForResponse(
        (r) =>
          r.request().method() === "POST" &&
          r.url().includes("/api/v1/community/posts") &&
          !r.url().includes("upload-media") &&
          r.status() === 200,
        { timeout: 180_000 },
      );

      await drawer.locator("footer").getByRole("button", { name: /Publish|发布/ }).click();
      const sessionRes = await sessionP;
      const partsRes = await partsP;
      const putRes = await putP;
      const completeRes = await completeP;
      const postRes = await postP;

      multipartLines.push(
        `# multipart chain (ordered): session ${sessionRes.status()} · parts ${partsRes.status()} · put ${putRes.status()} · complete ${completeRes.status()} · createPost ${postRes.status()}`,
      );

      let createPostBody: unknown = null;
      try {
        createPostBody = await postRes.json();
      } catch {
        createPostBody = { parse_error: true };
      }
      writeFileSync(createPostJsonPath, `${JSON.stringify(createPostBody, null, 2)}\n`, "utf8");

      await page.screenshot({
        path: join(out, "browser-publishdrawer-03-after-publish.png"),
        fullPage: true,
      });

      await gotoWithBearerSession(page, "/community", cred);
      expect(originsMatchStagingNext(new URL(page.url()).origin, nextOrigin)).toBe(true);

      await page.waitForResponse(
        (r) => {
          if (r.request().method() !== "GET" || r.status() !== 200) return false;
          const u = r.url();
          return u.includes("/api/v1/community/feed") || u.includes("/api/v1/community/me/following");
        },
        { timeout: 120_000 },
      );

      const postArticle = page.locator("article").filter({ hasText: bodyText }).first();
      await expect(postArticle, "feed UI must list new post body").toBeVisible({ timeout: 120_000 });

      const feedVideo = postArticle.locator("video").first();
      await expect(feedVideo, "video post must render inline <video> in feed card").toBeVisible({
        timeout: 120_000,
      });

      await feedVideo.evaluate((el) => {
        return new Promise<void>((resolve, reject) => {
          const v = el as HTMLVideoElement;
          const ms = 90_000;
          const timer = window.setTimeout(() => reject(new Error(`video canplay timeout ${ms}ms`)), ms);
          const done = () => {
            window.clearTimeout(timer);
            resolve();
          };
          const fail = (e: Error) => {
            window.clearTimeout(timer);
            reject(e);
          };
          if (v.readyState >= 3) {
            done();
            return;
          }
          v.addEventListener("canplay", () => done(), { once: true });
          v.addEventListener("error", () => fail(new Error(v.error?.message || "video element error")), {
            once: true,
          });
          try {
            void v.play().catch(() => {});
          } catch {
            /* ignore */
          }
        });
      });

      const videoSrc = (await feedVideo.getAttribute("src"))?.trim() ?? "";
      expect(videoSrc.length, "feed video src must be set (playback URL path)").toBeGreaterThan(0);

      await page.screenshot({
        path: join(out, "browser-publishdrawer-04-feed-echo.png"),
        fullPage: true,
      });

      await page.screenshot({
        path: join(out, "browser-publishdrawer-05-feed-video-canplay.png"),
        fullPage: false,
      });

      const apiNetBody =
        apiNetLines.length >= maxApiNetLines
          ? `${apiNetLines.join("\n")}\n# truncated at ${maxApiNetLines} lines\n`
          : `${apiNetLines.join("\n")}\n`;
      writeFileSync(networkApiPath, apiNetBody, "utf8");
      writeFileSync(multipartChainPath, `${multipartLines.join("\n")}\n`, "utf8");
      writeFileSync(consolePath, `${lines.join("\n")}\n`, "utf8");

      const harLine = allowHar
        ? "- **HAR**: `browser.har` (Playwright `recordHar` when `STAGING_ALLOW_HAR=1`)."
        : "- **HAR**: **not recorded** (`STAGING_ALLOW_HAR=0`). Primary network artifact: **`browser-network-api.log`** (+ **`browser-multipart-chain.log`**).";

      const gatewayLine =
        gatewayRef.length > 0
          ? `- **Gateway / edge evidence (human)**: ${gatewayRef}`
          : "- **Gateway / edge evidence (human)**: *(none — set **`STAGING_GATEWAY_LOG_REFERENCE`** on rerun if your org requires CDN/WAF ticket IDs or log links alongside Playwright logs.)*";

      const summary = [
        "# PublishDrawer · staging browser evidence",
        "",
        "## ② Staging browser chain (this run only)",
        "",
        `- **Next origin**: ${pageOriginAfterNav} (must equal configured staging Next origin ${nextOrigin}).`,
        `- **API origin**: ${apiOrigin}`,
        `- **Session user**: \`${stagingUser}\` (localStorage token length ${ls.tokenLen}; user id ${ls.userId ?? "(none)"}).`,
        `- **STAGING_ALLOW_HAR**: ${allowHar ? "1" : "0"}.`,
        harLine,
        gatewayLine,
        `- **Feed shell**: data-tt-community-feed-page present; login-for-publish count 0.`,
        `- **Publish surface**: ${publishSurface === "publish-query" ? "opened via `/community?publish=1` (logged-in effect)" : publishSurface === "row-scoped" ? "row (scoped under feed shell)" : publishSurface === "row-global" ? "row (global)" : "FAB"}.`,
        `- **Capabilities (page GET)**: public_video_publish_ready=true, max_video_seconds=180 (see browser-capabilities-from-page.json).`,
        `- **Multipart HTTP**: session / parts / PUT / complete / createPost — see browser-multipart-chain.log.`,
        `- **Feed UI**: post body visible; \`<video src>\` length ${videoSrc.length}; **canplay** reached in-browser.`,
        `- **Artifacts**: ${allowHar ? "browser.har, " : ""}browser-console.log, browser-network-api.log, browser-multipart-chain.log, browser-create-post-response.json, screenshots.`,
        "",
        "## ③ Production",
        "",
        "**Not verified** by this run. Do not claim Production GO from this artifact.",
        "",
      ].join("\n");
      writeFileSync(summaryPath, summary, "utf8");
    });
  },
);

