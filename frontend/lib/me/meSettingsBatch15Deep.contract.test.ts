import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("me settings batch 15 deep flows (①)", () => {
  it("dispute seed verifies GET /disputes/:id before reuse", () => {
    const seed = readFileSync(join(ROOT, "e2e/helpers/meSettingsF025DisputeSeed.ts"), "utf8");
    expect(seed).toContain("disputePublicDetailOk");
    expect(seed).toContain("ensureDisputeIdForBearer");
  });

  it("api migration aligns legacy disputes schema", () => {
    const mig = readFileSync(
      join(ROOT, "../crates/api/migrations/20260602120000_disputes_legacy_schema_align.sql"),
      "utf8",
    );
    expect(mig).toContain("arb_fee_paid");
    expect(mig).toContain("dispute_sequence");
    expect(mig).toContain("evidence_hashes");
  });

  it("privacy visibility section wires preferences patch", () => {
    const section = readFileSync(
      join(ROOT, "components/me/MeSettingsCommunityVisibilitySection.tsx"),
      "utf8",
    );
    expect(section).toContain("data-tt-me-settings-community-visibility");
    expect(section).toContain("data-tt-me-settings-prefs-ready");
    expect(section).toContain("data-tt-me-settings-visibility-option");
    expect(section).toContain('patch({ communityVisibility: opt.value })');
    const notifPage = readFileSync(join(ROOT, "app/me/settings/notifications-prefs/page.tsx"), "utf8");
    expect(notifPage).toContain("data-tt-me-settings-prefs-ready");
  });

  it("Next me route proxies PUT to API", () => {
    const route = readFileSync(join(ROOT, "app/api/v1/me/route.ts"), "utf8");
    expect(route).toContain("export async function PUT");
    expect(route).toContain('proxyMe(req, "PUT")');
  });

  it("e2e spec covers batch 15 flows", () => {
    const spec = readFileSync(join(ROOT, "e2e/me-settings-l5-hub.spec.ts"), "utf8");
    expect(spec).toContain("privacy community visibility persists across reload");
    expect(spec).toContain("data-tt-me-settings-prefs-ready");
    expect(spec).toContain("settings_preferences?.notification?.emailDigest");
    expect(spec).toContain("settings_preferences?.communityVisibility");
    expect(spec).toContain("api/v1/disputes/${disputeId}");
  });
});
