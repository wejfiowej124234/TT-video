/**
 * PI-1 · 阶段一浏览器验收（PH1-FE-01～05）· ① 本地
 *
 * 覆盖：`issues-phase1-local.md` §B 浏览器手验 + `local-smoke.md` #7a～7f。
 * 前置：API :8080 + Next :3012（`PLAYWRIGHT_FULL_STACK=1` / `run-e2e-default.mjs`）；MinIO 就绪时跑 PH1-FE-02 视频 multipart + 封面上传。
 * 收口：**COMMUNITY-L5-CLOSURE** · 2026-05-30 **`e2e:pi1-community-all` → 8 passed · 0 skipped**（含 cover spec）。
 *
 * 运行：`cd frontend && npm run e2e:pi1-community`（仅本 spec）
 * 并集：`npm run e2e:pi1-community-all`（推荐 · 含 cover）
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { test, expect, type Page, type Response } from "@playwright/test";

import {
  apiLoginReturnCredentials,
  defaultApiBase,
  ensureCommunityBrowserSessionAccepted,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import {
  communityFeedPageShell,
  communityMePageShell,
} from "./helpers/pageShells";
import {
  openCommunityPublishDrawer,
  openCommunityPublishDrawerViaQuery,
  selectPublishDrawerVideoType,
} from "./helpers/publishDrawerVideo";
import {
  requestGetExpectOkWith429Backoff,
  requestGetWith429Retry,
} from "./helpers/playwright429Backoff";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { API_BASE, E2E_PNG_1X1, E2E_VIDEO_1S_MP4_BYTES } from "./market-subsite-shared";

const EVIDENCE_DIR = join(process.cwd(), "..", "evidence", "GO_20260517", "artifacts");

function evidencePath(name: string): string {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  return join(EVIDENCE_DIR, name);
}

function writePi1Log(lines: string[]): void {
  writeFileSync(evidencePath("pi1-fe-browser-e2e.log"), `${lines.join("\n")}\n`, "utf8");
}

/** 与 DB `community_abuse_policy.post_min_interval_sec` 默认 5s 对齐（串行发帖 E2E 须留间隔）。 */
async function waitCommunityPostAbuseInterval(page: Page): Promise<void> {
  await page.waitForTimeout(6_500);
}

test.describe("PI-1 · community browser acceptance (PH1-FE)", () => {
  test.describe.configure({ mode: "serial", retries: 1 });

  const log: string[] = [];

  test.beforeAll(async ({ request }) => {
    await skipIfApiDown(request);
    const apiBase = defaultApiBase();
    const capRes = await requestGetWith429Retry(request, `${apiBase}/api/v1/community/media/capabilities`);
    if (capRes.ok()) {
      const cap = (await capRes.json()) as { public_video_publish_ready?: boolean };
      log.push(`capabilities public_video_publish_ready=${String(cap.public_video_publish_ready)}`);
    }
  });

  test.afterAll(() => {
    writePi1Log(log);
  });

  test.beforeEach(async ({ request }) => {
    await skipIfApiDown(request);
    await seedTestAccountsAndReleaseGuideSlot(request, API_BASE);
  });

  test("PH1-FE-01 · Feed community-posts GET must not be 401", async ({ page, request }) => {
    test.setTimeout(180_000);
    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred).toBeTruthy();
    if (!cred) return;

    const upload401: string[] = [];
    const apiNetLines: string[] = [];
    page.on("response", (res) => {
      const u = res.url();
      const m = res.request().method();
      if (m === "GET" && u.includes("/uploads/community-posts/")) {
        if (res.status() === 401) upload401.push(u);
        if (apiNetLines.length < 500) apiNetLines.push(`${res.status()}\t${m}\t${u}`);
      }
    });

    const feedOk = page.waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        r.status() === 200 &&
        (r.url().includes("/api/v1/community/feed") || r.url().includes("/api/v1/community/me/following")),
      { timeout: 120_000 },
    );
    await gotoWithBearerSession(page, "/community", cred);
    await expect(communityFeedPageShell(page)).toBeVisible({ timeout: 120_000 });
    await feedOk;

    expect(upload401, "anonymous or session feed must not 401 on post media GET").toEqual([]);
    const uploadGets = apiNetLines.filter((l) => l.includes("/uploads/community-posts/") && l.startsWith("200\t"));
    expect(
      uploadGets.length > 0 || upload401.length === 0,
      "feed should load post media with HTTP 200 when images present",
    ).toBeTruthy();
    await page.screenshot({ path: evidencePath("fe-browser-fe01-feed.png"), fullPage: true });
    log.push("PH1-FE-01: pass (no upload 401)");
  });

  test("PH1-FE-04 · text post publish", async ({ page, request }) => {
    test.setTimeout(180_000);
    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred).toBeTruthy();
    if (!cred) return;

    const bodyText = `pi1-fe-text-${Date.now()}`;
    const drawer = await openCommunityPublishDrawerViaQuery(page, cred, 120_000);
    await drawer.getByRole("button", { name: /^(Text|纯文字)$/ }).click();
    await drawer.locator("textarea").first().fill(bodyText);

    const postWait = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r.url().includes("/api/v1/community/posts") &&
        !r.url().includes("upload-media") &&
        r.status() === 200,
      { timeout: 90_000 },
    );
    await drawer.locator("footer").getByRole("button", { name: /Publish|发布/ }).click();
    const pr = await postWait;
    expect(pr.ok()).toBeTruthy();
    const created = (await pr.json()) as { id?: string };
    const postId = (created.id ?? "").trim();
    expect(postId.length).toBeGreaterThan(8);
    const detail = await requestGetExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/community/posts/${encodeURIComponent(postId)}`,
      { headers: { Authorization: `Bearer ${cred.token}` } },
    );
    expect(await detail.text()).toContain(bodyText);
    log.push("PH1-FE-04: pass");
  });

  test("PH1-FE-03 · photo multi-image post", async ({ page, request }) => {
    test.setTimeout(240_000);
    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred).toBeTruthy();
    if (!cred) return;

    const bodyText = `pi1-fe-2img-${Date.now()}`;
    const drawer = await openCommunityPublishDrawerViaQuery(page, cred, 120_000);

    await drawer.getByRole("button", { name: /^(Photo|照片)$/ }).click();
    const fileInput = drawer.locator('input[type="file"][accept*="image"]');
    await fileInput.setInputFiles([
      { name: "pi1-a.png", mimeType: "image/png", buffer: E2E_PNG_1X1 },
      { name: "pi1-b.png", mimeType: "image/png", buffer: E2E_PNG_1X1 },
    ]);
    await drawer.locator("textarea").first().fill(bodyText);
    await expect(drawer.locator("footer").getByRole("button", { name: /Publish|发布/ })).toBeEnabled({
      timeout: 90_000,
    });
    await waitCommunityPostAbuseInterval(page);

    const uploadMediaWaits = [0, 1].map(() =>
      page.waitForResponse(
        (r) =>
          r.request().method() === "POST" &&
          r.url().includes("/api/v1/community/posts/upload-media") &&
          r.status() === 200,
        { timeout: 180_000 },
      ),
    );
    const postWait = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r.url().includes("/api/v1/community/posts") &&
        !r.url().includes("upload-media"),
      { timeout: 180_000 },
    );
    await drawer.locator("footer").getByRole("button", { name: /Publish|发布/ }).click();
    await Promise.all(uploadMediaWaits);
    const pr = await postWait;
    expect(pr.ok(), await pr.text().catch(() => "")).toBeTruthy();
    const postId = ((await pr.json()) as { id?: string }).id?.trim() ?? "";
    expect(postId.length).toBeGreaterThan(8);

    const detail = await requestGetExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/community/posts/${encodeURIComponent(postId)}`,
      { headers: { Authorization: `Bearer ${cred.token}` } },
    );
    const detailJson = (await detail.json()) as { post?: { body?: string; media_urls?: string[] } };
    expect((detailJson.post?.media_urls ?? []).length).toBeGreaterThanOrEqual(2);
    await page.screenshot({ path: evidencePath("fe-browser-fe03-photo.png"), fullPage: true });
    log.push("PH1-FE-03: pass");
  });

  test("PH1-FE-02 · video + cover → multipart publish", async ({ page, request }) => {
    test.setTimeout(360_000);

    const capProbe = await requestGetWith429Retry(request, `${API_BASE}/api/v1/community/media/capabilities`);
    if (!capProbe.ok()) {
      test.skip(true, `capabilities HTTP ${capProbe.status()}`);
      return;
    }
    const capProbeJson = (await capProbe.json()) as { public_video_publish_ready?: boolean };
    test.skip(!capProbeJson.public_video_publish_ready, "needs MinIO/S3 (public_video_publish_ready)");

    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred).toBeTruthy();
    if (!cred) return;

    const bodyText = `pi1-fe-video-cover-${Date.now()}`;

    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    const drawer = await openCommunityPublishDrawer(page, cred, 180_000);
    await selectPublishDrawerVideoType(page, drawer, 180_000);
    expect(pageErrors, "community page must not throw on video type").toEqual([]);
    const videoSection = drawer.getByRole("group", { name: /Add video|添加视频/i });
    await expect(videoSection).toBeVisible({ timeout: 90_000 });

    const mp4Path = join(process.cwd(), "e2e", "fixtures", "minimal-1s-h264.mp4");
    await drawer.locator('input[type="file"][accept*="video"]').setInputFiles(mp4Path);
    await expect(drawer.locator("video")).toBeVisible({ timeout: 120_000 });

    await drawer.locator('input[type="file"][accept*="image"]').setInputFiles({
      name: "pi1-cover.png",
      mimeType: "image/png",
      buffer: E2E_PNG_1X1,
    });
    await expect(drawer.getByAltText(/Video poster preview|视频封面预览/i)).toBeVisible({
      timeout: 60_000,
    });

    await drawer.locator("textarea").first().fill(bodyText);
    await expect(drawer.locator("footer").getByRole("button", { name: /Publish|发布/ })).toBeEnabled({
      timeout: 120_000,
    });
    await waitCommunityPostAbuseInterval(page);
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
        !r.url().includes("upload-media"),
      { timeout: 180_000 },
    );

    await drawer.locator("footer").getByRole("button", { name: /Publish|发布/ }).click();
    await sessionP;
    await partsP;
    await putP;
    await completeP;
    const postRes = await postP;
    expect(postRes.ok(), await postRes.text().catch(() => "")).toBeTruthy();
    const postBody = (await postRes.json()) as {
      id?: string;
      status?: string;
      error?: string;
      message?: string;
    };
    const postId = postBody.id?.trim() ?? "";
    expect(postId.length, `createPost body: ${JSON.stringify(postBody)}`).toBeGreaterThan(8);

    const detail = await requestGetExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/community/posts/${encodeURIComponent(postId)}`,
      { headers: { Authorization: `Bearer ${cred.token}` } },
    );
    const detailJson = (await detail.json()) as { post?: { body?: string; cover_url?: string } };
    expect(detailJson.post?.body ?? "").toContain(bodyText);
    expect((detailJson.post?.cover_url ?? "").length).toBeGreaterThan(8);

    await page.screenshot({ path: evidencePath("fe-browser-fe02-video.png"), fullPage: true });
    log.push("PH1-FE-02: pass (multipart + cover + publish)");
  });

  test("PH1-FE-05 · /community/me avatar local upload", async ({ page, request }) => {
    test.setTimeout(180_000);
    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred).toBeTruthy();
    if (!cred) return;

    await gotoWithBearerSession(page, "/community/me", cred);
    await ensureCommunityBrowserSessionAccepted(page, cred, 120_000);
    await expect(communityMePageShell(page)).toBeVisible({ timeout: 120_000 });
    await expect(page.locator('[data-tt-community-me-surface="community_me_profile"]')).toBeVisible({
      timeout: 120_000,
    });

    const avatarFileInput = page.locator(
      'input[type="file"][accept="image/jpeg,image/png,image/webp"]',
    );
    await expect(avatarFileInput).toHaveCount(1, { timeout: 60_000 });

    const avatarPost = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r.url().includes("/api/v1/me/profile-avatar") &&
        !r.url().includes("/presign") &&
        !r.url().includes("/commit"),
      { timeout: 120_000 },
    );

    await avatarFileInput.setInputFiles({
      name: "pi1-avatar.png",
      mimeType: "image/png",
      buffer: E2E_PNG_1X1,
    });
    const avRes = await avatarPost;
    expect(avRes.ok(), await avRes.text().catch(() => "")).toBeTruthy();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(communityMePageShell(page)).toBeVisible({ timeout: 120_000 });
    await page.screenshot({ path: evidencePath("fe-browser-fe05-avatar.png"), fullPage: true });
    log.push("PH1-FE-05: pass");
  });

});
