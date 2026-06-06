import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("me settings batch 12 deep flows (①)", () => {
  it("verify-email route supports settings resend for unverified users", () => {
    const verify = readFileSync(join(ROOT, "app/auth/verify-email/page.tsx"), "utf8");
    expect(verify).toContain('searchParams.get("from") === "settings"');
    expect(verify).toContain("MeSettingsResendVerifyEmailPanel");
    const inner = readFileSync(join(ROOT, "app/me/settings/MeSettingsPageInner.tsx"), "utf8");
    expect(inner).not.toContain("MeSettingsHubStatusStrip");
  });

  it("header logout uses L5 confirm dialog marker", () => {
    const logout = readFileSync(join(ROOT, "components/header/HeaderUserMenuL5Logout.tsx"), "utf8");
    expect(logout).toContain("data-tt-header-logout-l5");
    expect(logout).toContain("MeSettingsL5ConfirmDialog");
    expect(logout).not.toContain("window.confirm");
  });

  it("delete-account feedback submit exposes machine-read success markers", () => {
    const page = readFileSync(join(ROOT, "app/community/feedback/page.tsx"), "utf8");
    expect(page).toContain("data-tt-community-feedback-delete-account-submitted");
    expect(page).toContain("data-tt-community-feedback-submit-ok");
    expect(page).toContain("postFeedback");
  });

  it("e2e helpers wire batch 12 flows", () => {
    const helpers = readFileSync(join(ROOT, "e2e/helpers/meSettingsE2e.ts"), "utf8");
    const spec = readFileSync(join(ROOT, "e2e/me-settings-l5-hub.spec.ts"), "utf8");
    expect(helpers).toContain("registerUnverifiedTouristCredentials");
    expect(helpers).toContain("headerLogoutWithL5Confirm");
    expect(spec).toContain("registerUnverifiedTouristCredentials");
    expect(spec).toContain("headerLogoutWithL5Confirm");
    expect(spec).toContain("data-tt-community-feedback-delete-account-submitted");
  });
});
