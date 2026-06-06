/**
 * ② C11 staging community route gate — frontend App Router 可达性（无 error boundary）。
 *
 * 由 **`scripts/dev/record-community-c11-evidence.sh`** 驱动；须 **`C11_STAGING_EVIDENCE_RUN=1`**。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { test, expect } from "@playwright/test";

import { resolvePathFromGitBashEnv } from "./helpers/normalizeGitBashPath";
import { gotoSmoke } from "./helpers/smoke-nav";
import { dataTt } from "../test-utils/dataTtSelectors";

type RouteProbe = {
  id: string;
  path: string;
  selector: string;
  finalUrlIncludes?: string;
};

const ROUTE_PROBES: RouteProbe[] = [
  { id: "feed", path: "/community", selector: dataTt.communityFeedPage },
  {
    id: "tt",
    path: "/community/tt",
    selector: dataTt.communityExplorePage,
    finalUrlIncludes: "/community/explore",
  },
  { id: "explore", path: "/community/explore", selector: dataTt.communityExplorePage },
  { id: "activity", path: "/community/activity", selector: dataTt.communityActivityPage },
  { id: "friends", path: "/community/friends", selector: dataTt.communityFriendsPage },
  { id: "messages", path: "/community/messages", selector: dataTt.communityMessagesPage },
  {
    id: "messages-thread",
    path: "/community/messages/00000000-0000-4000-8000-000000000001",
    selector: dataTt.communityMessagesThreadPage,
  },
  { id: "me", path: "/community/me", selector: '[data-tt-me-settings-profile="1"]', finalUrlIncludes: "/me/settings/profile" },
  { id: "me-posts", path: "/community/me/posts", selector: '[data-tt-community-me-page="posts"]' },
  { id: "me-collects", path: "/community/me/collects", selector: '[data-tt-community-me-page="collects"]' },
  { id: "me-reports", path: "/community/me/reports", selector: '[data-tt-community-me-page="reports"]' },
  {
    id: "me-report-ticket",
    path: "/community/me/reports/00000000-0000-4000-8000-000000000001",
    selector: dataTt.communityReportTicketPage,
  },
  {
    id: "user-profile",
    path: "/community/user/00000000-0000-4000-8000-000000000001",
    selector: dataTt.communityUserPage,
  },
  {
    id: "topic",
    path: `/community/topic/${encodeURIComponent("旅行")}`,
    selector: dataTt.communityFeedPage,
  },
  { id: "feedback", path: "/community/feedback", selector: dataTt.communityFeedbackPage },
  {
    id: "guidelines",
    path: "/community/guidelines",
    selector: "main",
    finalUrlIncludes: "/terms/community-guidelines",
  },
  {
    id: "post-deeplink",
    path: "/community/post/00000000-0000-4000-8000-000000000099",
    selector: dataTt.communityFeedPage,
    finalUrlIncludes: "post=00000000-0000-4000-8000-000000000099",
  },
  {
    id: "me-likes",
    path: "/community/me/likes",
    selector: '[data-tt-community-me-page="likes"]',
  },
];

function c11EvidenceGate(): boolean {
  return (
    process.env.C11_STAGING_EVIDENCE_RUN === "1" &&
    Boolean(process.env.C11_STAGING_EVIDENCE_OUT?.trim())
  );
}

function resolveOutDir(): string {
  return resolvePathFromGitBashEnv(process.env.C11_STAGING_EVIDENCE_OUT!.trim());
}

(c11EvidenceGate() ? test.describe : test.describe.skip)(
  "community C11 · staging route gate (frontend)",
  () => {
    test.setTimeout(300_000);

    test("All community public sub-routes reachable without error boundary", async ({ page }) => {
      const out = resolveOutDir();
      mkdirSync(out, { recursive: true });
      const results: { id: string; path: string; ok: boolean }[] = [];

      for (const probe of ROUTE_PROBES) {
        await gotoSmoke(page, probe.path);
        if (probe.finalUrlIncludes) {
          await page.waitForURL(`**${probe.finalUrlIncludes}**`, { timeout: 30_000 });
        }
        await expect(page.getByText(/页面加载异常/)).toHaveCount(0);
        await expect(page.locator(probe.selector).first()).toBeVisible({ timeout: 60_000 });
        results.push({ id: probe.id, path: probe.path, ok: true });
      }

      const payload = {
        ok: results.every((r) => r.ok),
        total: results.length,
        passed: results.filter((r) => r.ok).length,
        routes: results,
      };
      writeFileSync(join(out, "browser-route-probes.json"), JSON.stringify(payload, null, 2), "utf8");
    });
  },
);
