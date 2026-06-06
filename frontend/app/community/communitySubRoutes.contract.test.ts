/**
 * TT 社区 · 18 子路由机读锚点并集（Phase ① · 对标 MARKET-L5 路由 contract）
 * 与 `test-utils/dataTtSelectors.ts` · `e2e/community-subroutes-l5-markers.spec.ts` 同源。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { dataTt } from "@/test-utils/dataTtSelectors";

const appCommunity = join(import.meta.dirname);

function readApp(rel: string): string {
  return readFileSync(join(appCommunity, rel), "utf8");
}

function markerAttr(selector: string): string {
  const m = selector.match(/\[data-tt-([^=]+)="([^"]+)"\]/);
  if (!m) throw new Error(`expected data-tt selector: ${selector}`);
  return `data-tt-${m[1]}="${m[2]}"`;
}

type SubRouteEntry =
  | {
      route: string;
      selector: (typeof dataTt)[keyof typeof dataTt];
      sourceFiles: string[];
    }
  | {
      route: string;
      kind: "redirect";
      sourceFiles: string[];
      redirectContains: string;
    }
  | {
      route: string;
      kind: "feed-alias";
      selector: (typeof dataTt)[keyof typeof dataTt];
      sourceFiles: string[];
    };

/** 18 页路由 SSOT（与 app/community 下各 page.tsx 磁盘枚举对齐 · 2026-05-31） */
const SUB_ROUTES: SubRouteEntry[] = [
  {
    route: "/community",
    selector: dataTt.communityFeedPage,
    sourceFiles: ["../../components/community/CommunityFeedMain.tsx"],
  },
  {
    route: "/community/tt",
    kind: "redirect",
    sourceFiles: ["tt/page.tsx"],
    redirectContains: "/community/explore",
  },
  {
    route: "/community/explore",
    selector: dataTt.communityExplorePage,
    sourceFiles: ["explore/page.tsx", "explore/CommunityExplorePageMain.tsx"],
  },
  {
    route: "/community/activity",
    selector: dataTt.communityActivityPage,
    sourceFiles: ["activity/page.tsx"],
  },
  {
    route: "/community/friends",
    selector: dataTt.communityFriendsPage,
    sourceFiles: ["friends/page.tsx"],
  },
  {
    route: "/community/messages",
    selector: dataTt.communityMessagesPage,
    sourceFiles: ["messages/page.tsx", "messages/CommunityMessagesPageMain.tsx"],
  },
  {
    route: "/community/messages/[id]",
    selector: dataTt.communityMessagesThreadPage,
    sourceFiles: ["messages/[id]/page.tsx", "messages/[id]/CommunityConversationPageMain.tsx"],
  },
  {
    route: "/community/me",
    kind: "redirect",
    sourceFiles: ["me/page.tsx"],
    redirectContains: "resolveCommunityMeHubRedirect",
  },
  {
    route: "/community/me/posts",
    selector: dataTt.communityMePostsPage,
    sourceFiles: ["me/posts/page.tsx", "me/posts/CommunityMePostsPageMain.tsx"],
  },
  {
    route: "/community/me/collects",
    selector: dataTt.communityMeCollectsPage,
    sourceFiles: ["me/collects/page.tsx", "me/collects/CommunityMeCollectsPageMain.tsx"],
  },
  {
    route: "/community/me/likes",
    selector: dataTt.communityMeLikesPage,
    sourceFiles: ["me/likes/page.tsx", "me/likes/CommunityMeLikesPageMain.tsx"],
  },
  {
    route: "/community/me/reports",
    selector: dataTt.communityMeReportsPage,
    sourceFiles: ["me/reports/page.tsx", "me/reports/CommunityMeReportsPageMain.tsx"],
  },
  {
    route: "/community/me/reports/[id]",
    selector: dataTt.communityReportTicketPage,
    sourceFiles: ["me/reports/[id]/page.tsx"],
  },
  {
    route: "/community/user/[id]",
    selector: dataTt.communityUserPage,
    sourceFiles: ["user/[id]/page.tsx", "user/[id]/CommunityUserPageNotFoundView.tsx"],
  },
  {
    route: "/community/topic/[tag]",
    kind: "feed-alias",
    selector: dataTt.communityFeedPage,
    sourceFiles: ["topic/[tag]/page.tsx", "../../components/community/CommunityFeedMain.tsx"],
  },
  {
    route: "/community/post/[id]",
    kind: "redirect",
    sourceFiles: ["post/[id]/page.tsx"],
    redirectContains: "/community?post=",
  },
  {
    route: "/community/feedback",
    selector: dataTt.communityFeedbackPage,
    sourceFiles: ["feedback/page.tsx"],
  },
  {
    route: "/community/guidelines",
    kind: "redirect",
    sourceFiles: ["guidelines/page.tsx"],
    redirectContains: "/terms/community-guidelines",
  },
];

function walkCommunityTsx(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) out.push(...walkCommunityTsx(p));
    else if (
      (name.name.endsWith(".tsx") || name.name.endsWith(".ts")) &&
      !name.name.endsWith(".contract.test.ts") &&
      !name.name.endsWith(".contract.test.tsx")
    ) {
      out.push(p);
    }
  }
  return out;
}

describe("community sub-routes L5 markers (① · 18 routes)", () => {
  it("registry covers exactly 18 community page routes", () => {
    expect(SUB_ROUTES).toHaveLength(18);
  });

  it.each(SUB_ROUTES.map((e) => [e.route, e] as const))("%s has expected machine-readable anchor or redirect", (_route, entry) => {
    const combined = entry.sourceFiles.map((f) => readApp(f)).join("\n");
    expect(combined).not.toMatch(/\/api\/v1\/internal\//);

    if ("kind" in entry && entry.kind === "redirect") {
      expect(combined).toContain(entry.redirectContains);
      expect(
        combined.includes("redirect(") || combined.includes("router.replace"),
      ).toBe(true);
      return;
    }

    const attr = markerAttr(entry.selector);
    expect(combined).toContain(attr);

    if ("kind" in entry && entry.kind === "feed-alias") {
      expect(combined).toContain("CommunityFeedMain");
    }
  });

  it("app/community tree has no paste-URL inputs for media (① · file upload only)", () => {
    const hits: string[] = [];
    for (const file of walkCommunityTsx(appCommunity)) {
      const rel = file.replace(appCommunity + "/", "").replace(/\\/g, "/");
      if (rel.includes("/guidelines/") || rel.includes("/post/[id]/")) continue;
      const src = readFileSync(file, "utf8");
      if (src.includes('type="url"')) {
        hits.push(rel);
      }
    }
    expect(hits).toEqual([]);
  });

  it("feedback page keeps file upload hook (regression guard)", () => {
    const src = [
      readApp("feedback/CommunityFeedbackPostModal.tsx"),
      readApp("feedback/page.tsx"),
    ].join("\n");
    expect(src).toContain('type="file"');
    expect(src).not.toContain('type="url"');
  });

  it("phase 1 data honesty anchors on key surfaces (P1-CM-16/17/ACT-02/FBK-02)", () => {
    expect(readApp("activity/page.tsx")).toContain("data-tt-community-activity-scope=");
    expect(readApp("activity/page.tsx")).toContain("getMeActivity");
    expect(readApp("activity/page.tsx")).toContain("community_activity_scope_sr_hint");
    expect(readApp("explore/CommunityExplorePageDestinationsSection.tsx")).toContain(
      "data-tt-community-explore-dest-catalog=",
    );
    expect(readApp("explore/useCommunityExplorePage.ts")).toContain("getExploreDestinations");
    expect(readApp("feedback/CommunityFeedbackListPanel.tsx")).toContain(
      "data-tt-community-feedback-list-source",
    );
    const feedChrome = readFileSync(
      join(import.meta.dirname, "../../components/community/CommunityFeedDiscoveryChrome.tsx"),
      "utf8",
    );
    expect(feedChrome).toContain("data-tt-community-feed-search-mode=");
    expect(feedChrome).toContain("api-text-q-v1");
    const showcaseNotice = readFileSync(
      join(import.meta.dirname, "../../components/community/CommunityFeedShowcaseNotice.tsx"),
      "utf8",
    );
    expect(showcaseNotice).toContain('data-tt-community-feed-showcase="active-v1"');
  });

  it("dataTtSelectors community keys align with registry selectors", () => {
    const selectors = SUB_ROUTES.flatMap((e) =>
      "selector" in e ? [e.selector] : [],
    );
    for (const sel of selectors) {
      expect(Object.values(dataTt)).toContain(sel);
    }
  });
});
