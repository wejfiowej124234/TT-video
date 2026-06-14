import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("me settings trust progress · ① contract", () => {
  it("trust page uses checklist progress panel and single data fetch hook", () => {
    const page = readFileSync(join(ROOT, "app/me/settings/trust/page.tsx"), "utf8");
    const hook = readFileSync(join(ROOT, "lib/me/useMeSettingsTrustPage.ts"), "utf8");
    const model = readFileSync(join(ROOT, "lib/me/meSettingsTrustProgressModel.ts"), "utf8");
    const panel = readFileSync(join(ROOT, "components/me/MeSettingsTrustProgressPanel.tsx"), "utf8");
    expect(page).toContain("MeSettingsTrustProgressPanel");
    expect(page).toContain("useMeSettingsTrustPage");
    expect(page).toContain("needsLogin");
    expect(hook).toContain("traveltrust:auth-change");
    expect(hook).toContain("getMeGuideProfile");
    expect(model).toContain("guide_registration");
    expect(model).toContain("guide_listing");
    expect(panel).toContain("me_settings_trust_login_required");
    expect(page).not.toContain("MeSettingsTrustKycStatusPanel");
    expect(page).not.toContain("MeSettingsL5Row");
    expect(page).not.toContain("me_settings_trust_actions_section");
  });

  it("progress model drives primary CTA priority email → wallet → kyc", () => {
    const model = readFileSync(join(ROOT, "lib/me/meSettingsTrustProgressModel.ts"), "utf8");
    expect(model).toContain("resolveMeSettingsTrustProgress");
    expect(model).toContain('kind: "email_resend"');
    expect(model).toContain("me_settings_trust_primary_verify_wallet");
  });

  it("progress panel exposes checklist, kyc detail anchor, and advanced details", () => {
    const panel = readFileSync(join(ROOT, "components/me/MeSettingsTrustProgressPanel.tsx"), "utf8");
    expect(panel).toContain("sectionCardInteractive");
    expect(panel).toContain("embedded");
    expect(panel).toContain("data-tt-me-settings-kyc-status");
    expect(panel).toContain("data-tt-me-settings-trust-advanced");
    expect(panel).toContain("me-settings-trust-kyc-detail");
  });
});
