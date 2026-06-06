/**
 * `/community/me` 族 · ① 本地逐页机读追踪（满分 SSOT · ME-P1-8）
 *
 * 改动 Hub / 独立页 / 顶栏「我的」分工须 `communityMePageTracker` contract + `run-community-me-l5-green.sh` exit 0。
 */
export type CommunityMePageTrackerEntry = {
  route: string;
  role: "hub" | "dedicated" | "detail" | "header-nav";
  sourceFiles: readonly string[];
  mustContain: readonly string[];
  mustNotContain?: readonly string[];
};

export const COMMUNITY_ME_PAGE_TRACKER_V1: readonly CommunityMePageTrackerEntry[] = [
  {
    route: "/community/me",
    role: "hub",
    sourceFiles: ["app/community/me/page.tsx", "lib/communityMeHubRedirect.ts"],
    mustContain: ["resolveCommunityMeHubRedirect", "ME_SETTINGS_PROFILE_PATH", "router.replace"],
    mustNotContain: [
      'href="/pay"',
      "CommunityMeAccountPanel",
      "CommunityMeGuestNotesSegmentNav",
      "CommunityMeNotesDrawerStack",
      "data-tt-community-me-page",
    ],
  },
  {
    route: "/community/me/posts",
    role: "dedicated",
    sourceFiles: [
      "app/community/me/posts/page.tsx",
      "app/community/me/posts/CommunityMePostsPageMain.tsx",
    ],
    mustContain: [
      "CommunityMeDedicatedPageAuthGate",
      "useCommunityMePostsPage",
      'data-tt-community-me-posts-page="1"',
      "community_me_posts_auth_gate",
      "loginReturnPath=\"/community/me/posts\"",
    ],
    mustNotContain: [/router\.push\([^)]*\/community\/post\//.source],
  },
  {
    route: "/community/me/collects",
    role: "dedicated",
    sourceFiles: [
      "app/community/me/collects/page.tsx",
      "app/community/me/collects/CommunityMeCollectsPageMain.tsx",
    ],
    mustContain: [
      "CommunityMeDedicatedPageAuthGate",
      "useCommunityMeCollectsPage",
      'data-tt-community-me-collects-page="1"',
      "community_me_collects_auth_gate",
      "CommunityMeNotesPostThumbGrid",
    ],
    mustNotContain: ["CommunityFeedCard", /router\.push\([^)]*\/community\/post\//.source],
  },
  {
    route: "/community/me/likes",
    role: "dedicated",
    sourceFiles: [
      "app/community/me/likes/page.tsx",
      "app/community/me/likes/CommunityMeLikesPageClient.tsx",
      "app/community/me/likes/CommunityMeLikesPageMain.tsx",
    ],
    mustContain: [
      "CommunityMeLikesPageClient",
      "isCommunityMeLikesListEnabled",
      "CommunityMeDedicatedPageAuthGate",
      "useCommunityMeLikesPage",
      'data-tt-community-me-likes-page="1"',
      "community_me_likes_auth_gate",
    ],
    mustNotContain: [/router\.push\([^)]*\/community\/post\//.source],
  },
  {
    route: "/community/me/reports",
    role: "dedicated",
    sourceFiles: [
      "app/community/me/reports/page.tsx",
      "app/community/me/reports/CommunityMeReportsPageMain.tsx",
    ],
    mustContain: [
      "CommunityMeDedicatedPageAuthGate",
      "useCommunityMeReportsPage",
      'data-tt-community-me-reports-page="1"',
      "community_me_reports_auth_gate",
    ],
    mustNotContain: [/router\.push\([^)]*\/community\/post\//.source],
  },
  {
    route: "/community/me/reports/[id]",
    role: "detail",
    sourceFiles: ["app/community/me/reports/[id]/page.tsx", "app/community/communitySubRoutes.contract.test.ts"],
    mustContain: [
      "/community/me/reports/[id]",
      "data-tt-community-report-ticket-page",
    ],
  },
] as const;

/** 顶栏「我的 / 工具」与 Hub 分段 href 对拍（无 Hub tab=reports） */
export const COMMUNITY_ME_HEADER_NAV_TRACKER_V1: readonly CommunityMePageTrackerEntry[] = [
  {
    route: "header:mine",
    role: "header-nav",
    sourceFiles: ["components/header/headerUserMenuNavModel.ts"],
    mustContain: [
      "header_userMenu_section_mine",
      "function mineNavItems",
      'href: "/community/me/posts"',
      'href: "/community/me/collects"',
      'href: "/orders"',
    ],
  },
  {
    route: "header:tools-reports",
    role: "header-nav",
    sourceFiles: ["components/header/headerUserMenuNavModel.ts"],
    mustContain: [
      "header_userMenu_section_tools",
      'href: "/community/me/reports"',
      "me_settings_item_reports",
      "function toolsNavItems",
    ],
  },
  {
    route: "quicklinks:compact",
    role: "header-nav",
    sourceFiles: ["components/me/MeQuickLinksSection.tsx", "components/community/CommunityMeQuickLinksDrawer.tsx"],
    mustContain: ["compactForCommunityMe", "me_communityHint_compact"],
  },
] as const;

export const COMMUNITY_ME_PAGE_TRACKER_ALL_V1 = [
  ...COMMUNITY_ME_PAGE_TRACKER_V1,
  ...COMMUNITY_ME_HEADER_NAV_TRACKER_V1,
] as const;
