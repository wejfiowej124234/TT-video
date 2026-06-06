import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { ME_SETTINGS_PAGE_TRACKER_V1 } from "@/lib/me/meSettingsPageTracker.v1";

const ROOT = process.cwd();
const REPO = join(ROOT, "..");

describe("me settings batch 20 deep flows (①)", () => {
  it("FREEZE documents batch 20 closure", () => {
    const freeze = readFileSync(
      join(ROOT, "evidence/GO_local_auth_l5/ME-SETTINGS-L5-FREEZE.md"),
      "utf8",
    );
    expect(freeze).toContain("**20**");
    expect(freeze).toContain("PLAYWRIGHT_ME_SETTINGS_BATCH20.log");
    expect(freeze).toContain("hub-status-wallet");
    expect(freeze).toContain("data-tt-me-settings-hub-status-wallet");
  });

  it("page tracker hub and security include batch 19–20 data-tt anchors", () => {
    const hub = ME_SETTINGS_PAGE_TRACKER_V1.find((e) => e.route === "/me/settings");
    const security = ME_SETTINGS_PAGE_TRACKER_V1.find((e) => e.route === "/me/security");
    expect(hub?.mustContain).not.toContain("data-tt-me-settings-hub-status-wallet");
    expect(hub?.mustNotContain).toContain("MeSettingsHubStatusStrip");
    expect(security?.mustContain).toContain("data-tt-me-security-revoke-suffix");
    expect(security?.mustContain).toContain("me-security-wallet");
  });

  it("nav model exposes wallet verify row in travel section", () => {
    const nav = readFileSync(join(ROOT, "lib/me/meSettingsNavModel.ts"), "utf8");
    expect(nav).toContain('meSecurityHref("wallet")');
    expect(nav).toContain("me_settings_item_wallet");
  });

  it("e2e covers batch 20 hub wallet, suffix revoke refresh, event_type filter", () => {
    const spec = readFileSync(join(ROOT, "e2e/me-settings-l5-hub.spec.ts"), "utf8");
    expect(spec).toContain("hub wallet nav row deep-links");
    expect(spec).toContain("afterCount");
    expect(spec).toContain("sessionCount - 1");
    expect(spec).toContain("security notifications filter by event_type password_changed");
    expect(spec).toContain('event_type") === "password_changed"');
  });

  it("smoke script preflights API health and uses BATCH20 log", () => {
    const meSmoke = readFileSync(join(REPO, "scripts/dev/smoke-me-settings-local.sh"), "utf8");
    expect(meSmoke).toContain("meSettingsBatch20Deep.contract");
    expect(meSmoke).toMatch(/PLAYWRIGHT_ME_SETTINGS_BATCH20\.log/);
    expect(meSmoke).toContain("PLAYWRIGHT_REUSE_API_SERVER");
  });
});
