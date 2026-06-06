/**
 * G-01 · 社区子路由登录态数据链 E2E（Phase ① · 无 UI 变更）
 *
 * 运行：`cd frontend && npm run e2e:community-subroutes-data`
 */
import { test, expect } from "@playwright/test";

import {
  ensureCommunityBrowserSessionAccepted,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import { resolveSeedUserId } from "./helpers/communitySocialFlow";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import {
  communityActivityPageShell,
  communityExplorePageShell,
  communityFeedbackPageShell,
  communityMeCollectsPageShell,
  communityMePostsPageShell,
  communityMeReportsPageShell,
  communityUserPageShell,
} from "./helpers/pageShells";
import { API_BASE } from "./market-subsite-shared";

type DataCase = {
  label: string;
  path: string | ((guideUserId: string) => string);
  shell: (page: import("@playwright/test").Page) => import("@playwright/test").Locator;
  waitApi: (page: import("@playwright/test").Page) => Promise<import("@playwright/test").Response>;
};

function waitGet200(pathFragment: string) {
  return (page: import("@playwright/test").Page) =>
    page.waitForResponse(
      (r) => {
        if (r.request().method() !== "GET" || r.status() !== 200) return false;
        try {
          return new URL(r.url()).pathname.includes(pathFragment);
        } catch {
          return r.url().includes(pathFragment);
        }
      },
      { timeout: 90_000 },
    );
}

const DATA_CASES: DataCase[] = [
  {
    label: "Explore feed",
    path: "/community/explore",
    shell: communityExplorePageShell,
    waitApi: waitGet200("/api/v1/community/feed"),
  },
  {
    label: "Activity likes received",
    path: "/community/activity",
    shell: communityActivityPageShell,
    waitApi: waitGet200("/api/v1/community/me/likes-received"),
  },
  {
    label: "Me posts",
    path: "/community/me/posts",
    shell: communityMePostsPageShell,
    waitApi: waitGet200("/api/v1/community/me/posts"),
  },
  {
    label: "Me collects",
    path: "/community/me/collects",
    shell: communityMeCollectsPageShell,
    waitApi: waitGet200("/api/v1/community/me/collects"),
  },
  {
    label: "Me reports",
    path: "/community/me/reports",
    shell: communityMeReportsPageShell,
    waitApi: waitGet200("/api/v1/community/me/reports"),
  },
  {
    label: "Feedback list",
    path: "/community/feedback",
    shell: communityFeedbackPageShell,
    waitApi: waitGet200("/api/v1/community/feedback"),
  },
  {
    label: "User profile posts",
    path: (guideId) => `/community/user/${guideId}`,
    shell: communityUserPageShell,
    waitApi: waitGet200("/api/v1/community/users/"),
  },
];

test.describe("community sub-routes data (G-01 · ①)", () => {
  test.describe.configure({ mode: "serial", retries: 1 });

  test.beforeEach(async ({ request }) => {
    await skipIfApiDown(request);
    await seedTestAccountsAndReleaseGuideSlot(request, API_BASE);
  });

  for (const c of DATA_CASES) {
    test(`COM-G01-DATA · ${c.label}`, async ({ page, request }) => {
      test.setTimeout(120_000);
      const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
      const guide = await resolveSeedUserId(request, API_BASE, "guide@test.com");
      expect(tourist).toBeTruthy();
      expect(guide).toBeTruthy();
      if (!tourist || !guide) return;

      const path = typeof c.path === "function" ? c.path(guide.userId) : c.path;
      const apiWait = c.waitApi(page);
      await gotoWithBearerSession(page, path, tourist);
      await expect(c.shell(page)).toBeVisible({ timeout: 30_000 });
      await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);
      if (c.label === "Explore feed") {
        const feedWait = c.waitApi(page);
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(c.shell(page)).toBeVisible({ timeout: 30_000 });
        const res = await feedWait;
        expect(res.ok()).toBeTruthy();
        return;
      }
      const res = await apiWait;
      expect(res.ok()).toBeTruthy();
    });
  }
});
