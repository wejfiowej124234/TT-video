/**
 * G-01 · 社区子路由数据链 contract（Phase ① · 无 UI 变更）
 * 各页须 wired 到公开 API client；与 `communitySubRoutes.contract.test.ts` 路由表互补。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const appCommunity = join(import.meta.dirname);

function readApp(rel: string): string {
  return readFileSync(join(appCommunity, rel), "utf8");
}

type RouteDataEntry = {
  route: string;
  sourceFiles: string[];
  /** 须出现在合并源码中的 API client 符号 */
  apiHooks: string[];
  /** 可选：禁止 internal 路径 */
  noInternalApi?: boolean;
};

const ROUTE_DATA: RouteDataEntry[] = [
  {
    route: "/community/explore",
    sourceFiles: ["explore/page.tsx", "explore/useCommunityExplorePage.ts"],
    apiHooks: ["getFeed", "getMeFollowing", "getExploreDestinations"],
  },
  {
    route: "/community/activity",
    sourceFiles: ["activity/page.tsx"],
    apiHooks: ["getMeActivity"],
  },
  {
    route: "/community/friends",
    sourceFiles: ["friends/page.tsx", "friends/useCommunityFriendsPageData.ts"],
    apiHooks: ["getMeFollowing", "getMeFollowers", "getFriendsList", "useQueries"],
  },
  {
    route: "/community/messages",
    sourceFiles: ["messages/page.tsx", "messages/useCommunityMessagesPage.ts"],
    apiHooks: ["getConversations", "getMe"],
  },
  {
    route: "/community/messages/[id]",
    sourceFiles: [
      "messages/[id]/page.tsx",
      "messages/[id]/useCommunityConversationPage.ts",
      "messages/[id]/useCommunityConversationPageThread.ts",
      "messages/[id]/useCommunityConversationPageSend.ts",
      "messages/[id]/useCommunityConversationPagePeer.ts",
    ],
    apiHooks: ["getConversationMessages", "postConversationMessage", "getConversations"],
  },
  {
    route: "/community/me/posts",
    sourceFiles: [
      "me/posts/page.tsx",
      "me/posts/useCommunityMePostsPage.ts",
      "me/posts/useCommunityMePostsPageMyPostsQuery.ts",
      "../../lib/communityMeListQueries.ts",
    ],
    apiHooks: ["getMyPosts", "fetchCommunityMePostsPage", "deletePost"],
  },
  {
    route: "/community/me/collects",
    sourceFiles: [
      "me/collects/page.tsx",
      "me/collects/useCommunityMeCollectsPage.ts",
      "../../lib/useCommunityMeCollectsHydratedList.ts",
      "../../lib/communityMeListQueries.ts",
    ],
    apiHooks: ["getMeCollects", "fetchCommunityMeCollectsIds"],
  },
  {
    route: "/community/me/likes",
    sourceFiles: [
      "me/likes/page.tsx",
      "me/likes/useCommunityMeLikesPage.ts",
      "../../lib/useCommunityMeLikesHydratedList.ts",
      "../../lib/communityMeListQueries.ts",
    ],
    apiHooks: ["getMeLikes", "fetchCommunityMeLikesIds"],
  },
  {
    route: "/community/me/reports",
    sourceFiles: [
      "me/reports/page.tsx",
      "me/reports/useCommunityMeReportsPage.ts",
      "../../lib/useCommunityMeReportsListQuery.ts",
    ],
    apiHooks: ["getMyCommunityReports"],
  },
  {
    route: "/community/user/[id]",
    sourceFiles: ["user/[id]/page.tsx", "user/[id]/useCommunityUserRemoteLists.ts"],
    apiHooks: ["getUserPosts", "getMeFollowing", "postUserFollow"],
  },
  {
    route: "/community/feedback",
    sourceFiles: ["feedback/page.tsx", "feedback/useCommunityFeedbackPage.ts"],
    apiHooks: ["getFeedbackList", "postFeedback"],
  },
  {
    route: "/community/me",
    sourceFiles: [
      "../../components/me/CommunityMeAccountPanelInner.tsx",
      "../../components/me/communityMePage/useCommunityMeAccountPanelAvatar.ts",
    ],
    apiHooks: ["postMeProfileAvatar", "skipAvatarUrlOnProfileSave"],
  },
];

describe("community route data hooks (G-01 · ①)", () => {
  it.each(ROUTE_DATA.map((e) => [e.route, e] as const))(
    "%s wires expected API client hooks",
    (_route, entry) => {
      const combined = entry.sourceFiles.map((f) => readApp(f)).join("\n");
      for (const hook of entry.apiHooks) {
        expect(combined).toContain(hook);
      }
      if (entry.noInternalApi !== false) {
        expect(combined).not.toMatch(/\/api\/v1\/internal\//);
      }
    },
  );

  it("feedback module keeps file upload (not URL paste)", () => {
    const src = [
      readApp("feedback/CommunityFeedbackPostModal.tsx"),
      readApp("feedback/useCommunityFeedbackPageMedia.ts"),
    ].join("\n");
    expect(src).toContain('type="file"');
    expect(src).not.toContain('type="url"');
  });
});
