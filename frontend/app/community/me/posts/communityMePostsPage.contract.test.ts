import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("community me posts page L5 (①)", () => {
  it("page uses auth gate + refactored VM (no monolith getMyPosts)", () => {
    const page = readFileSync(join(ROOT, "app/community/me/posts/page.tsx"), "utf8");
    expect(page).toContain("CommunityMeDedicatedPageAuthGate");
    expect(page).toContain("useCommunityMePostsPage");
    expect(page).toContain("CommunityMePostsPageMain");
    expect(page).toContain("community_me_posts_auth_gate");
    expect(page).not.toContain("getMyPosts");
  });

  it("grid thumb never passes mp4 to Next Image", () => {
    const thumb = readFileSync(join(ROOT, "components/community/CommunityMePostGridThumb.tsx"), "utf8");
    expect(thumb).toContain("resolveCommunityPostPlayableVideoUrl");
    expect(thumb).toContain("<video");
  });

  it("post tile uses overflow menu instead of always-visible delete", () => {
    const tile = readFileSync(join(ROOT, "app/community/me/posts/CommunityMePostsPostTile.tsx"), "utf8");
    expect(tile).toContain("CommunityMeNotesCardOverflowMenu");
    expect(tile).not.toContain("community_delete_post");
  });

  it("collects page uses thumb grid not feed cards", () => {
    const main = readFileSync(join(ROOT, "app/community/me/collects/CommunityMeCollectsPageMain.tsx"), "utf8");
    expect(main).toContain("CommunityMeNotesPostThumbGrid");
    expect(main).not.toContain("CommunityFeedCard");
    expect(main).toContain("community_me_notes_menu_remove_collect");
  });

  it("orders drawer cancel uses L5 confirm not window.confirm", () => {
    const grid = readFileSync(join(ROOT, "components/me/communityMeNotes/CommunityMeNotesOrderThumbGrid.tsx"), "utf8");
    const preview = readFileSync(join(ROOT, "components/me/communityMeNotes/CommunityMeOrdersDrawerPreview.tsx"), "utf8");
    expect(grid).not.toContain("window.confirm");
    expect(grid).toContain("onRequestCancel");
    expect(preview).toContain("CommunityMeOrderCancelConfirmDialog");
    expect(preview).toContain("useCommunityMeOrdersDrawerCancel");
  });

  it("orders drawer uses session pin hook + cursor load-more (no fetchAll)", () => {
    const preview = readFileSync(join(ROOT, "components/me/communityMeNotes/CommunityMeOrdersDrawerPreview.tsx"), "utf8");
    const hook = readFileSync(join(ROOT, "lib/useCommunityMeOrdersDrawerList.ts"), "utf8");
    expect(preview).toContain("useCommunityMePageSessionPin");
    expect(preview).not.toContain("applyPinOrder");
    expect(preview).not.toContain("fetchOrdersForCommunityMeMyOrdersDrawer");
    expect(preview).toContain("CommunityMeListLoadMoreButton");
    expect(preview).toContain("CommunityMeSessionPinNote");
    expect(hook).toContain("loadMoreOrders");
    expect(hook).toContain("COMMUNITY_ME_ORDERS_DRAWER_PAGE_SIZE");
  });

  it("likes unlike uses L5 confirm dialog", () => {
    const hook = readFileSync(join(ROOT, "app/community/me/likes/useCommunityMeLikesPage.ts"), "utf8");
    const portals = readFileSync(join(ROOT, "app/community/me/likes/CommunityMeLikesPortals.tsx"), "utf8");
    const drawer = readFileSync(join(ROOT, "components/me/communityMeNotes/CommunityMeLikesExperience.tsx"), "utf8");
    const main = readFileSync(join(ROOT, "app/community/me/likes/CommunityMeLikesPageMain.tsx"), "utf8");
    expect(hook).toContain("useCommunityMeLikesUnlikeFlow");
    expect(portals).toContain("CommunityMeUnlikeConfirmDialog");
    expect(drawer).toContain("useCommunityMeLikesPage");
    expect(drawer).toContain("CommunityMeLikesPortals");
    expect(portals).toContain("PostDetailDrawerPortal");
    expect(drawer).not.toMatch(/router\.push\([^)]*\/community\/post\//);
    expect(main).toContain("community_me_notes_menu_remove_like");
  });

  it("collects uncollect uses L5 confirm dialog", () => {
    const hook = readFileSync(join(ROOT, "app/community/me/collects/useCommunityMeCollectsPage.ts"), "utf8");
    const portals = readFileSync(join(ROOT, "app/community/me/collects/CommunityMeCollectsPortals.tsx"), "utf8");
    const drawer = readFileSync(join(ROOT, "components/me/communityMeNotes/CommunityMeCollectsExperience.tsx"), "utf8");
    expect(hook).toContain("useCommunityMeCollectUncollectFlow");
    expect(portals).toContain("CommunityMeUncollectConfirmDialog");
    expect(drawer).toContain("useCommunityMeCollectsPage");
    expect(drawer).toContain("CommunityMeCollectsPortals");
    expect(portals).toContain("PostDetailDrawerPortal");
    expect(drawer).not.toMatch(/router\.push\([^)]*\/community\/post\//);
  });

  it("community user profile delete uses L5 confirm not window.confirm", () => {
    const mutations = readFileSync(join(ROOT, "app/community/user/[id]/useCommunityUserPostMutations.ts"), "utf8");
    const overlays = readFileSync(join(ROOT, "app/community/user/[id]/CommunityUserPageOverlays.tsx"), "utf8");
    const page = readFileSync(join(ROOT, "app/community/user/[id]/page.tsx"), "utf8");
    expect(mutations).not.toContain("window.confirm");
    expect(mutations).toContain("useCommunityDeletePostConfirm");
    expect(overlays).toContain("CommunityDeletePostConfirmDialog");
    expect(page).not.toContain("window.confirm");
    expect(page).toContain("CommunityUserPageClient");
  });

  it("header menu has mine + tools sections and dedicated route active helper", () => {
    const nav = readFileSync(join(ROOT, "components/header/headerUserMenuNavModel.ts"), "utf8");
    const active = readFileSync(join(ROOT, "components/header/headerUserMenuNavActive.ts"), "utf8");
    expect(nav).toContain("header_userMenu_section_mine");
    expect(nav).toContain("header_userMenu_section_tools");
    expect(nav).toContain("/community/me/likes");
    expect(nav).toContain('href: "/community/me/reports"');
    expect(active).toContain("COMMUNITY_ME_DEDICATED_PREFIXES");
  });

  it("delete uses L5 confirm dialog not window.confirm", () => {
    const hook = readFileSync(join(ROOT, "app/community/me/posts/useCommunityMePostsPage.ts"), "utf8");
    const portals = readFileSync(join(ROOT, "app/community/me/posts/CommunityMePostsPortals.tsx"), "utf8");
    expect(hook).toContain("useCommunityDeletePostConfirm");
    expect(hook).not.toContain("window.confirm");
    expect(portals).toContain("CommunityDeletePostConfirmDialog");
  });

  it("likes dedicated page uses auth gate + VM", () => {
    const page = readFileSync(join(ROOT, "app/community/me/likes/page.tsx"), "utf8");
    const client = readFileSync(join(ROOT, "app/community/me/likes/CommunityMeLikesPageClient.tsx"), "utf8");
    expect(page).toContain("CommunityMeLikesPageClient");
    expect(client).toContain("CommunityMeDedicatedPageAuthGate");
    expect(client).toContain("CommunityMeLikesPageMain");
    const main = readFileSync(join(ROOT, "app/community/me/likes/CommunityMeLikesPageMain.tsx"), "utf8");
    expect(main).toContain("data-tt-community-me-likes-page");
  });

  it("posts drawer uses shared VM + vis filter (no monolith fetch)", () => {
    const exp = readFileSync(join(ROOT, "components/me/communityMeNotes/CommunityMePostsExperience.tsx"), "utf8");
    const hook = readFileSync(join(ROOT, "components/me/communityMeNotes/useCommunityMePostsExperience.ts"), "utf8");
    const main = readFileSync(join(ROOT, "components/me/communityMeNotes/CommunityMePostsExperienceMain.tsx"), "utf8");
    const portals = readFileSync(
      join(ROOT, "components/me/communityMeNotes/CommunityMePostsExperiencePortals.tsx"),
      "utf8",
    );
    expect(exp).toContain("useCommunityMePostsExperience");
    expect(exp).toContain("CommunityMePostsExperiencePortals");
    expect(portals).toContain("PostDetailDrawerPortal");
    expect(exp).not.toContain("fetchAllPostsForCommunityMeDrawer");
    expect(hook).toContain("postsVisFilter");
    expect(hook).toContain("useCommunityMeDrawerPostDetail");
    expect(hook).not.toMatch(/router\.push\([^)]*\/community\/post\//);
    expect(main).toContain("CommunityMePostsVisFilterGroup");
  });

  it("posts page syncs vis filter to URL", () => {
    const hook = readFileSync(join(ROOT, "app/community/me/posts/useCommunityMePostsPage.ts"), "utf8");
    expect(hook).toContain("parseCommunityMePostsVisQuery");
    expect(hook).toContain('sp.set("vis"');
  });

  it("collects/likes dedicated pages enable session pin via shared hook", () => {
    const pinHook = readFileSync(join(ROOT, "lib/communityMePageSessionPin.ts"), "utf8");
    const collectsHook = readFileSync(join(ROOT, "app/community/me/collects/useCommunityMeCollectsPage.ts"), "utf8");
    const likesHook = readFileSync(join(ROOT, "app/community/me/likes/useCommunityMeLikesPage.ts"), "utf8");
    const collectsMain = readFileSync(join(ROOT, "app/community/me/collects/CommunityMeCollectsPageMain.tsx"), "utf8");
    const likesMain = readFileSync(join(ROOT, "app/community/me/likes/CommunityMeLikesPageMain.tsx"), "utf8");
    expect(pinHook).toContain("applyPinOrder");
    expect(collectsHook).toContain("useCommunityMePageSessionPin");
    expect(likesHook).toContain("useCommunityMePageSessionPin");
    expect(collectsMain).toContain("collectedPostsForGrid");
    expect(collectsMain).toContain("pinCollectToTop");
    expect(collectsMain).not.toContain("showPinOption: false");
    expect(likesMain).toContain("likedPostsForGrid");
    expect(likesMain).toContain("pinLikeToTop");
    expect(likesMain).not.toContain("showPinOption: false");
  });

  it("collects/likes dedicated pages show session pin note when list has 2+ items", () => {
    const note = readFileSync(join(ROOT, "components/me/communityMeNotes/CommunityMeSessionPinNote.tsx"), "utf8");
    const collectsMain = readFileSync(join(ROOT, "app/community/me/collects/CommunityMeCollectsPageMain.tsx"), "utf8");
    const likesMain = readFileSync(join(ROOT, "app/community/me/likes/CommunityMeLikesPageMain.tsx"), "utf8");
    expect(note).toContain("data-tt-community-me-session-pin-note={surface}");
    expect(note).toContain("community_me_page_session_pin_note");
    expect(collectsMain).toContain("CommunityMeSessionPinNote");
    expect(collectsMain).toContain('surface="page"');
    expect(collectsMain).toContain("collectedPosts.length >= 2");
    expect(likesMain).toContain("CommunityMeSessionPinNote");
    expect(likesMain).toContain("likedPosts.length >= 2");
  });

  it("posts page uses shared session pin hook and shows pin note", () => {
    const hook = readFileSync(join(ROOT, "app/community/me/posts/useCommunityMePostsPage.ts"), "utf8");
    const main = readFileSync(join(ROOT, "app/community/me/posts/CommunityMePostsPageMain.tsx"), "utf8");
    const drawerHook = readFileSync(join(ROOT, "components/me/communityMeNotes/useCommunityMePostsExperience.ts"), "utf8");
    const overflow = readFileSync(join(ROOT, "components/me/communityMeNotes/CommunityMeNotesCardOverflowMenu.tsx"), "utf8");
    expect(hook).toContain("useCommunityMePageSessionPin");
    expect(hook).not.toContain("pinnedPostIds");
    expect(hook).toContain("handleGridVisibilityChange");
    expect(hook).toContain("loadMorePosts");
    expect(main).toContain("CommunityMeSessionPinNote");
    expect(main).toContain("CommunityMePostsGrid");
    expect(readFileSync(join(ROOT, "app/community/me/posts/CommunityMePostsGrid.tsx"), "utf8")).toContain(
      "CommunityMeListLoadMoreButton",
    );
    expect(main).toContain("myPosts.length >= 2");
    expect(drawerHook).toContain("useCommunityMePageSessionPin");
    expect(drawerHook).toContain("onVisibilityChange");
    expect(overflow).toContain("showVisibilityOptions");
  });

  it("likes/collects drawers use shared session pin hook + drawer pin note", () => {
    const likes = readFileSync(join(ROOT, "components/me/communityMeNotes/CommunityMeLikesExperience.tsx"), "utf8");
    const collects = readFileSync(join(ROOT, "components/me/communityMeNotes/CommunityMeCollectsExperience.tsx"), "utf8");
    const likesPage = readFileSync(join(ROOT, "app/community/me/likes/useCommunityMeLikesPage.ts"), "utf8");
    const collectsPage = readFileSync(join(ROOT, "app/community/me/collects/useCommunityMeCollectsPage.ts"), "utf8");
    expect(likes).toContain("useCommunityMeLikesPage");
    expect(likes).toContain('surface="drawer"');
    expect(likesPage).toContain("useCommunityMePageSessionPin");
    expect(collects).toContain("useCommunityMeCollectsPage");
    expect(collects).toContain('surface="drawer"');
    expect(collectsPage).toContain("useCommunityMePageSessionPin");
  });

  it("collects drawer shares page VM + hydrated list with dedicated page", () => {
    const drawer = readFileSync(join(ROOT, "components/me/communityMeNotes/CommunityMeCollectsExperience.tsx"), "utf8");
    const pageHook = readFileSync(join(ROOT, "app/community/me/collects/useCommunityMeCollectsPage.ts"), "utf8");
    const collectsHook = readFileSync(join(ROOT, "lib/useCommunityMeCollectsHydratedList.ts"), "utf8");
    expect(drawer).toContain("useCommunityMeCollectsPage");
    expect(pageHook).toContain("useCommunityMeCollectsHydratedList");
    expect(collectsHook).toContain("COMMUNITY_ME_COLLECTS_IDS_QUERY_KEY");
    expect(drawer).toContain("CommunityMeListLoadMoreButton");
  });

  it("likes drawer/page share page VM + hydrated list with load-more", () => {
    const drawer = readFileSync(join(ROOT, "components/me/communityMeNotes/CommunityMeLikesExperience.tsx"), "utf8");
    const pageHook = readFileSync(join(ROOT, "app/community/me/likes/useCommunityMeLikesPage.ts"), "utf8");
    const likesHook = readFileSync(join(ROOT, "lib/useCommunityMeLikesHydratedList.ts"), "utf8");
    const meListQueries = readFileSync(join(ROOT, "lib/communityMeListQueries.ts"), "utf8");
    expect(drawer).toContain("useCommunityMeLikesPage");
    expect(pageHook).toContain("useCommunityMeLikesHydratedList");
    expect(likesHook).toContain("COMMUNITY_ME_LIKES_IDS_QUERY_KEY");
    expect(likesHook).toContain("useQuery");
    expect(meListQueries).toContain("fetchCommunityMeLikesIds");
    expect(likesHook).toContain("loadMoreLikes");
    expect(readFileSync(join(ROOT, "app/community/me/likes/CommunityMeLikesPageMain.tsx"), "utf8")).toContain(
      "CommunityMeListLoadMoreButton",
    );
  });

  it("posts drawer uses shared cursor query with load-more (no fetchAll)", () => {
    const hook = readFileSync(join(ROOT, "components/me/communityMeNotes/useCommunityMePostsExperience.ts"), "utf8");
    const main = readFileSync(join(ROOT, "components/me/communityMeNotes/CommunityMePostsExperienceMain.tsx"), "utf8");
    expect(hook).toContain("useCommunityMePostsPageMyPostsQuery");
    expect(hook).not.toContain("fetchAllPostsForCommunityMeDrawer");
    expect(hook).toContain("loadMorePosts");
    expect(main).toContain("CommunityMeListLoadMoreButton");
  });

  it("posts/collects dedicated pages expose load-more cursor/hydrate", () => {
    const postsQuery = readFileSync(join(ROOT, "app/community/me/posts/useCommunityMePostsPageMyPostsQuery.ts"), "utf8");
    const collectsHook = readFileSync(join(ROOT, "app/community/me/collects/useCommunityMeCollectsPage.ts"), "utf8");
    const collectsMain = readFileSync(join(ROOT, "app/community/me/collects/CommunityMeCollectsPageMain.tsx"), "utf8");
    expect(postsQuery).toContain("useInfiniteQuery");
    expect(postsQuery).toContain("communityMePostsQueryKey");
    expect(postsQuery).toContain("fetchNextPage");
    expect(collectsHook).toContain("loadMoreCollects");
    expect(collectsHook).toContain("useCommunityMeCollectsHydratedList");
    expect(collectsHook).toContain("partialHint");
    expect(collectsMain).toContain("partialHint");
    expect(readFileSync(join(ROOT, "app/community/me/likes/useCommunityMeLikesPage.ts"), "utf8")).toContain(
      "loadMoreLikes",
    );
  });

  it("e2e load-more mocks + selectors wired for deterministic Playwright", () => {
    const mocks = readFileSync(join(ROOT, "e2e/helpers/communityMeLoadMoreMocks.ts"), "utf8");
    expect(mocks).toContain("installCommunityMePostsLoadMoreMocks");
    expect(mocks).toContain("ME_POSTS_LIST_GLOB");
    expect(mocks).toContain("installCommunityMeCollectsLoadMoreMocks");
    expect(mocks).toContain("installCommunityMeLikesLoadMoreMocks");
    const spec = readFileSync(join(ROOT, "e2e/community-me-l5-b-load-more-mocked.spec.ts"), "utf8");
    expect(spec).toContain("communityMeLoadMorePageButton");
    const selectors = readFileSync(join(ROOT, "test-utils/dataTtSelectors.ts"), "utf8");
    expect(selectors).toContain("communityMeLoadMorePage");
    expect(selectors).toContain("communityMeLoadMoreDrawer");
  });

  it("narrow green script wires vitest union + deterministic Playwright (ME-P1-7)", () => {
    const gate = readFileSync(
      join(ROOT, "evidence/GO_local_community_me_l5/community-me-l5-local-gate.v1.json"),
      "utf8",
    );
    const greenSh = readFileSync(join(ROOT, "../scripts/dev/run-community-me-l5-green.sh"), "utf8");
    const pkg = readFileSync(join(ROOT, "package.json"), "utf8");
    expect(gate).toContain("communityMePageTracker.contract.test.ts");
    expect(readFileSync(join(ROOT, "lib/accountNav/accountNavPageTracker.v1.ts"), "utf8")).toContain(
      "communityMePageTracker.v1",
    );
    expect(gate).toContain("run-community-me-l5-green.sh");
    expect(greenSh).toContain("communityMePageTracker.contract.test.ts");
    expect(greenSh).toContain("account-nav-header-ia.spec.ts");
    expect(greenSh).toContain("community-me-hub-tab-redirect-matrix.spec.ts");
    expect(greenSh).toContain("accountNavPageTracker.contract.test.ts");
    expect(gate).toContain("community-me-l5-a-parity-closeout.spec.ts");
    expect(gate).toContain("community-me-l5-b-load-more-mocked.spec.ts");
    expect(greenSh).toContain("TT_COMMUNITY_ME_L5_GREEN: OK");
    expect(greenSh).toContain("community-me-l5-c-dedicated-l5.spec.ts");
    expect(greenSh).toContain('e2e/community-me-data-state.spec.ts -g "访客"');
    expect(greenSh).toContain("community-me-l5-a-parity-closeout.spec.ts");
    expect(pkg).toContain("green:community-me-l5");
  });
});
