import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const FREEZE_DOC = join(ROOT, "evidence", "GO_local_auth_l5", "HEADER-UTILITY-MENU-L5-FREEZE.md");
const P3_NAMING_DOC = join(ROOT, "evidence", "GO_local_auth_l5", "ACCOUNT-NAV-NAMING-P3.md");
const UTILITY_TOKENS = readFileSync(join(ROOT, "lib/header/headerUtilityMenuL5.ts"), "utf8");
const USER_MENU = readFileSync(join(ROOT, "components/header/HeaderUserMenu.tsx"), "utf8");
const USER_NAV = readFileSync(join(ROOT, "components/header/HeaderUserMenuNavLinks.tsx"), "utf8");
const LANG = readFileSync(join(ROOT, "components/header/HeaderLanguageSwitcher.tsx"), "utf8");
const WALLET = readFileSync(join(ROOT, "components/trust/WalletStatusMini.tsx"), "utf8");
const NAV_MODEL = readFileSync(join(ROOT, "components/header/headerUserMenuNavModel.ts"), "utf8");
const HEADER = readFileSync(join(ROOT, "components/Header.tsx"), "utf8");
const GLOBALS = readFileSync(join(ROOT, "app/globals.css"), "utf8");
const ZH = readFileSync(join(ROOT, "locales/zh.ts"), "utf8");
const REGISTER_TOURIST = readFileSync(join(ROOT, "app/auth/register/RegisterTouristForm.tsx"), "utf8");
const REGISTER_GUIDE = readFileSync(join(ROOT, "app/auth/register/RegisterGuideForm.tsx"), "utf8");

describe("header utility menu UI freeze (① · HEADER-UTILITY-MENU-L5-FREEZE)", () => {
  it("freeze SSOT doc exists and declares utility L5 chrome", () => {
    const doc = readFileSync(FREEZE_DOC, "utf8");
    expect(doc).toContain("2026-06-02");
    expect(doc).toContain("headerUtilityMenuUiFreeze");
    expect(doc).toContain("isHeaderUtilityL5Path");
    expect(doc).toContain("data-tt-header-user-menu-l5");
    expect(doc).toContain("ACCOUNT-NAV-NAMING-P3");
    expect(doc).toContain("headerUserMenuNavModel.ts");
    expect(doc).toContain("HEADER_USER_MENU_PROFILE_HREF");
    expect(doc).toContain("/me/settings/profile");
    expect(doc).toContain("data-tt-header-user-menu-profile-strip");
    const p3 = readFileSync(P3_NAMING_DOC, "utf8");
    expect(p3).toContain("多重身份 Hub");
    expect(p3).toContain("/me/settings/profile");
  });

  it("dropdown shells stay absolute under trigger (no relative override)", () => {
    expect(LANG).not.toContain("`relative ${menuClass}`");
    expect(WALLET).not.toContain("`relative ${menuClass}`");
    expect(USER_MENU).toContain("HeaderUtilityMenuL5Chrome");
    expect(UTILITY_TOKENS).toContain("right-0 top-full");
    expect(UTILITY_TOKENS).toContain("left-auto");
    expect(HEADER).toContain("data-tt-header-utility-l5");
    expect(GLOBALS).toContain('header[data-tt-header-utility-l5="1"] .header-utility-dropdown-panel');
  });

  it("authL5 user menu uses grouped sections and grid icon rows", () => {
    expect(NAV_MODEL).toContain("headerUserMenuNavSections");
    expect(NAV_MODEL).toContain("header_userMenu_section_account");
    expect(USER_NAV).toContain("headerUserMenuNavSections");
    expect(USER_NAV).toContain("TT_HEADER_USER_MENU_L5.itemIcon");
    expect(UTILITY_TOKENS).toContain("itemWithIcon");
    expect(GLOBALS).toContain("header-utility-dropdown-panel");
  });

  it("spine traveler label matches identities hub wording (zh)", () => {
    expect(ZH).toContain('header_identitySpine_traveler: "旅行者"');
    expect(ZH).toContain("me_identities_traveler_callout_title_active");
  });

  it("register flows link back to identities hub", () => {
    expect(REGISTER_TOURIST).toContain('href="/me/identities"');
    expect(REGISTER_GUIDE).toContain('href="/me/identities"');
    expect(NAV_MODEL).toContain('href: "/me/identities"');
    expect(NAV_MODEL).not.toContain("/guide/register");
  });

  it("authL5 menu wires profile strip, identities hub, mine shortcuts, and settings", () => {
    expect(NAV_MODEL).toContain("HEADER_USER_MENU_PROFILE_HREF");
    expect(NAV_MODEL).not.toContain('labelKey: "nav_community_profile"');
    expect(USER_NAV).toContain("HEADER_USER_MENU_PROFILE_HREF");
    expect(USER_NAV).toContain('aria-label={t("nav_community_profile")}');
    expect(USER_NAV).toContain("data-tt-header-user-menu-profile-strip");
    expect(NAV_MODEL).toContain('href: "/me/settings"');
    expect(NAV_MODEL).toContain("header_userMenu_section_mine");
    expect(NAV_MODEL).toContain('/community/me/posts');
    expect(NAV_MODEL).toContain('/community/me/collects');
    expect(NAV_MODEL).toContain('/community/me/reports');
    expect(NAV_MODEL).toContain("HEADER_USER_MENU_PROFILE_HREF");
    expect(NAV_MODEL).not.toContain('labelKey: "nav_community_profile"');
    expect(NAV_MODEL).toContain('labelKey: "header_multiIdentity"');
    expect(NAV_MODEL).not.toContain("/pay");
    expect(ZH).toContain('nav_community_profile: "个人资料"');
    expect(ZH).toContain('header_multiIdentity: "多重身份 / 角色与入驻"');
    expect(ZH).not.toContain("个人中心");
  });
});
