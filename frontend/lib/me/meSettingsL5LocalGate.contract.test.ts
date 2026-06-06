import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ME_SETTINGS_PAGE_TRACKER_V1 } from "@/lib/me/meSettingsPageTracker.v1";

const ROOT = process.cwd();
const REPO = join(ROOT, "..");
const GATE_PATH = "evidence/GO_local_auth_l5/me-settings-l5-local-gate.v1.json";

type MeSettingsGateJson = {
  schema: string;
  routes: { path: string; role: string }[];
  vitest_union: string[];
  http_probe_paths: string[];
  hub_ia: { no_duplicate_header_hrefs: string[]; community_settings_back_href: string };
  green_script: string;
  green_summary_line: string;
  account_nav_full_smoke?: { script: string; summary_line: string; playwright_layer_env: string };
  related_gates: { account_nav: string; community_me_l5: string };
  playwright_optional: string[];
  playwright_env: string;
};

function readFrontend(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("me settings L5 local gate v1 (① · JSON SSOT)", () => {
  it("gate JSON routes match meSettingsPageTracker settings family", () => {
    const gate = JSON.parse(readFrontend(GATE_PATH)) as MeSettingsGateJson;
    expect(gate.schema).toBe("traveltrust.me-settings-l5-local-gate.v1");
    const jsonPaths = gate.routes.map((r) => r.path);
    const trackerPaths = ME_SETTINGS_PAGE_TRACKER_V1.map((e) => e.route);
    expect(jsonPaths).toEqual(trackerPaths);
    expect(gate.routes.find((r) => r.path === "/me/settings")?.role).toBe("hub");
  });

  it("smoke-me-settings-local.sh wires vitest union and HTTP probe paths", () => {
    const gate = JSON.parse(readFrontend(GATE_PATH)) as MeSettingsGateJson;
    const sh = readFileSync(join(REPO, gate.green_script), "utf8");
    expect(sh).toContain(gate.green_summary_line.replace(": OK", ""));
    expect(sh).toContain("me-settings-l5-local-gate.v1.json");
    for (const token of gate.vitest_union) {
      const pattern = token.replace("lib/me/", "meSettings").replace(".contract.test.ts", "").replace(".test.ts", "");
      const short = token.includes("/") ? token.split("/").pop()!.replace(".contract.test.ts", "").replace(".test.ts", "") : pattern;
      expect(sh, `smoke script missing vitest token for ${token}`).toMatch(new RegExp(short.replace(/\./g, "\\."), "i"));
    }
    for (const path of gate.http_probe_paths) {
      expect(sh).toContain(path);
    }
  });

  it("hub IA forbids duplicate header hrefs in nav model", () => {
    const gate = JSON.parse(readFrontend(GATE_PATH)) as MeSettingsGateJson;
    const nav = readFrontend("lib/me/meSettingsNavModel.ts");
    for (const href of gate.hub_ia.no_duplicate_header_hrefs) {
      expect(nav).not.toContain(`href: "${href}"`);
    }
    const back = readFrontend("components/me/CommunityMeSettingsBackLink.tsx");
    const hubPath = readFrontend("lib/me/meSettingsL5.ts");
    expect(back).toContain("ME_SETTINGS_HUB_PATH");
    expect(hubPath).toContain(`ME_SETTINGS_HUB_PATH = "${gate.hub_ia.community_settings_back_href}"`);
    const profilePage = readFrontend("app/me/settings/profile/MeSettingsProfilePageInner.tsx");
    expect(profilePage).not.toContain("/me/settings?from=community");
    const panel = readFrontend("components/me/MeSettingsProfilePanel.tsx");
    expect(panel).not.toContain("data-tt-community-me-settings-link");
    expect(panel).not.toContain("TT_COMMUNITY_ME_PANEL_L5");
  });

  it("related account-nav and community-me gates exist", () => {
    const gate = JSON.parse(readFrontend(GATE_PATH)) as MeSettingsGateJson;
    expect(readFrontend(gate.related_gates.account_nav)).toContain("traveltrust.account-nav-page-tracker.v1");
    expect(readFrontend(gate.related_gates.community_me_l5)).toContain("traveltrust.community-me-l5-local-gate.v1");
    expect(gate.playwright_optional).toContain("e2e/me-settings-l5-hub.spec.ts");
    expect(gate.playwright_env).toBe("PLAYWRIGHT_ME_SETTINGS=1");
    const sh = readFileSync(join(REPO, gate.green_script), "utf8");
    expect(sh).toContain("PLAYWRIGHT_ME_SETTINGS");
    expect(sh).toContain("me-settings-l5-hub.spec.ts");
    const hubSpec = readFrontend("e2e/me-settings-l5-hub.spec.ts");
    expect(hubSpec).toContain("gotoWithMeSettingsSessionReady");
    expect(readFrontend("lib/apiClient/index.ts")).toContain("getMeSessions");
  });

  it("account-nav full smoke includes settings family vitest union", () => {
    const gate = JSON.parse(readFrontend(GATE_PATH)) as MeSettingsGateJson;
    const full = readFileSync(join(REPO, gate.account_nav_full_smoke!.script), "utf8");
    expect(gate.account_nav_full_smoke?.summary_line).toBe("TT_ACCOUNT_NAV_FULL_SMOKE: OK");
    expect(full).toContain(gate.account_nav_full_smoke!.summary_line);
    expect(full).toContain(gate.account_nav_full_smoke!.playwright_layer_env);
    for (const token of ["meSettingsPageTracker", "meSettingsL5LocalGate", "meSettingsL5"]) {
      expect(full, `full smoke missing ${token}`).toContain(token);
    }
  });
});
