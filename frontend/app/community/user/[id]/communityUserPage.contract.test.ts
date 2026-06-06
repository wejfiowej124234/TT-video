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
