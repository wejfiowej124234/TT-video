/**
 * `/community/me?tab=` · 已登录 Scheme A 重定向矩阵（① 本地）
 *
 * 与 `community-me-l5-local-gate.v1.json` → `hub_tab_redirects` 对拍。
 *
 * `PLAYWRIGHT_FULL_STACK=1 npx playwright test e2e/community-me-hub-tab-redirect-matrix.spec.ts --project=chromium`
 */
import { test, expect } from "@playwright/test";
import {
  apiLoginReturnCredentials,
  defaultApiBase,
  ensureCommunityBrowserSessionAccepted,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { likesListEnabledForPlaywright } from "./helpers/communityMeLegacyRedirects";
import {
  communityMeCollectsPageShell,
  communityMeLikesPageShell,
  communityMeNotesDrawerShell,
  communityMePostsPageShell,
} from "./helpers/pageShells";

const API_BASE = defaultApiBase();

/** SSOT：`community-me-l5-local-gate.v1.json` hub_tab_redirects */
const TAB_REDIRECT_MATRIX = [
  { tab: "posts", urlPattern: /\/community\/me\/posts/ },
  { tab: "community_posts", urlPattern: /\/community\/me\/posts/ },
  { tab: "collects", urlPattern: /\/community\/me\/collects/ },
  { tab: "likes", urlPattern: /\/community\/me\/likes/, requiresLikesFlag: true },
  { tab: "orders", urlPattern: /\/orders/ },
] as const;

test.describe.serial("/community/me hub ?tab= redirect matrix (logged-in)", () => {
  test.describe.configure({ timeout: 150_000 });

  test.beforeEach(async ({ request }) => {
    await skipIfApiDown(request);
    await seedTestAccountsAndReleaseGuideSlot(request, API_BASE);
  });

  for (const row of TAB_REDIRECT_MATRIX) {
    test(`?tab=${row.tab} redirects to dedicated page`, async ({ page, request }) => {
      if ("requiresLikesFlag" in row && row.requiresLikesFlag) {
        test.skip(!likesListEnabledForPlaywright(), "likes list disabled by NEXT_PUBLIC_COMMUNITY_ME_LIKES_LIST");
      }

      const creds = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
      test.skip(!creds?.token, "tourist session required");

      await gotoWithBearerSession(page, `/community/me?tab=${row.tab}&utm=e2e-matrix`, creds);
      await ensureCommunityBrowserSessionAccepted(page, creds, 90_000);

      await expect(page).toHaveURL(row.urlPattern, { timeout: 90_000 });
      await expect(communityMeNotesDrawerShell(page)).toBeHidden({ timeout: 10_000 });

      if (row.tab === "posts" || row.tab === "community_posts") {
        await expect(communityMePostsPageShell(page)).toBeVisible({ timeout: 25_000 });
      } else if (row.tab === "collects") {
        await expect(communityMeCollectsPageShell(page)).toBeVisible({ timeout: 25_000 });
      } else if (row.tab === "likes") {
        await expect(communityMeLikesPageShell(page)).toBeVisible({ timeout: 25_000 });
      }
    });
  }

  test("?tab=likes with flag off strips tab and stays on hub", async ({ page, request }) => {
    test.skip(likesListEnabledForPlaywright(), "likes flag on — use dedicated redirect case instead");

    const creds = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    test.skip(!creds?.token, "tourist session required");

    await gotoWithBearerSession(page, "/community/me?tab=likes", creds);
    await expect(page).toHaveURL(/\/community\/me(?:\?|$)/, { timeout: 90_000 });
    await expect(page).not.toHaveURL(/tab=likes/);
    await expect(communityMeLikesPageShell(page)).toHaveCount(0);
  });
});
