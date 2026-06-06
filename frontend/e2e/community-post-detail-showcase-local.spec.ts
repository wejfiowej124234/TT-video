/**
 * ① 本地 · showcase 帖 PostDetailDrawer：演示标识、多图 carousel reset、点赞不调 API。
 *
 * 推荐复跑（稳定性门禁 · 与 `run-community-phase1-local-evidence.sh` 同源）：
 *   `cd frontend && npm run e2e:community-post-detail-showcase`
 *
 * 连跑 3 遍烟测：`npm run e2e:community-post-detail-showcase:stability`
 *
 * 依赖：Next dev + 空 Feed mock；`PLAYWRIGHT_E2E_STABILITY=1` 时 baseURL 默认 `localhost:3012`（避免 127.0.0.1 cross-host flake）。
 * **非** ②③ GO。
 */
import { test, expect } from "@playwright/test";

import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import {
  SHOWCASE_POST_A,
  SHOWCASE_POST_B,
  expectShowcaseDrawerLikeReady,
  expectShowcaseDrawerMarkers,
  expectShowcaseImageCounter,
  installShowcaseFeedMocks,
  openShowcasePostDeepLink,
  showcaseSpecTimeoutMs,
} from "./helpers/communityShowcasePostDetail";
import { skipIfApiDown } from "./helpers/skipIfApiDown";

const API_BASE = defaultApiBase();

test.describe("community post detail · showcase local (①)", () => {
  test.describe.configure({
    mode: "serial",
    retries: process.env.PLAYWRIGHT_E2E_STABILITY === "1" || process.env.CI === "true" ? 2 : 1,
    timeout: showcaseSpecTimeoutMs,
  });

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("about:blank");
    await installShowcaseFeedMocks(page);
  });

  test("showcase deep link shows demo badge and hint", async ({ page }) => {
    const drawer = await openShowcasePostDeepLink(page, SHOWCASE_POST_A);
    await expectShowcaseDrawerMarkers(page, drawer);
  });

  test("multi-image carousel resets when switching showcase posts", async ({ page }) => {
    const drawerA = await openShowcasePostDeepLink(page, SHOWCASE_POST_A);
    await expectShowcaseImageCounter(drawerA, "1 /");

    const nextBtn = drawerA.getByRole("button", { name: /Next image|下一张|下一/i });
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await expectShowcaseImageCounter(drawerA, "2 /");
    }

    const drawerB = await openShowcasePostDeepLink(page, SHOWCASE_POST_B);
    await expectShowcaseImageCounter(drawerB, "1 /");
  });

  test("showcase like does not POST to API when logged in", async ({ page, request }) => {
    test.setTimeout(180_000);

    await skipIfApiDown(request);
    await seedTestAccountsAndReleaseGuideSlot(request, API_BASE);

    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred).toBeTruthy();
    if (!cred) return;

    let likeApiHit = false;
    await page.route("**/api/v1/community/posts/**/like**", async (route) => {
      if (route.request().method() === "POST") likeApiHit = true;
      await route.continue();
    });

    await gotoWithBearerSession(page, "/community", {
      token: cred.token,
      userId: cred.userId ?? "",
    });

    const drawer = await openShowcasePostDeepLink(page, SHOWCASE_POST_A);
    const likeBtn = await expectShowcaseDrawerLikeReady(page, drawer, cred);

    const svgBefore = likeBtn.locator("svg").first();
    const fillBefore = (await svgBefore.getAttribute("fill")) ?? "";

    await likeBtn.click();

    await expect
      .poll(() => likeApiHit, { timeout: 3_000, intervals: [100, 200, 400] })
      .toBe(false);

    await expect
      .poll(async () => (await svgBefore.getAttribute("fill")) ?? "", { timeout: 5_000 })
      .not.toBe(fillBefore);
  });
});
