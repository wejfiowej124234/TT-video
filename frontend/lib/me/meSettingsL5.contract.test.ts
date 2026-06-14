import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { meSettingsNavSections } from "@/lib/me/meSettingsNavModel";
import { ME_SETTINGS_HUB_PATH, ME_SETTINGS_PASSWORD_PATH, TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

const ROOT = process.cwd();

describe("me settings L5 (①)", () => {
  it("hub path and nav model wire account security without dropdown duplicates", () => {
    expect(ME_SETTINGS_HUB_PATH).toBe("/me/settings");
    expect(ME_SETTINGS_PASSWORD_PATH).toBe("/me/password");
    const flat = meSettingsNavSections().flatMap((s) => s.items);
    expect(flat.some((i) => i.href === "/me/password")).toBe(true);
    expect(flat.some((i) => i.href === "/me/security")).toBe(true);
    expect(flat.some((i) => i.href === "/community/me/reports")).toBe(false);
    expect(flat.some((i) => i.href === "/orders")).toBe(false);
    expect(flat.some((i) => i.href === "/community/me/posts")).toBe(false);
    expect(flat.some((i) => i.href === "/me/identities")).toBe(false);
    expect(flat.some((i) => i.href === "/community/me")).toBe(false);
    expect(flat.some((i) => i.href === "/me/settings/language")).toBe(true);
    expect(flat.some((i) => i.href === "/me/publish")).toBe(true);
    expect(flat.some((i) => i.href === "/pay")).toBe(false);
  });

  it("guide hub row appears when showGuideHub", () => {
    const off = meSettingsNavSections({ showGuideHub: false }).flatMap((s) => s.items);
    const on = meSettingsNavSections({ showGuideHub: true }).flatMap((s) => s.items);
    expect(off.some((i) => i.href === "/guide?from=settings")).toBe(false);
    expect(on.some((i) => i.href === "/guide?from=settings")).toBe(true);
  });

  it("layout uses centered max-w-3xl column", () => {
    expect(TT_ME_SETTINGS_L5.pageColumn).toContain("max-w-3xl");
    expect(TT_ME_SETTINGS_L5.pageColumn).toContain("mx-auto");
    const tokens = readFileSync(join(ROOT, "lib/me/meSettingsL5.ts"), "utf8");
    expect(tokens).toContain("titleCompact");
  });

  it("header menu settings points to hub; active includes password subroute", () => {
    const nav = readFileSync(join(ROOT, "components/header/headerUserMenuNavModel.ts"), "utf8");
    const active = readFileSync(join(ROOT, "components/header/headerUserMenuNavActive.ts"), "utf8");
    expect(nav).toContain('href: "/me/settings"');
    expect(nav).toContain("/community/me/posts");
    expect(nav).toContain("header_userMenu_section_mine");
    expect(active).toContain("/me/password");
    expect(active).toContain("/me/security");
    expect(active).toContain('path.startsWith("/me/settings/")');
  });

  it("settings hub has profile card, collapsible sections, and minimal footer", () => {
    const page = readFileSync(join(ROOT, "app/me/settings/MeSettingsPageInner.tsx"), "utf8");
    const flow = readFileSync(join(ROOT, "components/me/MeSettingsL5FlowPage.tsx"), "utf8");
    expect(page).toContain("MeSettingsProfileCard");
    expect(page).not.toContain("MeSettingsHubStatusStrip");
    expect(page).toContain("MeSettingsHubSection");
    expect(flow).toContain("MeSettingsL5MinimalFooter");
    expect(flow).not.toContain("MeSettingsL5SiteNav");
    expect(page).toContain("MeSettingsL5BackLink");
  });

  it("password page uses L5 card and settings back link", () => {
    const page = readFileSync(join(ROOT, "app/me/password/page.tsx"), "utf8");
    expect(page).toContain("AuthL5Card");
    expect(page).toContain("ME_SETTINGS_HUB_PATH");
    expect(page).not.toContain("ProductCrossNav");
    expect(page).not.toContain("chain_off");
  });

  it("community profile from settings returns via page back link (not profile card gear)", () => {
    const back = readFileSync(join(ROOT, "components/me/CommunityMeSettingsBackLink.tsx"), "utf8");
    const card = readFileSync(
      join(ROOT, "components/me/communityMePage/CommunityMeAccountPanelProfileCard.tsx"),
      "utf8",
    );
    expect(back).toContain("ME_SETTINGS_HUB_PATH");
    expect(card).not.toContain('href="/me/settings?from=community"');
  });

  it("row component distinguishes soon badge and static rows", () => {
    const row = readFileSync(join(ROOT, "components/me/MeSettingsL5Row.tsx"), "utf8");
    expect(row).toContain("badgeSoon");
    expect(row).toContain("rowStatic");
    expect(row).not.toContain("rowDisabled");
  });
});
