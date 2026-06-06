/**
 * TT 社区 · 子路由 L5 机读锚点 E2E（Phase ①）
 *
 * 与 `app/community/communitySubRoutes.contract.test.ts` · `test-utils/dataTtSelectors.ts` 同源。
 * 运行：`cd frontend && npm run e2e:community-subroutes-l5`
 */
import { test, expect } from "@playwright/test";

import { dataTt } from "../test-utils/dataTtSelectors";
import { gotoSmoke } from "./helpers/smoke-nav";

type MarkerCase = {
  label: string;
  path: string;
  selector: string;
  /** 重定向后期望最终 URL 片段 */
  finalUrlIncludes?: string;
};

const MARKER_CASES: MarkerCase[] = [
  { label: "Feed", path: "/community", selector: dataTt.communityFeedPage },
  { label: "TT intro", path: "/community/tt", selector: dataTt.communityTtPage },
  { label: "Explore", path: "/community/explore", selector: dataTt.communityExplorePage },
  { label: "Activity", path: "/community/activity", selector: dataTt.communityActivityPage },
  { label: "Friends", path: "/community/friends", selector: dataTt.communityFriendsPage },
  { label: "Messages", path: "/community/messages", selector: dataTt.communityMessagesPage },
  {
    label: "Message thread",
    path: "/community/messages/00000000-0000-4000-8000-000000000001",
    selector: dataTt.communityMessagesThreadPage,
  },
  { label: "Me hub", path: "/community/me", selector: dataTt.communityMePage },
  { label: "Me posts", path: "/community/me/posts", selector: dataTt.communityMePostsPage },
  { label: "Me collects", path: "/community/me/collects", selector: dataTt.communityMeCollectsPage },
  { label: "Me reports", path: "/community/me/reports", selector: dataTt.communityMeReportsPage },
  {
    label: "Report ticket",
    path: "/community/me/reports/00000000-0000-4000-8000-000000000001",
    selector: dataTt.communityReportTicketPage,
  },
  {
    label: "User profile",
    path: "/community/user/00000000-0000-4000-8000-000000000001",
    selector: dataTt.communityUserPage,
  },
  {
    label: "Topic feed alias",
    path: `/community/topic/${encodeURIComponent("旅行")}`,
    selector: dataTt.communityFeedPage,
  },
  { label: "Feedback", path: "/community/feedback", selector: dataTt.communityFeedbackPage },
  {
    label: "Post deep link redirect",
    path: "/community/post/00000000-0000-4000-8000-000000000099",
    selector: dataTt.communityFeedPage,
    finalUrlIncludes: "post=00000000-0000-4000-8000-000000000099",
  },
  { label: "Me likes", path: "/community/me/likes", selector: dataTt.communityMeLikesPage },
];

test.describe("community sub-routes L5 markers (①)", () => {
  for (const c of MARKER_CASES) {
    test(`${c.label} · ${c.path}`, async ({ page }) => {
      test.setTimeout(60_000);
      await gotoSmoke(page, c.path);
      if (c.finalUrlIncludes) {
        await page.waitForURL(`**${c.finalUrlIncludes}**`, { timeout: 30_000 });
      }
      await expect(page.locator(c.selector).first()).toBeVisible({ timeout: 25_000 });
    });
  }
});
