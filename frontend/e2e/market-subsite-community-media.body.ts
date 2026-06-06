/**
 * 94/31 · 社区 **上传发帖**（含 **`post_min_interval_sec`** 顺序依赖：与本 `describe` 内用例顺序一致）。
 * 入口：`market-subsite-studio-and-community-publish.spec.ts`。
 */
import { test, expect } from "@playwright/test";
import {
  apiLoginReturnCredentials,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import { communityPublishDrawerShell } from "./helpers/pageShells";
import {
  requestGetExpectOkWith429Backoff,
  requestGetWith429Retry,
} from "./helpers/playwright429Backoff";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { reloadSmoke } from "./helpers/smoke-nav";
import { API_BASE, E2E_PNG_1X1, E2E_VIDEO_1S_MP4_BYTES } from "./market-subsite-shared";

test.describe("94/31 · community media uploads (photo / video / multi)", () => {
  test.describe.configure({ retries: 2 });

  test.beforeEach(async ({ request }) => {
    await skipIfApiDown(request);
    await seedTestAccountsAndReleaseGuideSlot(request, API_BASE);
  });

  test("community Feed: photo post with tiny PNG → upload-media + POST + GET", async ({ page, request }) => {
    test.setTimeout(180_000);

    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred, "login tourist@test.com").toBeTruthy();
    if (!cred) return;

    const bodyText = `e2e-com-photo-${Date.now()}`;

    await gotoWithBearerSession(page, "/community?publish=1", cred);
    const pubDrawer = communityPublishDrawerShell(page);
    await expect(pubDrawer).toBeVisible({ timeout: 90_000 });

    await pubDrawer.getByRole("button", { name: /^(Photo|照片)$/ }).click();
    const fileInput = pubDrawer.locator('input[type="file"][accept*="image"]');
    await fileInput.setInputFiles({
      name: "e2e-one-pixel.png",
      mimeType: "image/png",
      buffer: E2E_PNG_1X1,
    });
    await pubDrawer.locator("textarea").first().fill(bodyText);
    await expect(pubDrawer.locator("footer").getByRole("button", { name: /Publish|发布/ })).toBeEnabled({
      timeout: 90_000,
    });

    const uploadWait = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r.url().includes("/api/v1/community/posts/upload-media") &&
        r.status() === 200,
      { timeout: 120_000 },
    );
    const postWait = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r.url().includes("/api/v1/community/posts") &&
        !r.url().includes("upload-media") &&
        r.status() === 200,
      { timeout: 120_000 },
    );

    await pubDrawer.locator("footer").getByRole("button", { name: /Publish|发布/ }).click();
    const up = await uploadWait;
    expect(up.ok(), await up.text()).toBeTruthy();
    const pr = await postWait;
    expect(pr.ok(), await pr.text()).toBeTruthy();
    const created = (await pr.json()) as { id?: string; status?: string };
    const postId = (created.id ?? "").trim();
    expect(postId.length).toBeGreaterThan(8);

    const detail = await requestGetExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/community/posts/${encodeURIComponent(postId)}`,
      { headers: { Authorization: `Bearer ${cred.token}` } },
    );
    const detailText = await detail.text();
    expect(detailText).toContain(bodyText);
  });

  test("community Feed: video post tiny MP4 → upload-media + POST + GET", async ({ page, request }) => {
    test.setTimeout(180_000);

    const capRes = await requestGetWith429Retry(request, `${API_BASE}/api/v1/community/media/capabilities`);
    if (!capRes.ok()) {
      test.skip(
        true,
        `GET /api/v1/community/media/capabilities HTTP ${capRes.status()} (need API for video E2E)`,
      );
      return;
    }
    const cap = (await capRes.json()) as { public_video_publish_ready?: boolean };
    test.skip(!cap.public_video_publish_ready, "video E2E requires S3/R2 pipeline (public_video_publish_ready)");

    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred, "login tourist@test.com").toBeTruthy();
    if (!cred) return;

    const bodyText = `e2e-com-video-${Date.now()}`;

    await gotoWithBearerSession(page, "/community?publish=1", cred);
    const pubDrawer = communityPublishDrawerShell(page);
    await expect(pubDrawer).toBeVisible({ timeout: 90_000 });

    await pubDrawer.getByRole("button", { name: /^(Video|视频)$/ }).click();
    const videoInput = pubDrawer.locator('input[type="file"][accept*="video"]');
    await videoInput.setInputFiles({
      name: "e2e-1s.mp4",
      mimeType: "video/mp4",
      buffer: E2E_VIDEO_1S_MP4_BYTES,
    });
    await expect(pubDrawer.locator("video")).toBeVisible({ timeout: 90_000 });
    await pubDrawer.locator("textarea").first().fill(bodyText);
    await expect(pubDrawer.locator("footer").getByRole("button", { name: /Publish|发布/ })).toBeEnabled({
      timeout: 90_000,
    });

    // Same user as prior **photo** post in this file: `community_abuse_policy.post_min_interval_sec` defaults to **5s**（冷机略加长）。
    await page.waitForTimeout(7_500);

    const uploadWait = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r.url().includes("/api/v1/community/posts/upload-media") &&
        r.status() === 200,
      { timeout: 120_000 },
    );
    const postWait = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r.url().includes("/api/v1/community/posts") &&
        !r.url().includes("upload-media") &&
        r.status() === 200,
      { timeout: 120_000 },
    );

    await pubDrawer.locator("footer").getByRole("button", { name: /Publish|发布/ }).click();
    const up = await uploadWait;
    expect(up.ok(), await up.text()).toBeTruthy();
    const pr = await postWait;
    expect(pr.ok(), await pr.text()).toBeTruthy();
    const created = (await pr.json()) as { id?: string; status?: string };
    const postId = (created.id ?? "").trim();
    expect(postId.length).toBeGreaterThan(8);

    const detail = await requestGetExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/community/posts/${encodeURIComponent(postId)}`,
      { headers: { Authorization: `Bearer ${cred.token}` } },
    );
    expect(await detail.text()).toContain(bodyText);
  });

  test("community PublishDrawer: video type loads capabilities hint (MP4/WebM)", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);

    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred).toBeTruthy();
    if (!cred) return;

    const capProbe = await requestGetWith429Retry(request, `${API_BASE}/api/v1/community/media/capabilities`);
    if (!capProbe.ok()) {
      test.skip(
        true,
        `GET /api/v1/community/media/capabilities HTTP ${capProbe.status()} (need API for capabilities hint E2E)`,
      );
      return;
    }
    const capJson = (await capProbe.json()) as { public_video_publish_ready?: boolean };
    const videoReady = Boolean(capJson.public_video_publish_ready);

    const capWait = page.waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        r.url().includes("/api/v1/community/media/capabilities") &&
        r.ok(),
      { timeout: 90_000 },
    );

    await gotoWithBearerSession(page, "/community?publish=1", cred);
    await capWait;
    const pubDrawerV = communityPublishDrawerShell(page);
    await expect(pubDrawerV).toBeVisible({ timeout: 90_000 });
    if (videoReady) {
      await pubDrawerV.getByRole("button", { name: /^(Video|视频)$/ }).click();
      await expect(pubDrawerV.getByText(/MP4|WebM|秒|multipart|分片|MB/i)).toBeVisible({
        timeout: 90_000,
      });
    } else {
      await expect(pubDrawerV.getByText(/对象存储未启用|Object storage is not enabled/i)).toBeVisible({
        timeout: 90_000,
      });
      await expect(pubDrawerV.getByRole("button", { name: /^(Video|视频)$/ })).toBeDisabled();
    }
  });

  test("community Feed: two tiny PNGs → upload-media ×2 + POST + GET (media_urls ≥ 2)", async ({
    page,
    request,
  }) => {
    test.setTimeout(240_000);

    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred, "login tourist@test.com").toBeTruthy();
    if (!cred) return;

    const bodyText = `e2e-com-2img-${Date.now()}`;

    await gotoWithBearerSession(page, "/community?publish=1", cred);
    const pubDrawer = communityPublishDrawerShell(page);
    await expect(pubDrawer).toBeVisible({ timeout: 90_000 });
    /** 上一条真实发帖为同文件内 **视频** 用例；中间「仅切 Video 类型」用例不发帖，须在此显式等满 `post_min_interval_sec`（默认 5s + 冷机余量）。 */
    await page.waitForTimeout(9_000);

    await pubDrawer.getByRole("button", { name: /^(Photo|照片)$/ }).click();
    const fileInput = pubDrawer.locator('input[type="file"][accept*="image"]');
    await fileInput.setInputFiles([
      { name: "e2e-two-a.png", mimeType: "image/png", buffer: E2E_PNG_1X1 },
      { name: "e2e-two-b.png", mimeType: "image/png", buffer: E2E_PNG_1X1 },
    ]);
    await pubDrawer.locator("textarea").first().fill(bodyText);
    await expect(pubDrawer.locator("footer").getByRole("button", { name: /Publish|发布/ })).toBeEnabled({
      timeout: 90_000,
    });

    const upload1 = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r.url().includes("/api/v1/community/posts/upload-media") &&
        r.status() === 200,
      { timeout: 120_000 },
    );
    const upload2 = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r.url().includes("/api/v1/community/posts/upload-media") &&
        r.status() === 200,
      { timeout: 120_000 },
    );
    const postWait = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r.url().includes("/api/v1/community/posts") &&
        !r.url().includes("upload-media") &&
        r.status() === 200,
      { timeout: 120_000 },
    );

    await pubDrawer.locator("footer").getByRole("button", { name: /Publish|发布/ }).click();
    const u1 = await upload1;
    expect(u1.ok(), await u1.text()).toBeTruthy();
    const u2 = await upload2;
    expect(u2.ok(), await u2.text()).toBeTruthy();
    const pr = await postWait;
    expect(pr.ok(), await pr.text()).toBeTruthy();
    const created = (await pr.json()) as { id?: string; status?: string };
    const postId = (created.id ?? "").trim();
    expect(postId.length).toBeGreaterThan(8);

    const detail = await requestGetExpectOkWith429Backoff(
      request,
      `${API_BASE}/api/v1/community/posts/${encodeURIComponent(postId)}`,
      { headers: { Authorization: `Bearer ${cred.token}` } },
    );
    const detailJson = (await detail.json()) as {
      status?: string;
      post?: { body?: string; media_urls?: string[] };
    };
    expect(detailJson.status).toBe("ok");
    expect(detailJson.post?.body ?? "").toContain(bodyText);
    expect((detailJson.post?.media_urls ?? []).length).toBeGreaterThanOrEqual(2);
  });
});

