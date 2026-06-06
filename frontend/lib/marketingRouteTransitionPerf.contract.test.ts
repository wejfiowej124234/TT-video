import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = join(__dirname, "..", "..");
const APP = join(REPO, "frontend/app");

describe("marketing route transition perf (① · opacity-only fade)", () => {
  const templatePaths = [
    join(APP, "(home)/template.tsx"),
    join(APP, "traveltrust/template.tsx"),
    join(APP, "market/template.tsx"),
    join(APP, "did-rank/template.tsx"),
    join(APP, "community/template.tsx"),
  ];

  it("五主路由 template 挂载 MarketingRouteFadeTemplate", () => {
    const fade = readFileSync(
      join(REPO, "frontend/components/navigation/MarketingRouteFadeTemplate.tsx"),
      "utf8",
    );
    expect(fade).toContain('data-tt-marketing-route-fade="1"');
    for (const path of templatePaths) {
      const src = readFileSync(path, "utf8");
      expect(src).toContain("MarketingRouteFadeTemplate");
    }
  });

  it("globals 仅 opacity 165ms 淡入且尊重 prefers-reduced-motion", () => {
    const globals = readFileSync(join(REPO, "frontend/app/globals.css"), "utf8");
    expect(globals).toContain("@keyframes tt-marketing-route-fade-in");
    expect(globals).toContain(".tt-marketing-route-fade-in");
    expect(globals).toContain("165ms");
    expect(globals).toContain("prefers-reduced-motion: reduce");
    const fadeKeyframes = globals.match(/@keyframes tt-marketing-route-fade-in[\s\S]*?\n}/)?.[0] ?? "";
    expect(fadeKeyframes).toContain("opacity");
    expect(fadeKeyframes).not.toContain("transform");
  });

  it("/traveltrust layout 不 await page-brief（同步 preload + deferred 角色 prefetch）", () => {
    const layout = readFileSync(join(APP, "traveltrust/layout.tsx"), "utf8");
    expect(layout).toContain("getTraveltrustLayoutPreloadSync");
    expect(layout).not.toContain("await loadTraveltrustLayoutPreload");
    expect(layout).toContain("TravelTrustLayoutDeferredPreload");
    expect(layout).not.toContain("uniqueRoleVideoPrefetchEntries(preload.roles)");
  });

  it("/market 主入口 SSR 首屏快照 + 客户端 hydration", () => {
    const page = readFileSync(join(APP, "market/page.tsx"), "utf8");
    const client = readFileSync(join(APP, "market/MarketPageClient.tsx"), "utf8");
    expect(page).toContain("fetchMarketPageInitialSnapshot");
    expect(page).not.toContain('"use client"');
    expect(client).toContain("initialSnapshot");
  });

  it("/did-rank 主入口 SSR 首屏快照 + 客户端 hydration", () => {
    const page = readFileSync(join(APP, "did-rank/page.tsx"), "utf8");
    const client = readFileSync(join(APP, "did-rank/DidRankPageClient.tsx"), "utf8");
    expect(page).toContain("fetchDidRankPageInitialSnapshot");
    expect(page).not.toContain('"use client"');
    expect(client).toContain("initialSnapshot");
  });

  it("/community 主 Feed SSR 首屏快照 + 客户端 hydration", () => {
    const page = readFileSync(join(APP, "community/page.tsx"), "utf8");
    const client = readFileSync(join(APP, "community/CommunityPageClient.tsx"), "utf8");
    expect(page).toContain("fetchCommunityFeedInitialSnapshot");
    expect(page).not.toContain('"use client"');
    expect(client).toContain("initialSnapshot");
  });

  it("Hero 四链 Tab 与 RoutePrefetcher 预取五主路由", () => {
    const heroNav = readFileSync(
      join(REPO, "frontend/components/landing/LandingHeroNavTabs.tsx"),
      "utf8",
    );
    expect(heroNav).toContain("prefetch");
    expect(heroNav).toContain("router.prefetch");
    const prefetcher = readFileSync(
      join(REPO, "frontend/components/navigation/RoutePrefetcher.tsx"),
      "utf8",
    );
    expect(prefetcher).toContain('"/traveltrust"');
    expect(prefetcher).toContain('"/market"');
    expect(prefetcher).toContain('"/did-rank"');
    expect(prefetcher).toContain('"/community"');
  });

  it("/did-rank 副榜 lazy fetch + Tab hover 预载", () => {
    const hook = readFileSync(
      join(REPO, "frontend/components/did-rank/useDidRankSecondaryBoard.ts"),
      "utf8",
    );
    const pageHook = readFileSync(join(APP, "did-rank/useDidRankPage.ts"), "utf8");
    const shell = readFileSync(
      join(REPO, "frontend/components/did-rank/DidRankBoardShell.tsx"),
      "utf8",
    );
    expect(hook).toContain("enabled?: boolean");
    expect(pageHook).toContain("warmBoard");
    expect(pageHook).toContain("secondaryBoardWarm");
    expect(shell).toContain("onWarmBoard");
    expect(shell).toContain("activePanel");
  });

  it("TT 社区抽屉 chunk 预载 + 动态 import", () => {
    const prefetch = readFileSync(join(REPO, "frontend/lib/communityDrawerPrefetch.ts"), "utf8");
    const portals = readFileSync(
      join(REPO, "frontend/components/community/CommunityFeedMainPortals.tsx"),
      "utf8",
    );
    const postDetailPortal = readFileSync(
      join(REPO, "frontend/components/community/CommunityFeedMainPostDetailPortal.tsx"),
      "utf8",
    );
    expect(prefetch).toContain("warmCommunityPostDetailDrawer");
    expect(prefetch).toContain("warmCommunityPublishDrawer");
    expect(portals).toContain("dynamic(");
    expect(portals).toContain("PublishDrawer");
    expect(postDetailPortal).toContain("dynamic(");
    expect(postDetailPortal).toContain("PostDetailDrawerPortal");
  });

  it("Feed 侧栏/登录弹窗与好友页分 Tab 加载", () => {
    const feedMain = readFileSync(join(REPO, "frontend/components/community/CommunityFeedMain.tsx"), "utf8");
    const masonry = readFileSync(
      join(REPO, "frontend/components/community/CommunityFeedMasonryGrid.tsx"),
      "utf8",
    );
    const meSocial = readFileSync(
      join(REPO, "frontend/components/community/useCommunityFeedMeFollowingCollects.ts"),
      "utf8",
    );
    const friendsLoad = readFileSync(
      join(REPO, "frontend/app/community/friends/communityFriendsPageDataLoad.ts"),
      "utf8",
    );
    expect(feedMain).toContain("dynamic(");
    expect(feedMain).toContain("CommunityFeedDesktopAside");
    expect(masonry).toContain("[content-visibility:auto]");
    expect(meSocial).toContain("requestIdleCallback");
    expect(friendsLoad).toContain("loadFriendsPageCore");
    expect(friendsLoad).toContain("loadFriendsPageTabFragment");
  });

  it("会话 query 共享 key + 壳层 idle defer + 榜 chunk 预载", () => {
    const convQuery = readFileSync(join(REPO, "frontend/lib/communityConversationsQuery.ts"), "utf8");
    const shellInner = readFileSync(
      join(REPO, "frontend/components/community/useCommunityRouteShellInner.ts"),
      "utf8",
    );
    const didRankPrefetch = readFileSync(join(REPO, "frontend/lib/didRankBoardChunkPrefetch.ts"), "utf8");
    const didRankInner = readFileSync(join(APP, "did-rank/DidRankPageInner.tsx"), "utf8");
    const messagesHook = readFileSync(
      join(APP, "community/messages/useCommunityMessagesPage.ts"),
      "utf8",
    );
    const threadPeer = readFileSync(
      join(APP, "community/messages/[id]/useCommunityConversationPagePeer.ts"),
      "utf8",
    );
    const threadHook = readFileSync(
      join(APP, "community/messages/[id]/useCommunityConversationPageThread.ts"),
      "utf8",
    );
    const convRow = readFileSync(
      join(APP, "community/messages/CommunityMessagesConversationRow.tsx"),
      "utf8",
    );
    expect(convQuery).toContain("COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY");
    expect(convQuery).toContain("shouldEagerFetchCommunityConversations");
    expect(shellInner).toContain("deferConversationsFetch");
    expect(didRankPrefetch).toContain("warmDidRankBoardChunk");
    expect(didRankInner).toContain('dynamic(() => import("@/components/did-rank/TravelerRankBlock")');
    expect(messagesHook).toContain("COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY");
    expect(threadPeer).toContain("COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY");
    expect(threadHook).toContain('queryKey: ["community", "conversationMessages"');
    expect(convRow).toContain("warmCommunityConversationThread");
  });

  it("生产 CommunityRouteShell 接入 Tab React Query 预载", () => {
    const shell = readFileSync(join(REPO, "frontend/components/community/CommunityRouteShell.tsx"), "utf8");
    expect(shell).toContain("CommunityRouteShellTabLinks");
    expect(shell).toContain("CommunityRouteShellMobileBottomNav");
    expect(shell).toContain("warmCommunityTabRoute");
    expect(shell).not.toContain("function warmCommunityRoute");
  });

  it("用户主页 social query 共享 cache + Tab hover 预载", () => {
    const userLists = readFileSync(
      join(APP, "community/user/[id]/useCommunityUserRemoteLists.ts"),
      "utf8",
    );
    const tabLinks = readFileSync(
      join(REPO, "frontend/components/community/CommunityRouteShellTabLinks.tsx"),
      "utf8",
    );
    const prefetch = readFileSync(join(REPO, "frontend/lib/communityDrawerPrefetch.ts"), "utf8");
    const didRankInner = readFileSync(join(APP, "did-rank/DidRankPageInner.tsx"), "utf8");
    const didRankPeriod = readFileSync(join(REPO, "frontend/lib/didRankPeriodPrefetch.ts"), "utf8");
    const didRankHeader = readFileSync(join(REPO, "frontend/components/did-rank/DidRankHeader.tsx"), "utf8");
    expect(userLists).toContain("COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY");
    expect(userLists).toContain("deferSocialQueries");
    expect(tabLinks).toContain("warmCommunityTabRoute");
    expect(prefetch).toContain("warmCommunityTabRoute");
    expect(didRankInner).toContain('dynamic(() => import("@/components/did-rank/DidRankPageFooter")');
    expect(didRankPeriod).toContain("warmDidRankPeriodData");
    expect(didRankHeader).toContain("onWarmPeriod");
    expect(didRankInner).toContain("warmDidRankPeriodData");
  });

  it("community me likes/collects 共用 React Query ID 列表 cache", () => {
    const likesHook = readFileSync(join(REPO, "frontend/lib/useCommunityMeLikesHydratedList.ts"), "utf8");
    const collectsHook = readFileSync(join(REPO, "frontend/lib/useCommunityMeCollectsHydratedList.ts"), "utf8");
    const meQueries = readFileSync(join(REPO, "frontend/lib/communityMeListQueries.ts"), "utf8");
    const prefetch = readFileSync(join(REPO, "frontend/lib/communityDrawerPrefetch.ts"), "utf8");
    const exploreHook = readFileSync(join(APP, "community/explore/useCommunityExplorePage.ts"), "utf8");
    expect(likesHook).toContain("COMMUNITY_ME_LIKES_IDS_QUERY_KEY");
    expect(collectsHook).toContain("COMMUNITY_ME_COLLECTS_IDS_QUERY_KEY");
    expect(meQueries).toContain("COMMUNITY_ME_FOLLOWING_QUERY_KEY");
    expect(prefetch).toContain("warmCommunityMeLikesIds");
    expect(prefetch).toContain("warmCommunityMeCollectsIds");
    expect(exploreHook).toContain("COMMUNITY_ME_FOLLOWING_QUERY_KEY");
    expect(exploreHook).toContain("deferSocialQueries");
  });

  it("community posts / explore tab / did-rank 副榜 hover 预载", () => {
    const postsHook = readFileSync(
      join(REPO, "frontend/app/community/me/posts/useCommunityMePostsPageMyPostsQuery.ts"),
      "utf8",
    );
    const prefetch = readFileSync(join(REPO, "frontend/lib/communityDrawerPrefetch.ts"), "utf8");
    const tabLinks = readFileSync(
      join(REPO, "frontend/components/community/CommunityRouteShellTabLinks.tsx"),
      "utf8",
    );
    const didRankPage = readFileSync(join(APP, "did-rank/useDidRankPage.ts"), "utf8");
    const didRankSecondary = readFileSync(join(REPO, "frontend/lib/didRankSecondaryBoardPrefetch.ts"), "utf8");
    expect(postsHook).toContain("useInfiniteQuery");
    expect(prefetch).toContain("warmCommunityExploreFeed");
    expect(prefetch).toContain("warmCommunityMePosts");
    expect(tabLinks).toContain("useQueryClient");
    expect(tabLinks).toContain("warmCommunityTabRoute(router, tab.path, queryClient)");
    expect(didRankPage).toContain("warmDidRankSecondaryBoardData");
    expect(didRankSecondary).toContain("getDidRankProviders");
  });

  it("好友页 staggered React Query + deferSecondary", () => {
    const friendsHook = readFileSync(join(APP, "community/friends/useCommunityFriendsPageData.ts"), "utf8");
    const prefetch = readFileSync(join(REPO, "frontend/lib/communityDrawerPrefetch.ts"), "utf8");
    expect(friendsHook).toContain("useQueries");
    expect(friendsHook).toContain("deferSecondary");
    expect(friendsHook).toContain("COMMUNITY_ME_FOLLOWING_QUERY_KEY");
    expect(friendsHook).toContain("scheduleCommunityIdleWork");
    expect(friendsHook).toContain("requestsEnabled");
    expect(prefetch).toContain("COMMUNITY_ME_FOLLOWERS_QUERY_KEY");
    expect(prefetch).toContain("getFriendsList");
    expect(prefetch).toContain("warmCommunityMainFeed");
    expect(prefetch).toContain("COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY");
    const feedApi = readFileSync(join(REPO, "frontend/components/community/useCommunityFeedApi.ts"), "utf8");
    const feedInfinite = readFileSync(join(REPO, "frontend/lib/communityFeedInfiniteQuery.ts"), "utf8");
    expect(feedApi).toContain("useInfiniteQuery");
    expect(feedApi).toContain("communityFeedInfiniteQueryOptions");
    expect(feedInfinite).toContain("warmCommunityMainFeed");
    const mobileNav = readFileSync(
      join(REPO, "frontend/components/community/CommunityRouteShellMobileBottomNav.tsx"),
      "utf8",
    );
    expect(mobileNav).toContain("useQueryClient");
    const didRankPageHook = readFileSync(join(APP, "did-rank/useDidRankPage.ts"), "utf8");
    const prizePrefetch = readFileSync(join(REPO, "frontend/lib/didRankPrizePoolPrefetch.ts"), "utf8");
    expect(didRankPageHook).toContain("warmDidRankPrizePool");
    expect(prizePrefetch).toContain("getDidRankPrizePool");
  });

  it("话题 tag / 消息会话行 / 排行榜 11+ 列表 content-visibility", () => {
    const prefetch = readFileSync(join(REPO, "frontend/lib/communityDrawerPrefetch.ts"), "utf8");
    const topicWarm = readFileSync(join(REPO, "frontend/lib/communityFeedInfiniteQuery.ts"), "utf8");
    const meta = readFileSync(join(REPO, "frontend/components/community/PostDetailDrawerMetaSection.tsx"), "utf8");
    const convRow = readFileSync(
      join(APP, "community/messages/CommunityMessagesConversationRow.tsx"),
      "utf8",
    );
    const messagesMain = readFileSync(join(APP, "community/messages/CommunityMessagesPageMain.tsx"), "utf8");
    const rankFold = readFileSync(join(REPO, "frontend/components/did-rank/DidRankFullListFold.tsx"), "utf8");
    expect(prefetch).toContain("warmCommunityTopicTagFeed");
    expect(topicWarm).toContain("parseCommunityTopicTagFromHref");
    expect(meta).toContain("useCommunityTopicTagWarm");
    expect(convRow).toContain("warmCommunityTabRoute(router, convHref, queryClient)");
    expect(messagesMain).toContain("communityMeLikesReceivedQueryKey");
    expect(rankFold).toContain("[content-visibility:auto]");
  });

  it("Feed DiscoveryChrome 排序/流 Tab hover 预载 Feed cache", () => {
    const chrome = readFileSync(
      join(REPO, "frontend/components/community/CommunityFeedDiscoveryChrome.tsx"),
      "utf8",
    );
    expect(chrome).toContain("warmCommunityFeedMode");
    expect(chrome).toContain("warmFeedSort");
    expect(chrome).toContain("communityMeLikesReceivedQueryKey");
  });

  it("explore/activity 首屏外区块 content-visibility", () => {
    const exploreAuthors = readFileSync(
      join(APP, "community/explore/CommunityExplorePageAuthorsSection.tsx"),
      "utf8",
    );
    const exploreDest = readFileSync(
      join(APP, "community/explore/CommunityExplorePageDestinationsSection.tsx"),
      "utf8",
    );
    const exploreMasonry = readFileSync(
      join(APP, "community/explore/CommunityExplorePageMasonrySection.tsx"),
      "utf8",
    );
    const activity = readFileSync(join(APP, "community/activity/page.tsx"), "utf8");
    expect(exploreAuthors).toContain("[content-visibility:auto]");
    expect(exploreDest).toContain("[content-visibility:auto]");
    expect(exploreMasonry).toContain("[content-visibility:auto]");
    expect(activity).toContain("[content-visibility:auto]");
  });
});
