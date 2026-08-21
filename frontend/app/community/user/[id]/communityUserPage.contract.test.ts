import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(process.cwd(), "app/community/user/[id]");

describe("community user page L5 (① · refactored VM)", () => {
  it("page.tsx is thin shell over CommunityUserPageClient", () => {
    const page = readFileSync(join(ROOT, "page.tsx"), "utf8");
    expect(page).toContain("CommunityUserPageClient");
    expect(page).toContain("CommunityParamRouteSuspense");
    expect(page).not.toContain("function CommunityUserPageInner");
    expect(page).not.toContain("window.confirm");
  });

  it("client wires core + split main/overlays", () => {
    const client = readFileSync(join(ROOT, "CommunityUserPageClient.tsx"), "utf8");
    expect(client).toContain("useCommunityUserPageCore");
    expect(client).toContain("CommunityUserPageMain");
    expect(client).toContain("CommunityUserPageOverlays");
    expect(client).toContain("CommunityUserPageNotFoundView");
  });

  it("main uses extracted sections not inline feed monolith", () => {
    const main = readFileSync(join(ROOT, "CommunityUserPageMain.tsx"), "utf8");
    expect(main).toContain("CommunityUserProfileHeader");
    expect(main).toContain("CommunityUserPostsFeedSection");
    expect(main).toContain("CommunityUserPageAlertsSection");
    expect(main).not.toContain("CommunityFeedCard");
  });

  it("mutations hook uses L5 delete confirm", () => {
    const mutations = readFileSync(join(ROOT, "useCommunityUserPostMutations.ts"), "utf8");
    expect(mutations).toContain("useCommunityDeletePostConfirm");
    expect(mutations).not.toContain("window.confirm");
  });

  it("overlays mount delete confirm dialog", () => {
    const overlays = readFileSync(join(ROOT, "CommunityUserPageOverlays.tsx"), "utf8");
    expect(overlays).toContain("CommunityDeletePostConfirmDialog");
    expect(overlays).toContain('variant="comment"');
    expect(overlays).toContain("onDeleteComment");
    expect(overlays).not.toContain("window.confirm");
  });

  it("comment delete uses L5 confirm not window.confirm", () => {
    const core = readFileSync(join(ROOT, "useCommunityUserPageCore.ts"), "utf8");
    expect(core).toContain("useCommunityFeedCommentDelete");
    expect(core).not.toContain("window.confirm");
    expect(core).not.toContain("window.alert");
  });

  it("self profile header uses GET /me when the current posts filter is empty", () => {
    const core = readFileSync(join(ROOT, "useCommunityUserPageCore.ts"), "utf8");
    expect(core).toContain("communityUserSelfProfileAuthor");
    expect(core).toContain("mergeCommunitySelfProfileAuthor");
    expect(core).toContain("lastSelfAuthorRef");
    expect(core).not.toMatch(/const profileAuthor = userPosts\[0\]\?\.author;/);
    expect(core).not.toMatch(/meAsAuthor \?\? userPosts\[0\]\?\.author/);
  });

  it("self profile 全部/公开/仅自己/归档 load the same logged-in account via getMyPosts", () => {
    const lists = readFileSync(join(ROOT, "useCommunityUserRemoteLists.ts"), "utf8");
    expect(lists).toContain("getMyPosts");
    expect(lists).toContain("visibility: postsVisFilter");
    expect(lists).toContain("authLoading");
    expect(lists).not.toMatch(/isSelf \? \{ visibility: postsVisFilter \}/);
    const header = readFileSync(join(ROOT, "CommunityUserProfileHeader.tsx"), "utf8");
    expect(header).toContain("!isSelf && !loading && userPostsLength === 0");
    const feed = readFileSync(join(ROOT, "CommunityUserPostsFeedSection.tsx"), "utf8");
    expect(feed).toContain("communityUserPostsEmptyI18nKey");
    expect(feed).toContain("postsVisFilter");
  });

  it("feed section wires feed-level delete for self profile", () => {
    const feed = readFileSync(join(ROOT, "CommunityUserPostsFeedSection.tsx"), "utf8");
    const main = readFileSync(join(ROOT, "CommunityUserPageMain.tsx"), "utf8");
    const core = readFileSync(join(ROOT, "useCommunityUserPageCore.ts"), "utf8");
    const card = readFileSync(join(process.cwd(), "components/community/CommunityFeedCard.tsx"), "utf8");
    expect(feed).toContain("onDeletePost");
    expect(feed).toContain("onPinToTop");
    expect(feed).toContain("userPostsForFeed");
    expect(main).toContain("confirmDeletePost");
    expect(main).toContain("pinUserPostToTop");
    expect(main).toContain("CommunityMeSessionPinNote");
    expect(core).toContain("useCommunityMePageSessionPin");
    expect(card).toContain("CommunityMeNotesCardOverflowMenu");
    expect(card).toContain("showPinOption={Boolean(onPinToTop)}");
  });
});
