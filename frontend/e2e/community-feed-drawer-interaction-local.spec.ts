/**
 * ① 本地 · Feed 抽屉交互：帮助与支持 portal、PostDetail 评论输入、全帖上下切帖。
 *
 * 运行：`cd frontend && npm run e2e:community-feed-drawer-interaction`
 * 全量烟测：`bash scripts/dev/smoke-community-feed-drawer-local.sh`（vitest + 本 spec）
 *
 * 依赖：Next :3012 + API seed（`tourist@test.com`）；**非** ②③ GO。
 */
import { test, expect } from "@playwright/test";

import {
  apiLoginReturnCredentials,
  defaultApiBase,
  ensureCommunityBrowserSessionAccepted,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import {
  SHOWCASE_POST_A,
  installShowcaseFeedMocks,
  openShowcasePostDeepLink,
  showcaseAuthWaitMs,
  showcaseDrawerTimeoutMs,
  showcaseSpecTimeoutMs,
} from "./helpers/communityShowcasePostDetail";
import { communityPostDetailDrawerShell } from "./helpers/pageShells";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { gotoSmoke } from "./helpers/smoke-nav";

const API_BASE = defaultApiBase();

test.describe("community feed drawer interaction · local (①)", () => {
  test.describe.configure({
    mode: "serial",
    retries: process.env.CI === "true" ? 1 : 0,
    timeout: showcaseSpecTimeoutMs,
  });

  test.use({ viewport: { width: 1280, height: 900 } });

  test("COM-FEED-01 · support menu portal opens on desktop feed", async ({ page }) => {
    await gotoSmoke(page, "/community");
    const trigger = page.locator('[data-testid="community-support-menu-trigger"]:visible').first();
    await expect(trigger).toBeVisible({ timeout: 45_000 });
    await trigger.click();
    const panel = page.getByTestId("community-support-menu-panel");
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await expect(panel.getByRole("menuitem", { name: /Help|帮助/i })).toBeVisible();
  });

  test("COM-FEED-02 · logged-in PostDetail composer accepts text and send (showcase)", async ({
    page,
    request,
  }) => {
    await skipIfApiDown(request);
    await seedTestAccountsAndReleaseGuideSlot(request, API_BASE);
    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred).toBeTruthy();
    if (!cred) return;

    await page.route("**/api/v1/community/posts/**/comments**", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ status: "error", message: "invalid_post" }),
        });
        return;
      }
      await route.continue();
    });

    await installShowcaseFeedMocks(page);
    await gotoWithBearerSession(page, "/community", {
      token: cred.token,
      userId: cred.userId ?? "",
    });

    const drawer = await openShowcasePostDeepLink(page, SHOWCASE_POST_A);
    await expect(drawer).toBeVisible({ timeout: showcaseDrawerTimeoutMs });
    await ensureCommunityBrowserSessionAccepted(page, cred, showcaseAuthWaitMs);

    await expect(drawer.getByText(/演示帖|Demo post/i).first()).toBeVisible({ timeout: 10_000 });

    const composer = drawer.getByTestId("community-post-detail-composer-input");
    await expect(composer).toBeEnabled({ timeout: 15_000 });
    await composer.fill("e2e showcase comment");

    const sendBtn = drawer.getByRole("button", { name: /^发送$|^Send$/i });
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();

    await expect(page.getByText(/演示评论|Demo comment/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(drawer.getByText("e2e showcase comment")).toBeVisible({ timeout: 10_000 });
    await expect(drawer.getByTestId("community-comment-author-name").first()).toBeVisible({ timeout: 10_000 });
    await expect(drawer.getByTestId("community-comment-author-avatar").first()).toBeVisible({ timeout: 10_000 });
  });

  test("COM-FEED-03 · all-post vertical feed switches between showcase posts", async ({ page }) => {
    const showcaseNext = "tt-showcase-post-002";
    await installShowcaseFeedMocks(page);
    await gotoSmoke(page, `/community?post=${SHOWCASE_POST_A}`);
    const drawer = communityPostDetailDrawerShell(page);
    await expect(drawer).toBeVisible({ timeout: showcaseDrawerTimeoutMs });
    await expect(drawer).toHaveAttribute("data-post-id", SHOWCASE_POST_A);

    const mediaRegion = drawer.getByRole("region", { name: /community_feed_nav|carousel|切帖|轮播/i }).first();
    await mediaRegion.focus();
    await page.keyboard.press("ArrowDown");

    await expect(drawer).toHaveAttribute("data-post-id", showcaseNext, { timeout: 15_000 });

    await page.keyboard.press("ArrowUp");
    await expect(drawer).toHaveAttribute("data-post-id", SHOWCASE_POST_A, { timeout: 15_000 });
  });
});
