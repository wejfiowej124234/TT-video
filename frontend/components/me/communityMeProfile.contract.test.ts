import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname);

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("community /community/me profile L5 (① · file upload · no URL paste)", () => {
  it("MeProfileSection never exposes avatar URL paste (file upload via profile card only)", () => {
    const src = read("MeProfileSection.tsx");
    expect(src).toContain("community_me_avatar_upload_hint");
    expect(src).not.toContain('type="url"');
    expect(src).not.toContain("me_avatar_url_label");
  });

  it("CommunityMeAccountPanel delegates to refactored inner + file avatar", () => {
    const panel = read("CommunityMeAccountPanel.tsx");
    const inner = read("CommunityMeAccountPanelInner.tsx");
    const avatar = read("communityMePage/useCommunityMeAccountPanelAvatar.ts");
    expect(panel).toContain("CommunityMeAccountPanelInner");
    expect(panel).not.toContain("function CommunityMeAccountPanelInner");
    expect(inner).toContain("skipAvatarUrlOnProfileSave: true");
    expect(inner).toContain("CommunityMeAccountPanelProfileCard");
    expect(avatar).toContain("postMeProfileAvatar");
  });

  it("useMePage supports omitting avatar_url on community profile save", () => {
    const src = read("useMePage.ts");
    expect(src).toContain("skipAvatarUrlOnProfileSave");
    expect(src).toMatch(/skipAvatarUrlOnProfileSave[\s\S]*avatar_url/);
  });

  it("communityMePage surfaces use warm TT_COMMUNITY_ME_PANEL_L5 tokens (no legacy cyan shell)", () => {
    const files = [
      "communityMePage/CommunityMeAccountPanelProfileCard.tsx",
      "communityMePage/CommunityMeAccountProfileHeader.tsx",
      "communityMePage/CommunityMePageHeader.tsx",
    ];
    for (const rel of files) {
      const src = read(rel);
      expect(src).toContain("TT_COMMUNITY_ME_PANEL_L5");
      expect(src).not.toMatch(/border-cyan-400\/35/);
    }
  });

  it("content nav SSOT lives in header menu only (no hub profile duplicate nav)", () => {
    const header = readFileSync(join(root, "../header/headerUserMenuNavModel.ts"), "utf8");
    expect(header).toContain('href: "/community/me/posts"');
    expect(header).toContain('href: "/community/me/collects"');
    expect(header).toContain('href: "/orders"');
    const card = read("communityMePage/CommunityMeAccountPanelProfileCard.tsx");
    expect(card).not.toContain("CommunityMeAccountPanelNotesNav");
    expect(card).not.toContain("CommunityMeTravelDataTeaser");
    expect(card).not.toContain("data-tt-community-me-content-preview");
  });

  it("community profile card has no duplicate settings or security row", () => {
    const card = read("communityMePage/CommunityMeAccountPanelProfileCard.tsx");
    expect(card).not.toContain("data-tt-community-me-settings-link");
    expect(card).not.toContain('href="/me/settings?from=community"');
    expect(card).not.toContain("CommunityMeAccountSecurityRow");
    expect(card).not.toContain("MeLogoutL5Button");
  });
});
