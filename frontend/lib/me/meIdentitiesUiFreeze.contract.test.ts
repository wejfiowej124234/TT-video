import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const IDENTITIES_DIR = join(ROOT, "app", "me", "identities");
const FREEZE_DOC = join(ROOT, "evidence", "GO_local_auth_l5", "ME-IDENTITIES-UI-FREEZE.md");
const P2_FREEZE_DOC = join(ROOT, "evidence", "GO_local_auth_l5", "IDENTITY-CENTER-PHASE2-FREEZE.md");
const P3_NAMING_DOC = join(ROOT, "evidence", "GO_local_auth_l5", "ACCOUNT-NAV-NAMING-P3.md");

/** Hub 根目录冻结文件 — 与 ME-IDENTITIES-UI-FREEZE.md §Hub 根目录 同步 */
const ME_IDENTITIES_HUB_FROZEN_FILES = [
  "error.tsx",
  "layout.tsx",
  "loading.tsx",
  "meIdentitiesPage.contract.test.ts",
  "page.tsx",
  "README.md",
] as const;

/** P2 settings 子路由 — layout 数据链 only · 见 IDENTITY-CENTER-PHASE2-FREEZE */
const ME_IDENTITIES_ALLOWED_SUBDIRS = ["acquisition", "guide", "merchant", "region-steward"] as const;

const ME_IDENTITIES_ALLOWED_ROOT_FILES = [
  ...ME_IDENTITIES_HUB_FROZEN_FILES,
  "meIdentityP2Settings.contract.test.ts",
] as const;

const FORBIDDEN_UI_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bbg-bg-main\b/, reason: "console light page shell" },
  { pattern: /\bbg-white\b/, reason: "white console cards" },
  { pattern: /ProductCrossNav/, reason: "console blue cross nav" },
  { pattern: /\btext-travel-600\b/, reason: "legacy travel blue links" },
  { pattern: /\bref-cyan\b|\bborder-cyan-|\bbg-cyan-/, reason: "market cyan chrome" },
  { pattern: /titleCompact/, reason: "hub title must use titleLogin" },
  { pattern: /MarketDarkRouteSceneDecor/, reason: "market photo decor" },
];

function readHubSources(): string {
  return [
    readFileSync(join(IDENTITIES_DIR, "page.tsx"), "utf8"),
    readFileSync(join(ROOT, "lib/me/meIdentitiesL5.ts"), "utf8"),
    readFileSync(join(ROOT, "components/me/MeIdentitiesL5IdentityCard.tsx"), "utf8"),
    readFileSync(join(ROOT, "components/me/MeIdentitiesTravelerCallout.tsx"), "utf8"),
  ].join("\n");
}

describe("/me/identities UI freeze (① · ME-IDENTITIES-UI-FREEZE)", () => {
  it("freeze SSOT doc exists and declares sealed hub UI", () => {
    const doc = readFileSync(FREEZE_DOC, "utf8");
    expect(doc).toContain("2026-05-26");
    expect(doc).toContain("锁死");
    expect(doc).toContain("data-tt-me-identities-ui-frozen");
    expect(doc).toContain("titleLogin");
    expect(doc).toContain("AuthL5CrossNavFooter");
    expect(doc).toContain("meIdentitiesUiFreeze");
    expect(doc).toContain("ACCOUNT-NAV-NAMING-P3");
    expect(doc).toContain("nav_community_profile");
    const p3 = readFileSync(P3_NAMING_DOC, "utf8");
    expect(p3).toContain("多重身份 Hub");
    expect(p3).toContain("/community/me");
  });

  it("P2 Identity Center freeze doc exists and bans new identity IA", () => {
    const doc = readFileSync(P2_FREEZE_DOC, "utf8");
    expect(doc).toContain("IDENTITY-P2-SPRINT");
    expect(doc).toContain("guide/settings");
    expect(doc).toContain("merchant/settings");
    expect(doc).toContain("region-steward/settings");
    expect(doc).toContain("acquisition/settings");
    expect(doc).toContain("禁止");
  });

  it("route directory matches hub frozen files + P2 settings subdirs allowlist", () => {
    const onDisk = readdirSync(IDENTITIES_DIR).filter((name) => !name.startsWith("."));
    const files = onDisk
      .filter((name) => !statSync(join(IDENTITIES_DIR, name)).isDirectory())
      .sort();
    const dirs = onDisk
      .filter((name) => statSync(join(IDENTITIES_DIR, name)).isDirectory())
      .sort();
    expect(files).toEqual([...ME_IDENTITIES_ALLOWED_ROOT_FILES].sort());
    expect(dirs).toEqual([...ME_IDENTITIES_ALLOWED_SUBDIRS].sort());
  });

  it("hub shell declares frozen + L5 anchors and forbids console regressions", () => {
    const shell = readHubSources();
    expect(shell).toContain("meIdentitiesL5MainDataAttrs(true)");
    expect(shell).toContain("AuthL5PageBackdrop");
    expect(shell).toContain("MeIdentitiesTravelerCallout");
    expect(shell).toContain("applySectionTitle");
    expect(readFileSync(join(IDENTITIES_DIR, "page.tsx"), "utf8")).toContain("AuthL5CrossNavFooter");
    expect(readFileSync(join(ROOT, "components/me/MeIdentitiesProfileLinksNav.tsx"), "utf8")).toContain(
      "MeIdentitiesProfileLinkThumb",
    );
    expect(readFileSync(join(ROOT, "components/me/MeIdentitiesProfileLinksNav.tsx"), "utf8")).toContain(
      "profileLinkCard",
    );
    for (const { pattern, reason } of FORBIDDEN_UI_PATTERNS) {
      expect(shell, reason).not.toMatch(pattern);
    }
  });

  it("loading and error segments stay on L5 identities shell", () => {
    expect(readFileSync(join(IDENTITIES_DIR, "loading.tsx"), "utf8")).toContain("MeIdentitiesRouteLoading");
    expect(readFileSync(join(IDENTITIES_DIR, "error.tsx"), "utf8")).toContain("MeIdentitiesRouteError");
    expect(readFileSync(join(ROOT, "components/me/MeIdentitiesRouteLoading.tsx"), "utf8")).toContain(
      'meIdentitiesL5MainDataAttrs(true)',
    );
    expect(readFileSync(join(ROOT, "components/me/MeIdentitiesRouteError.tsx"), "utf8")).toContain(
      "AuthL5CrossNavFooter",
    );
  });
});
