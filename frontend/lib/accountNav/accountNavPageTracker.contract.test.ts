import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ACCOUNT_NAV_HEADER_ROUTES_V1,
  ACCOUNT_NAV_IA_CROSS_RULES_V1,
  ACCOUNT_NAV_PAGE_TRACKER_SCHEMA,
  ACCOUNT_NAV_UNIFIED_ROUTES_V1,
} from "@/lib/accountNav/accountNavPageTracker.v1";
import { meSettingsNavSections } from "@/lib/me/meSettingsNavModel";

const ROOT = process.cwd();
const REPO = join(ROOT, "..");
const GATE_JSON_PATH = "evidence/GO_local_auth_l5/account-nav-page-tracker.v1.json";

type AccountNavGateJson = {
  schema: string;
  routes: { path: string; domain: string }[];
  vitest_union: string[];
  playwright_account_nav: string[];
  playwright_matrix?: {
    full_env: string;
    layers: { id: string; specs?: string[]; delegate_script?: string }[];
  };
  green_scripts: {
    full_smoke?: string;
    unified_smoke: string;
    settings_smoke?: string;
    community_me_green: string;
  };
  green_summary_lines?: { full?: string };
  header_ia: { hub_must_not_duplicate: string[]; reports_href: string };
  related_gates?: { me_settings_l5?: string; community_me_l5?: string };
};

function readRepo(relFromFrontend: string): string {
  return readFileSync(join(ROOT, relFromFrontend), "utf8");
}

function readRepoRoot(rel: string): string {
  return readFileSync(join(REPO, rel), "utf8");
}

describe("account nav unified page tracker v1 (① · ME-P1-9)", () => {
  it("declares schema and unique unified routes", () => {
    expect(ACCOUNT_NAV_PAGE_TRACKER_SCHEMA).toBe("traveltrust.account-nav-page-tracker.v1");
    const routes = ACCOUNT_NAV_UNIFIED_ROUTES_V1.map((r) => r.route);
    expect(new Set(routes).size).toBe(routes.length);
    expect(routes).toContain("/me/settings");
    expect(routes).toContain("/community/me/reports");
  });

  it("header routes cover mine + tools SSOT hrefs", () => {
    for (const href of [
      "/me/identities",
      "/me/settings/profile",
      "/orders",
      "/community/me/posts",
      "/community/me/collects",
      "/community/me/likes",
      "/community/me/reports",
      "/me/settings",
    ]) {
      expect(ACCOUNT_NAV_HEADER_ROUTES_V1, `header routes missing ${href}`).toContain(href);
    }
  });

  it("settings hub nav does not duplicate header primary hrefs", () => {
    const flat = meSettingsNavSections().flatMap((s) => s.items);
    for (const href of ACCOUNT_NAV_IA_CROSS_RULES_V1.hubMustNotDuplicateHrefs) {
      expect(flat.some((i) => i.href === href), `settings hub duplicates ${href}`).toBe(false);
    }
  });

  it("reports lives in tools section before settings in nav model", () => {
    const nav = readRepo("components/header/headerUserMenuNavModel.ts");
    const reportsIdx = nav.indexOf('href: "/community/me/reports"');
    const settingsIdx = nav.indexOf('href: "/me/settings"');
    expect(reportsIdx).toBeGreaterThan(-1);
    expect(settingsIdx).toBeGreaterThan(reportsIdx);
    expect(nav).toContain('section: isAuthL5 ? "tools"');
    expect(nav).toContain("me_settings_item_reports");
  });

  it("smoke-account-nav-local.sh wires unified vitest union", () => {
    const sh = readRepoRoot("scripts/dev/smoke-account-nav-local.sh");
    for (const token of ACCOUNT_NAV_IA_CROSS_RULES_V1.vitestUnion) {
      expect(sh, `smoke script missing ${token}`).toContain(token);
    }
    expect(sh).toContain("test:i18n:ci");
    expect(sh).toContain("smoke-account-nav: OK");
  });

  it("smoke-account-nav-full-local.sh and JSON playwright_matrix align", () => {
    const gate = JSON.parse(readRepo(GATE_JSON_PATH)) as AccountNavGateJson;
    const full = readRepoRoot("scripts/dev/smoke-account-nav-full-local.sh");
    expect(gate.green_scripts.full_smoke).toBe("scripts/dev/smoke-account-nav-full-local.sh");
    expect(full).toContain("TT_ACCOUNT_NAV_FULL_SMOKE: OK");
    expect(full).toContain("PLAYWRIGHT_FULL=1");
    expect(full).toContain("community-me-hub-tab-redirect-matrix.spec.ts");
    expect(full).toContain("compact quick links drawer hides reports");
    expect(full).toContain("likes segment navigates");
    expect(full).toContain("COMMUNITY_ME_L5_GREEN_REUSE");
    const headerIa = readRepo("e2e/account-nav-header-ia.spec.ts");
    expect(headerIa).toContain("gotoWithHeaderNavSessionReady");
    expect(gate.playwright_matrix?.full_env).toBe("PLAYWRIGHT_FULL=1");
    const layerIds = gate.playwright_matrix?.layers.map((l) => l.id) ?? [];
    expect(layerIds).toEqual(["settings", "account_nav", "community_me"]);
    const community = readRepoRoot("scripts/dev/run-community-me-l5-green.sh");
    expect(community).toContain("SKIP_COMMUNITY_ME_VITEST");
  });

  it("P3 doc references unified tracker and child green scripts", () => {
    const p3 = readRepo("evidence/GO_local_auth_l5/ACCOUNT-NAV-NAMING-P3.md");
    expect(p3).toContain("accountNavPageTracker");
    expect(p3).toContain("smoke-account-nav-local.sh");
    expect(p3).toContain("工具");
    expect(p3).toContain("/community/me/reports");
  });

  it("account-nav-page-tracker.v1.json aligns with TS SSOT and green scripts", () => {
    const gate = JSON.parse(readRepo(GATE_JSON_PATH)) as AccountNavGateJson;
    expect(gate.schema).toBe(ACCOUNT_NAV_PAGE_TRACKER_SCHEMA);
    const jsonPaths = gate.routes.map((r) => r.path);
    for (const entry of ACCOUNT_NAV_UNIFIED_ROUTES_V1) {
      expect(jsonPaths, `JSON gate missing route ${entry.route}`).toContain(entry.route);
    }
    expect(gate.header_ia.reports_href).toBe(ACCOUNT_NAV_IA_CROSS_RULES_V1.reportsHref);
    for (const href of ACCOUNT_NAV_IA_CROSS_RULES_V1.hubMustNotDuplicateHrefs) {
      expect(gate.header_ia.hub_must_not_duplicate).toContain(href);
    }
    expect(gate.playwright_account_nav).toContain("e2e/account-nav-header-ia.spec.ts");
    const communityGreen = readRepoRoot(gate.green_scripts.community_me_green);
    expect(communityGreen).toContain("account-nav-header-ia.spec.ts");
    const unifiedSmoke = readRepoRoot(gate.green_scripts.unified_smoke);
    expect(unifiedSmoke).toContain("smoke-account-nav: OK");
    if (gate.related_gates?.me_settings_l5) {
      expect(readRepo(gate.related_gates.me_settings_l5)).toContain("traveltrust.me-settings-l5-local-gate.v1");
    }
  });
});
