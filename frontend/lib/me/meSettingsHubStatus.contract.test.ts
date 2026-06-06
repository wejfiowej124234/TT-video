import { readFileSync } from "node:fs";

import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("me settings hub status (①)", () => {
  it("loads sessions and wallet status from apiClient", () => {
    const hook = readFileSync(join(ROOT, "lib/me/useMeSettingsHubStatus.ts"), "utf8");

    expect(hook).toContain("getMeSessions");
    expect(hook).toContain("getWalletVerificationStatus");
    expect(hook).toContain("setFailed(true)");
    expect(hook).not.toContain("revoked_at: null");
  });

  it("hub page does not render status strip (entries live in nav sections)", () => {
    const page = readFileSync(join(ROOT, "app/me/settings/MeSettingsPageInner.tsx"), "utf8");

    expect(page).not.toContain("MeSettingsHubStatusStrip");
    expect(page).not.toContain("data-tt-me-settings-hub-status");
    expect(page).toContain("useMeSettingsHubStatus");
    expect(page).toContain("MeSettingsHubSection");
  });

  it("nav model links security, wallet, and security events", () => {
    const nav = readFileSync(join(ROOT, "lib/me/meSettingsNavModel.ts"), "utf8");

    expect(nav).toContain('href: "/me/security"');
    expect(nav).toContain('meSecurityHref("wallet")');
    expect(nav).toContain('meSecurityHref("notifications")');
    expect(nav).not.toContain("me_settings_item_kyc");
  });

  it("nav enrich surfaces live session/wallet desc without hub strip", () => {
    const enrich = readFileSync(join(ROOT, "lib/me/meSettingsNavEnrich.ts"), "utf8");

    expect(enrich).toContain("me_settings_desc_security_live");
    expect(enrich).toContain("me_settings_desc_wallet_pending_row");
    expect(enrich).toContain("me_settings_desc_hub_status_failed");
    expect(enrich).not.toContain("kyc_status");
  });
});
