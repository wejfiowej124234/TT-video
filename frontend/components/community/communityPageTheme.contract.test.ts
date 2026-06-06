import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const appCommunity = join(import.meta.dirname, "../../app/community");

function readApp(rel: string) {
  return readFileSync(join(appCommunity, rel), "utf8");
}

describe("community page chrome theme V1 (contract)", () => {
  it("explore header avoids cyan-primary chrome", () => {
    const src = readApp("explore/CommunityExplorePageHeader.tsx");
    expect(src).toContain("TT_COMMUNITY_PAGE_L5.pageTitle");
    expect(src).toContain("TT_COMMUNITY_PAGE_L5.pill");
    expect(src).toContain("TT_COMMUNITY_FEED_ACTION.retryPill");
    expect(src).not.toContain("border-cyan-400/40");
    expect(src).not.toMatch(/from-cyan-300 to-fuchsia/);
    expect(src).not.toMatch(/border-ref-sun\/40 bg-ref-sun\/12 px-4 py-2 text-meta/);
  });

  it("friends inner tabs use warm active state", () => {
    const src = readApp("friends/CommunityFriendsMainTabs.tsx");
    expect(src).toContain("TT_COMMUNITY_PAGE_L5.innerTabActive");
    expect(src).not.toContain("bg-cyan-500/30");
  });

  it("P1 sub-pages use TT_COMMUNITY_PAGE_L5.panel for main sections", () => {
    expect(readApp("messages/CommunityMessagesConversationsSection.tsx")).toContain(
      "TT_COMMUNITY_PAGE_L5.panel",
    );
    expect(readApp("friends/CommunityFriendsRelationsPanel.tsx")).toContain("TT_COMMUNITY_PAGE_L5.panel");
    expect(readApp("feedback/CommunityFeedbackListPanel.tsx")).toContain("TT_COMMUNITY_PAGE_L5.panel");
  });

  it("friends/messages/feedback L2 pages avoid inline outline Action pills", () => {
    for (const f of [
      "friends/page.tsx",
      "messages/CommunityMessagesPageMain.tsx",
      "messages/MessagesDmEmptyPanel.tsx",
      "feedback/page.tsx",
    ]) {
      const src = readApp(f);
      expect(src).toContain("TT_COMMUNITY_PAGE_L5");
      expect(src).not.toMatch(/border-ref-sun\/40 bg-ref-sun\/12 px-4 py-2 text-meta/);
    }
  });

  it("me/user community pages use L5 tokens for CTA and visibility tabs", () => {
    const meHub = readApp("me/page.tsx");
    expect(meHub).toContain("resolveCommunityMeHubRedirect");
    expect(meHub).not.toContain("TT_COMMUNITY_PAGE_L5");

    for (const f of [
      "me/posts/CommunityMePostsPageMain.tsx",
      "user/[id]/CommunityUserPostsVisibilityNav.tsx",
      "user/[id]/CommunityUserProfileHeader.tsx",
    ]) {
      const src = readApp(f);
      expect(src).toContain("TT_COMMUNITY_PAGE_L5");
      expect(src).not.toMatch(/border-ref-sun\/40 bg-ref-sun\/12 px-4 py-2 text-meta/);
      expect(src).not.toMatch(/border-ref-sun\/45 bg-ref-sun\/14 text-ref-sun\/90/);
    }
  });

  it("messages page title uses warm gradient", () => {
    const src = readApp("messages/CommunityMessagesPageMain.tsx");
    expect(src).toContain("TT_COMMUNITY_PAGE_L5.pageTitle");
    expect(src).not.toMatch(/from-cyan-300 to-fuchsia/);
  });

  it("TT community entry redirects to explore (① data-chain)", () => {
    const src = readApp("tt/page.tsx");
    expect(src).toContain('redirect("/community/explore")');
    expect(src).not.toContain("TT_COMMUNITY_PAGE_L5");
  });

  it("community L2 page h1 uses TT_COMMUNITY_PAGE_L5 title tokens", () => {
    const files = [
      "explore/CommunityExplorePageHeader.tsx",
      "friends/page.tsx",
      "messages/CommunityMessagesPageMain.tsx",
      "activity/page.tsx",
      "feedback/page.tsx",
    ];
    for (const f of files) {
      const src = readApp(f);
      expect(src).toMatch(/TT_COMMUNITY_PAGE_L5\.pageTitle/);
      expect(src).not.toMatch(/bg-gradient-to-r from-ref-sun via-ref-coral to-ref-sun/);
    }
  });
});
