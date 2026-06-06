/**
 * 94/31 · 社区 **Feed / PublishDrawer** 门禁与 **Market→社区** 导航。
 * 入口：`market-subsite-studio-and-community-publish.spec.ts`。
 */
import { test, expect } from "@playwright/test";
import {
  apiLoginReturnCredentials,
  clearBearerSessionInBrowser,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import {
  communityFeedPageShell,
  communityFeedPublishEntryShell,
  communityPublishDrawerShell,
  marketPageShell,
} from "./helpers/pageShells";
import {
  requestGetExpectOkWith429Backoff,
  requestGetWith429Retry,
} from "./helpers/playwright429Backoff";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { reloadSmoke } from "./helpers/smoke-nav";
import { API_BASE } from "./market-subsite-shared";

test.describe("94/31 · community Feed + PublishDrawer gates + market nav", () => {
  test.describe.configure({ retries: 2 });

  test.beforeEach(async ({ request }) => {
    await skipIfApiDown(request);
    await seedTestAccountsAndReleaseGuideSlot(request, API_BASE);
  });

  test("community Feed: text post via ?publish=1 → POST + GET body", async ({ page, request }) => {
    test.setTimeout(180_000);

    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred, "login tourist@test.com").toBeTruthy();
    if (!cred) return;

    const bodyText = `e2e-com-text-${Date.now()}`;

    await gotoWithBearerSession(page, "/community?publish=1", cred);
    const pubDrawer = communityPublishDrawerShell(page);
    await expect(pubDrawer).toBeVisible({ timeout: 90_000 });

    await pubDrawer.getByRole("button", { name: /^(Text|纯文字)$/ }).click();
    await pubDrawer.locator("textarea").first().fill(bodyText);

    const postWait = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r.url().includes("/api/v1/community/posts") &&
        !r.url().includes("upload-media") &&
        r.status() === 200,
      { timeout: 90_000 },
    );
    await pubDrawer.locator("footer").getByRole("button", { name: /Publish|发布/ }).click();
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
    const detailJson = (await detail.json()) as { status?: string; post?: { body?: string } };
    expect(detailJson.status).toBe("ok");
    expect(detailJson.post?.body ?? "").toContain(bodyText);
  });

  test("community PublishDrawer: session cleared while open shows login ActionGate", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);

    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred).toBeTruthy();
    if (!cred) return;

    await gotoWithBearerSession(page, "/community?publish=1", cred);
    const pubDrawer = communityPublishDrawerShell(page);
    await expect(pubDrawer).toBeVisible({ timeout: 90_000 });

    await pubDrawer.getByRole("button", { name: /^(Text|纯文字)$/ }).click();
    await pubDrawer.locator("textarea").first().fill(`e2e-session-drop-${Date.now()}`);

    await expect(pubDrawer.locator("footer").getByRole("button", { name: /Publish|发布/ })).toBeEnabled({
      timeout: 90_000,
    });

    await clearBearerSessionInBrowser(page);

    await expect(pubDrawer.getByText(/Sign in first|请先登录/i)).toBeVisible({ timeout: 90_000 });
    await expect(pubDrawer.getByText(/Before publishing|发布前请完成/i)).toBeVisible();
    await expect(pubDrawer.locator("footer").getByRole("button", { name: /Publish|发布/ })).toBeDisabled();
  });

  test("community PublishDrawer: photo mode without images after session clear lists login + photo gates", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);

    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred).toBeTruthy();
    if (!cred) return;

    await gotoWithBearerSession(page, "/community?publish=1", cred);
    const pubDrawer = communityPublishDrawerShell(page);
    await expect(pubDrawer).toBeVisible({ timeout: 90_000 });

    await pubDrawer.getByRole("button", { name: /^(Photo|照片)$/ }).click();
    await pubDrawer.locator("textarea").first().fill(`e2e-photo-dual-gate-${Date.now()}`);

    await expect(
      pubDrawer.getByText(/In Photo mode, add at least one|在「照片」模式下至少选择一张/i),
    ).toBeVisible({ timeout: 90_000 });
    await expect(pubDrawer.locator("footer").getByRole("button", { name: /Publish|发布/ })).toBeDisabled();

    await clearBearerSessionInBrowser(page);

    await expect(pubDrawer.getByText(/Sign in first|请先登录/i)).toBeVisible({ timeout: 90_000 });
    await expect(
      pubDrawer.getByText(/In Photo mode, add at least one|在「照片」模式下至少选择一张/i),
    ).toBeVisible();
    await expect(pubDrawer.locator("footer").getByRole("button", { name: /Publish|发布/ })).toBeDisabled();
  });

  test("community PublishDrawer: video mode without preview after session clear lists login + video gates", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);

    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred).toBeTruthy();
    if (!cred) return;

    /** 与 **`PublishDrawer`** **`videoTypeDisabled`** 同源：`public_video_publish_ready` 假时「视频」永禁用（本地无 S3 / HeadBucket 非错）。 */
    const capRes = await requestGetWith429Retry(request, `${API_BASE}/api/v1/community/media/capabilities`);
    if (!capRes.ok()) {
      test.skip(true, `GET /api/v1/community/media/capabilities HTTP ${capRes.status()} (need API for video E2E)`);
      return;
    }
    const capJson = (await capRes.json()) as { public_video_publish_ready?: boolean };
    if (!capJson.public_video_publish_ready) {
      test.skip(
        true,
        "public_video_publish_ready=false (object storage / HeadBucket); video tab disabled by design — see docs/runbook/COMMUNITY-MEDIA-OBJECT-STORAGE.md",
      );
      return;
    }

    await gotoWithBearerSession(page, "/community?publish=1", cred);
    const pubDrawer = communityPublishDrawerShell(page);
    await expect(pubDrawer).toBeVisible({ timeout: 90_000 });

    await pubDrawer.getByRole("button", { name: /^(Video|视频)$/ }).click();
    await pubDrawer.locator("textarea").first().fill(`e2e-video-dual-gate-${Date.now()}`);

    await expect(
      pubDrawer.getByText(/In Video mode, pick a local|在「视频」模式下选择本地视频/i),
    ).toBeVisible({ timeout: 90_000 });
    await expect(pubDrawer.locator("footer").getByRole("button", { name: /Publish|发布/ })).toBeDisabled();

    await clearBearerSessionInBrowser(page);

    await expect(pubDrawer.getByText(/Sign in first|请先登录/i)).toBeVisible({ timeout: 90_000 });
    await expect(
      pubDrawer.getByText(/In Video mode, pick a local|在「视频」模式下选择本地视频/i),
    ).toBeVisible();
    await expect(pubDrawer.locator("footer").getByRole("button", { name: /Publish|发布/ })).toBeDisabled();
  });

  test("Market → TT 社区 → Feed 发布入口打开 PublishDrawer", async ({ page, request }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1400, height: 900 });

    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred).toBeTruthy();
    if (!cred) return;

    await gotoWithBearerSession(page, "/market", cred);
    const marketShell = marketPageShell(page);
    await expect(marketShell).toBeVisible({ timeout: 90_000 });
    /** 顶栏 **`Header`** 在 **`layout`** 内，不在 **`main[data-tt-market-page]`** 中 */
    const toCommunity = page.locator("header").getByRole("link", { name: /TT Community|TT社区/i });
    await expect(toCommunity).toBeVisible({ timeout: 90_000 });
    expect(await toCommunity.getAttribute("href")).toBe("/community");
    await toCommunity.evaluate((el) => (el as HTMLAnchorElement).click());
    const feedShell = communityFeedPageShell(page);
    await expect(feedShell).toBeVisible({ timeout: 90_000 });
    await communityFeedPublishEntryShell(feedShell).click({ force: true });
    await expect(communityPublishDrawerShell(page)).toBeVisible({ timeout: 90_000 });
  });
});

