import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const ZH = readFileSync(join(ROOT, "locales/zh.ts"), "utf8");
const EN = readFileSync(join(ROOT, "locales/en.ts"), "utf8");
const NAV_MODEL = readFileSync(join(ROOT, "components/header/headerUserMenuNavModel.ts"), "utf8");
const E2E_HELPER = readFileSync(join(ROOT, "e2e/helpers/communityMeLegacyRedirects.ts"), "utf8");
const P3_DOC = readFileSync(join(ROOT, "evidence/GO_local_auth_l5/ACCOUNT-NAV-NAMING-P3.md"), "utf8");
const PUBLISH_HUB_DESIGN = readFileSync(join(ROOT, "evidence/GO_local_auth_l5/PUBLISH-HUB-L5-DESIGN.md"), "utf8");
const HEADER_FREEZE = readFileSync(join(ROOT, "evidence/GO_local_auth_l5/HEADER-UTILITY-MENU-L5-FREEZE.md"), "utf8");
const IDENTITIES_FREEZE = readFileSync(join(ROOT, "evidence/GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md"), "utf8");

/** 用户可见 zh 产品 copy：禁止「个人中心」回漂（P3 · 2026-05-27） */
const ZH_FORBIDDEN_PRODUCT_PHRASES = ["个人中心"] as const;

const NAMING_KEYS_ZH: Record<string, string> = {
  me_title: "社区资料",
  nav_community_profile: "个人资料",
  header_multiIdentity: "多重身份 / 角色与入驻",
  me_identities_hub_title: "多重身份",
};

function e2eSources(): string {
  const dir = join(ROOT, "e2e");
  const names = readdirSync(dir).filter((n) => n.endsWith(".spec.ts") || n.endsWith(".ts"));
  return names.map((n) => readFileSync(join(dir, n), "utf8")).join("\n");
}

describe("account nav naming P3 (① · ACCOUNT-NAV-NAMING-P3)", () => {
  it("P3 SSOT doc exists and declares dual entry semantics", () => {
    expect(P3_DOC).toContain("社区资料");
    expect(P3_DOC).toContain("多重身份 Hub");
    expect(P3_DOC).toContain("accountNavNamingP3");
    expect(P3_DOC).toContain("accountNavPageTracker");
    expect(P3_DOC).toContain("smoke-account-nav-local.sh");
    expect(P3_DOC).toContain("test:i18n:ci");
  });

  it("freeze docs reference profile strip and identities hub (not 个人中心 menu)", () => {
    expect(HEADER_FREEZE).toContain("/me/settings/profile");
    expect(HEADER_FREEZE).toContain("header_multiIdentity");
    expect(HEADER_FREEZE).not.toContain("个人中心");
    expect(IDENTITIES_FREEZE).toContain("nav_community_profile");
  });

  it("zh locale has zero 个人中心 in product strings", () => {
    for (const phrase of ZH_FORBIDDEN_PRODUCT_PHRASES) {
      expect(ZH, `zh.ts must not contain 「${phrase}」`).not.toContain(phrase);
    }
  });

  it("zh/en SSOT keys match hub vs community profile wording", () => {
    for (const [key, zhFragment] of Object.entries(NAMING_KEYS_ZH)) {
      expect(ZH).toContain(`${key}:`);
      expect(ZH).toContain(zhFragment);
      expect(EN).toContain(`${key}:`);
    }
    expect(ZH).toContain('header_multiIdentity: "多重身份 / 角色与入驻"');
    expect(EN).toContain("header_multiIdentity:");
    expect(EN).toContain("Multiple roles");
    expect(EN).toContain('nav_community_profile: "Profile"');
    expect(EN).toContain('me_title: "Community profile"');
  });

  it("header nav model wires profile strip href, identities hub, publish hub, and mine shortcuts", () => {
    expect(NAV_MODEL).toContain('labelKey: "header_multiIdentity"');
    expect(NAV_MODEL).toContain('href: "/me/identities"');
    expect(NAV_MODEL).toContain("HEADER_USER_MENU_PROFILE_HREF");
    expect(NAV_MODEL).not.toContain('labelKey: "nav_community_profile"');
    expect(NAV_MODEL).toContain("PUBLISH_HUB_PATH");
    expect(NAV_MODEL).toContain('labelKey: "header_userMenu_publish_hub"');
    expect(NAV_MODEL).toContain('href: "/community/me/posts"');
    expect(NAV_MODEL).toContain('href: "/community/me/collects"');
    expect(NAV_MODEL).toContain('href: "/community/me/likes"');
    expect(NAV_MODEL).toContain('href: "/orders"');
    expect(NAV_MODEL).toContain('href: "/community/me/reports"');
    expect(NAV_MODEL).not.toMatch(/href:\s*"\/me"[,}]/);
  });

  it("Playwright community-me main accessible name matches me_title i18n", () => {
    expect(E2E_HELPER).toContain("communityMeMainAccessibleNameRe");
    expect(E2E_HELPER).toContain("/Community profile|社区资料/");
    const e2e = e2eSources();
    expect(e2e).not.toMatch(/getByRole\("main",\s*\{\s*name:\s*\/Me\|我\//);
    expect(e2e).not.toMatch(/Profile\|个人中心/);
  });

  it("zh posts menu uses 我的帖子 not 我的发布 (PUBLISH-HUB-L5-DESIGN)", () => {
    expect(ZH).toContain('header_userMenu_my_posts: "我的帖子"');
    expect(ZH).not.toContain('header_userMenu_my_posts: "我的发布"');
    expect(ZH).toContain('header_userMenu_publish_hub: "发布中心"');
    expect(PUBLISH_HUB_DESIGN).toContain("FROZEN");
  });

  it("/me index redirects to identities hub (P3 · not community feed)", () => {
    const meIndex = readFileSync(join(ROOT, "app/me/page.tsx"), "utf8");
    expect(meIndex).toContain("ME_IDENTITIES_HUB_PATH");
    expect(meIndex).not.toContain("POST_AUTH_DEFAULT_RETURN_PATH");
  });
});
