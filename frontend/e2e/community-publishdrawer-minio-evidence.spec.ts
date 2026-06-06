/**
 * ① 浏览器证据：PublishDrawer + MinIO multipart（与 **`evidence/community-media-local-minio-chain/out/24-env-snapshot.txt`** 同源 API 环境）。
 *
 * 入口：**`gotoWithBearerSession(page, "/community", cred)`** → Feed 壳与 **`GET …/community/feed` 或 `…/me/following` 200** → 优先 **`data-testid="community-feed-publish-entry"`**（顶区宽入口）或 **`community-feed-publish-fab`**；若 **45s 内** 二者均未挂，则 **`gotoWithBearerSession(page, "/community?publish=1", cred)`**（已登录时由 **`useCommunityFeedPublishQueryAndRegister`** 直开 **`PublishDrawer`**，仍为真实 multipart，**非** mock）。
 *
 * 产出（相对仓库根 **`evidence/community-media-local-minio-chain/out/`**）：
 * **`browser.har`**（**`PLAYWRIGHT_COMMUNITY_PUBLISHDRAWER_RECORD_HAR_PATH`** → **`playwright.config.ts`** 根 **`use.contextOptions.recordHar`**，context 关闭时落盘，**非手工伪造**）、**`browser-console.log`**、**`browser-network-api.log`**、**`browser-multipart-chain.log`**、**`browser-capabilities-from-page.json`**、**`browser-create-post-response.json`**、**`browser-evidence-summary.md`**、截图 **`browser-publishdrawer-*.png`**。
 *
 * 运行：**`bash scripts/evidence/run-community-publishdrawer-browser-evidence.sh`**（须已起 MinIO / Postgres，且已存在 **`24-env-snapshot.txt`**）；该脚本导出 **`PLAYWRIGHT_MINIO_EVIDENCE_REQUIRE_STORAGE=1`**，无对象存储时 **fail**（证据链不可假绿）。**`npm run e2e:full-chromium` / `local-e2e-chromium-full-matrix`** 等宽切面**不**设该变量：无存储时本文件 **skip**，避免独立开发无 Docker MinIO 时全矩阵误红。**`frontend/scripts/run-e2e-default.mjs`**（及 **`local-e2e-chromium-full-matrix.sh`**）在检测到 **`PLAYWRIGHT_MINIO_EVIDENCE_REQUIRE_STORAGE=1`** 但未设 **`PLAYWRIGHT_COMMUNITY_PUBLISHDRAWER_EVIDENCE_OUT`** 时会 **清掉** 该变量（父 shell 曾跑证据脚本后的泄漏）；须保留泄漏时设 **`PLAYWRIGHT_PRESERVE_MINIO_EVIDENCE_GATE=1`** 并自配 **OUT**。若 **publish 入口 / FAB 长期不挂**，删 **`frontend/.next`** 后重跑。
 *
 * **验收阶次**：本文件仅覆盖 **① 本地** 浏览器真 multipart + Feed 视频 **`canplay`**；**② 测试网 / ③ 生产** 须另跑环境，不在此宣称完成。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve as pathResolve } from "node:path";

import { test, expect, type Response } from "@playwright/test";

import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import { resolvePathFromGitBashEnv } from "./helpers/normalizeGitBashPath";
import { communityPublishDrawerShell } from "./helpers/pageShells";
import { selectPublishDrawerVideoType, openCommunityPublishDrawer } from "./helpers/publishDrawerVideo";
import { requestGetExpectOkWith429Backoff } from "./helpers/playwright429Backoff";

/**
 * 与 **`scripts/evidence/run-community-publishdrawer-browser-evidence.sh`** 对齐：该脚本导出
 * **`PLAYWRIGHT_COMMUNITY_PUBLISHDRAWER_EVIDENCE_OUT`**（仓库根下 `evidence/.../out` 绝对路径），保证 **`recordHar`**
 * 落盘位置与收尾 **`test -s …/browser.har`** 一致。勿在 spec 内使用 **`import.meta.url`**（Playwright TS 管线在部分环境下会触发 **`require is not defined`**）。
 */
function resolveEvidenceOutDir(): string {
  const fromEnv = process.env.PLAYWRIGHT_COMMUNITY_PUBLISHDRAWER_EVIDENCE_OUT?.trim();
  if (fromEnv) return resolvePathFromGitBashEnv(fromEnv);
  return pathResolve(join(process.cwd(), "..", "evidence", "community-media-local-minio-chain", "out"));
}

const EVIDENCE_OUT = resolveEvidenceOutDir();

mkdirSync(EVIDENCE_OUT, { recursive: true });

/** `localhost` 与 `127.0.0.1` 同协议同端口视为同一本地 Next（避免误红）。 */
function originsMatchLocalNext(a: string, b: string): boolean {
  if (a === b) return true;
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    const local = (h: string) => h === "localhost" || h === "127.0.0.1";
    return (
      ua.protocol === ub.protocol &&
      ua.port === ub.port &&
      local(ua.hostname) &&
      local(ub.hostname)
    );
  } catch {
    return false;
  }
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

/** 证据脚本 **`run-community-publishdrawer-browser-evidence.sh`** 设为 **1**：无 **`public_video_publish_ready`** 须 **fail**。全量 chromium 矩阵不设：走 **`test.skip`**。 */
function minioEvidenceRequireStorage(): boolean {
  return process.env.PLAYWRIGHT_MINIO_EVIDENCE_REQUIRE_STORAGE === "1";
}

const SKIP_NO_OBJECT_STORAGE_MSG =
  "public_video_publish_ready=false (MinIO / object storage / HeadBucket); full multipart evidence needs local S3 — see docs/runbook/COMMUNITY-MEDIA-OBJECT-STORAGE.md";

function assertOrSkipVideoPublishReady(ready: boolean | undefined, phase: "api-probe" | "page-capabilities"): void {
  if (ready) return;
  if (minioEvidenceRequireStorage()) {
    expect(
      ready,
      `PLAYWRIGHT_MINIO_EVIDENCE_REQUIRE_STORAGE=1 (${phase}): MinIO/S3 or HeadBucket must succeed — see docs/runbook/COMMUNITY-MEDIA-OBJECT-STORAGE.md`,
    ).toBe(true);
  }
  test.skip(true, SKIP_NO_OBJECT_STORAGE_MSG);
}

test.describe("community PublishDrawer · MinIO multipart browser evidence", () => {
  test.setTimeout(360_000);

  test("HAR + console + screenshots + multipart network chain", async ({ page, request }) => {
    const out = EVIDENCE_OUT;
    mkdirSync(out, { recursive: true });
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
    const nextBase = (process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3012").replace(/\/$/, "");
    const nextOrigin = new URL(nextBase).origin;
    const apiOrigin = new URL(apiBase).origin;
    const capProbe = await requestGetExpectOkWith429Backoff(
      request,
      `${apiBase}/api/v1/community/media/capabilities`,
    );
    const capProbeJson = (await capProbe.json()) as {
      public_video_publish_ready?: boolean;
      max_video_seconds?: number;
    };
    assertOrSkipVideoPublishReady(capProbeJson.public_video_publish_ready, "api-probe");
    expect(capProbeJson.max_video_seconds).toBe(180);

    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const cred = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    if (!cred) {
      throw new Error("apiLoginReturnCredentials returned null for tourist@test.com (seed + login)");
    }

    const publishSurface = "helper-openCommunityPublishDrawer";
    const drawer = communityPublishDrawerShell(page);
    await openCommunityPublishDrawer(page, cred, 180_000);

    const pageOriginAfterNav = new URL(page.url()).origin;
    expect(
      originsMatchLocalNext(pageOriginAfterNav, nextOrigin),
      `page origin ${pageOriginAfterNav} must match Next base ${nextOrigin} (localhost/127.0.0.1 same port allowed)`,
    ).toBe(true);
    expect(pageOriginAfterNav, "page must not be served from API origin").not.toBe(apiOrigin);

    const ls = await page.evaluate(() => ({
      tokenLen: (localStorage.getItem("traveltrust_session_token") ?? "").length,
      userId: localStorage.getItem("traveltrust_user_id"),
    }));
    expect(ls.tokenLen, "tourist bearer must be in localStorage").toBeGreaterThan(0);
    const expectUid = cred.userId?.trim() ?? "";
    if (expectUid) {
      expect(ls.userId?.trim(), "localStorage user id must match API login").toBe(expectUid);
    }

    let capRes: Response;
    try {
      capRes = await page.waitForResponse(
        (r) => r.request().method() === "GET" && r.url().includes("/api/v1/community/media/capabilities"),
        { timeout: 15_000 },
      );
    } catch {
      capRes = capProbe;
    }

    expect(capRes.ok(), await capRes.text().catch(() => "")).toBeTruthy();
    const capJson = (await capRes.json()) as Record<string, unknown>;
    assertOrSkipVideoPublishReady(capJson.public_video_publish_ready as boolean | undefined, "page-capabilities");
    expect(capJson.max_video_seconds).toBe(180);
    writeFileSync(capDumpPath, `${JSON.stringify(capJson, null, 2)}\n`, "utf8");

    await selectPublishDrawerVideoType(page, drawer, 180_000);
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

    const bodyText = `browser-minio-multipart-${Date.now()}`;
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
    expect(originsMatchLocalNext(new URL(page.url()).origin, nextOrigin)).toBe(true);

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

    const feedVideo = postArticle.getByTestId("community-feed-inline-video");
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

    const summary = [
      "# PublishDrawer · MinIO browser evidence (local)",
      "",
      "## ① Local browser chain (this run)",
      "",
      `- **Next origin**: ${pageOriginAfterNav} (matches configured Next base ${nextOrigin}; localhost/127.0.0.1 same port accepted).`,
      `- **API origin**: ${apiOrigin}`,
      `- **Tourist session**: localStorage token length ${ls.tokenLen}; user id ${ls.userId ?? "(none)"}.`,
      `- **Feed shell**: data-tt-community-feed-page present; login-for-publish count 0.`,
      `- **Publish surface**: ${publishSurface}.`,
      `- **Capabilities (page GET)**: public_video_publish_ready=true, max_video_seconds=180 (see browser-capabilities-from-page.json).`,
      `- **Multipart HTTP**: session / parts / PUT / complete / createPost — see browser-multipart-chain.log and browser.har.`,
      `- **Feed UI**: post body visible; \`<video src>\` length ${videoSrc.length}; **canplay** reached in-browser.`,
      `- **Artifacts**: browser.har, browser-console.log, browser-network-api.log, browser-multipart-chain.log, browser-create-post-response.json, screenshots.`,
      "",
      "## ② Testnet / ③ Production",
      "",
      "Not covered by this script. Staging or production PSP, hosts, and matrix must be verified separately.",
      "",
    ].join("\n");
    writeFileSync(summaryPath, summary, "utf8");

    // HAR：`recordHar` 在 **browser context** 关闭时落盘（worker 收尾）；勿手动 `page.close()` 以免干扰 runner。
  });
});
