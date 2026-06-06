import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const REPO = join(ROOT, "..");
const GATE_PATH = "evidence/GO_local_auth_l5/me-settings-l5-local-gate.v1.json";

describe("me settings batch 18 deep flows (①)", () => {
  it("FREEZE documents batch 18 closure", () => {
    const freeze = readFileSync(
      join(ROOT, "evidence/GO_local_auth_l5/ME-SETTINGS-L5-FREEZE.md"),
      "utf8",
    );
    expect(freeze).toContain("**18**");
    expect(freeze).toContain("PLAYWRIGHT_ME_SETTINGS_BATCH18.log");
    expect(freeze).toContain("login_alert");
  });

  it("local gate documents security markers and api proxy paths", () => {
    const gate = JSON.parse(readFileSync(join(ROOT, GATE_PATH), "utf8")) as {
      routes: { path: string; markers_extra?: string[]; api_proxy_paths?: string[] }[];
    };
    const hub = gate.routes.find((r) => r.path === "/me/settings");
    const security = gate.routes.find((r) => r.path === "/me/security");
    expect(hub?.markers_extra).not.toContain("data-tt-me-settings-hub-status-sessions");
    expect(hub?.markers_extra).toContain("data-tt-me-settings-flash-banner");
    expect(security?.markers_extra).toContain("data-tt-me-security-revoke-suffix");
    expect(security?.api_proxy_paths).toContain("app/api/v1/me/sessions/route.ts");
  });

  it("nav model exposes sessions via account security row", () => {
    const nav = readFileSync(join(ROOT, "lib/me/meSettingsNavModel.ts"), "utf8");
    expect(nav).toContain('href: "/me/security"');
    expect(nav).toContain("me_settings_desc_security");
  });

  it("e2e uses real dual-session login helper without mock-first suffix", () => {
    const helpers = readFileSync(join(ROOT, "e2e/helpers/meSettingsE2e.ts"), "utf8");
    const spec = readFileSync(join(ROOT, "e2e/me-settings-l5-hub.spec.ts"), "utf8");
    expect(helpers).toContain("loginTouristWithSecondarySession");
    expect(spec).toContain("loginTouristWithSecondarySession");
    expect(spec).not.toContain('data-tt-me-security-revoke-suffix="e2e02"');
    expect(spec).toContain("hub account security row deep-links");
    expect(spec).toContain("security notifications expand and export json");
  });

  it("seed inserts me_settings_e2e_fixture notification", () => {
    const auth = readFileSync(join(REPO, "crates/api/src/chain_off/auth.rs"), "utf8");
    expect(auth).toContain("seed_me_settings_security_notification_fixture");
    expect(auth).toContain("me_settings_e2e_fixture");
  });

  it("smoke scripts include batch 18 vitest and BATCH18 playwright log", () => {
    const meSmoke = readFileSync(join(REPO, "scripts/dev/smoke-me-settings-local.sh"), "utf8");
    expect(meSmoke).toContain("meSettingsBatch18Deep.contract");
    expect(meSmoke).toMatch(/PLAYWRIGHT_ME_SETTINGS_BATCH(?:18|19|20)\.log/);
    const fullSmoke = readFileSync(join(REPO, "scripts/dev/smoke-account-nav-full-local.sh"), "utf8");
    expect(fullSmoke).toContain("meSettingsBatch18Deep.contract");
    expect(fullSmoke).toMatch(/PLAYWRIGHT_ACCOUNT_NAV_FULL\.log/);
  });
});
