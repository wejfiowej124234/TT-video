import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const REPO = join(ROOT, "..");
const GATE_PATH = "evidence/GO_local_auth_l5/me-settings-l5-local-gate.v1.json";

describe("me settings batch 19 deep flows (①)", () => {
  it("FREEZE documents batch 19 closure", () => {
    const freeze = readFileSync(
      join(ROOT, "evidence/GO_local_auth_l5/ME-SETTINGS-L5-FREEZE.md"),
      "utf8",
    );
    expect(freeze).toContain("**19**");
    expect(freeze).toContain("PLAYWRIGHT_ME_SETTINGS_BATCH19.log");
    expect(freeze).toContain("me_settings_e2e_sent");
  });

  it("local gate hub does not list status strip chips", () => {
    const gate = JSON.parse(readFileSync(join(ROOT, GATE_PATH), "utf8")) as {
      routes: { path: string; markers_extra?: string[] }[];
    };
    const hub = gate.routes.find((r) => r.path === "/me/settings");
    expect(hub?.markers_extra).not.toContain("data-tt-me-settings-hub-status-notifications");
    expect(hub?.markers_extra).toContain("data-tt-me-settings-flash-banner");
  });

  it("dual-session browser helper and playwright api timeout bump", () => {
    const helpers = readFileSync(join(ROOT, "e2e/helpers/meSettingsE2e.ts"), "utf8");
    const pw = readFileSync(join(ROOT, "playwright.config.ts"), "utf8");
    expect(helpers).toContain("loginTouristDualSessionViaBrowser");
    expect(helpers).toContain("fillAndSubmitLoginForm");
    expect(pw).toContain("PLAYWRIGHT_E2E_STABILITY");
    expect(pw).toContain("600_000");
  });

  it("extension Playwright coverage includes batch 18–19 security flows", () => {
    const cov = readFileSync(
      join(ROOT, "lib/me/meSettingsExtensionPlaywrightCoverage.contract.test.ts"),
      "utf8",
    );
    const spec = readFileSync(join(ROOT, "e2e/me-settings-l5-hub.spec.ts"), "utf8");
    expect(cov).toContain("BATCH_18_19_SECURITY_FLOWS");
    expect(spec).toContain("hub security events nav row deep-links");
    expect(spec).toContain("security notifications filter by delivery_status sent");
    expect(spec).toContain("loginTouristDualSessionViaBrowser");
  });

  it("smoke scripts use BATCH19 log and batch 19 vitest", () => {
    const meSmoke = readFileSync(join(REPO, "scripts/dev/smoke-me-settings-local.sh"), "utf8");
    expect(meSmoke).toContain("meSettingsBatch19Deep.contract");
    expect(meSmoke).toMatch(/PLAYWRIGHT_ME_SETTINGS_BATCH(?:19|20)\.log/);
  });
});
