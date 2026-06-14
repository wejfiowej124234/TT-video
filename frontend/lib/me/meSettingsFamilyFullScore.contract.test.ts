import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const SETTINGS_FAMILY_PATHS = [
  "app/me/settings/MeSettingsPageInner.tsx",
  "app/me/settings/notifications-prefs/page.tsx",
  "app/me/settings/privacy/page.tsx",
  "app/me/settings/data/page.tsx",
  "app/me/settings/trust/page.tsx",
  "app/me/onboarding/MeOnboardingPageMain.tsx",
  "app/terms/community-guidelines/page.tsx",
  "app/steward/register/StewardRegisterPageMain.tsx",
  "app/guide/page.tsx",
  "app/me/security/useMeSecurityPage.ts",
  "app/me/security/MeSecurityPageMain.tsx",
  "components/me/MeSettingsLogoutButton.tsx",
  "components/me/MeLogoutL5Button.tsx",
  "components/header/HeaderUserMenuL5Logout.tsx",
  "components/me/MeSettingsL5ConfirmDialog.tsx",
] as const;

describe("me settings family · 100% L5 score gates (①)", () => {
  it("settings family destructive flows use L5 confirm not window.confirm", () => {
    for (const rel of SETTINGS_FAMILY_PATHS) {
      const src = readFileSync(join(ROOT, rel), "utf8");
      expect(src, rel).not.toContain("window.confirm");
    }
  });

  it("L5 confirm dialog exposes machine-read marker", () => {
    const dialog = readFileSync(join(ROOT, "components/me/MeSettingsL5ConfirmDialog.tsx"), "utf8");
    expect(dialog).toContain('data-tt-me-settings-confirm');
    expect(dialog).toContain("role=\"alertdialog\"");
    expect(dialog).toContain("useFocusTrap");
  });

  it("notification prefs page has functional toggles not comingSoon rows", () => {
    const page = readFileSync(join(ROOT, "app/me/settings/notifications-prefs/page.tsx"), "utf8");
    expect(page).toContain("MeSettingsL5ToggleRow");
    expect(page).not.toContain("comingSoon: true");
    expect(page).not.toContain("me_settings_notif_prefs_p3_notice");
  });

  it("data page uses L5 action rows and request dialog", () => {
    const page = readFileSync(join(ROOT, "app/me/settings/data/page.tsx"), "utf8");
    expect(page).toContain("MeSettingsL5ActionRow");
    expect(page).toContain("MeSettingsDataRequestDialog");
    expect(page).toContain("buildMeSettingsDataExportPackage");
    expect(page).toContain("data-tt-me-settings-data-export");
    expect(page).not.toContain("comingSoon: true");
  });

  it("preferences sync to PUT /me settings_preferences", () => {
    const api = readFileSync(join(ROOT, "lib/me/meSettingsPreferencesApi.ts"), "utf8");
    const hook = readFileSync(join(ROOT, "hooks/useMeSettingsUserPreferences.ts"), "utf8");
    expect(api).toContain("putMeSettingsPreferencesToApi");
    expect(api).toContain("settings_preferences");
    expect(hook).toContain("fetchMeSettingsPreferencesFromApi");
    expect(hook).toContain("putMeSettingsPreferencesToApi");
  });

  it("authL5 header logout uses L5 confirm marker", () => {
    const menu = readFileSync(join(ROOT, "components/header/HeaderUserMenu.tsx"), "utf8");
    const logout = readFileSync(join(ROOT, "components/header/HeaderUserMenuL5Logout.tsx"), "utf8");
    expect(menu).toContain("HeaderUserMenuL5Logout");
    expect(logout).toContain("data-tt-header-logout-l5");
    expect(logout).toContain("MeSettingsL5ConfirmDialog");
  });

  it("privacy page embeds community visibility section", () => {
    const page = readFileSync(join(ROOT, "app/me/settings/privacy/page.tsx"), "utf8");
    expect(page).toContain("MeSettingsCommunityVisibilitySection");
    expect(page).toContain("MeSettingsCommunityLikesPrivacySection");
    expect(page).not.toContain("me_settings_privacy_p3_notice");
    expect(page).not.toContain("partialSoon: true");
  });

  it("trust subpage shows progress checklist and advanced transparency section", () => {
    const page = readFileSync(join(ROOT, "app/me/settings/trust/page.tsx"), "utf8");
    const panel = readFileSync(join(ROOT, "components/me/MeSettingsTrustProgressPanel.tsx"), "utf8");
    const model = readFileSync(join(ROOT, "lib/me/meSettingsTrustProgressModel.ts"), "utf8");
    expect(page).toContain("MeSettingsTrustProgressPanel");
    expect(panel).toContain("data-tt-me-settings-kyc-status");
    expect(model).toContain("resolveMeSettingsTrustProgress");
    expect(model).toContain("formatKycStatusLabelCompact");
    expect(page).toContain("useMeSettingsTrustPage");
    expect(page).not.toContain("me_settings_trust_actions_section");
  });

  it("onboarding from settings uses settings L5 flow without ProductCrossNav branch", () => {
    const page = readFileSync(join(ROOT, "app/me/onboarding/MeOnboardingPageMain.tsx"), "utf8");
    expect(page).toContain("data-tt-me-onboarding-from-settings");
    expect(page).toContain("!fromSettings");
  });

  it("preferences storage is user-scoped v2", () => {
    const storage = readFileSync(join(ROOT, "lib/me/meSettingsPreferencesStorage.ts"), "utf8");
    expect(storage).toContain("tt_me_settings_prefs_v2_");
    expect(storage).toContain("migrateLegacyMeSettingsPreferences");
  });

  it("settings error boundary is L5 flow with machine-read route marker", () => {
    const err = readFileSync(join(ROOT, "app/me/settings/error.tsx"), "utf8");
    expect(err).toContain('data-tt-me-settings-route": "error"');
    expect(err).toContain("MeSettingsL5FlowPage");
    expect(err).not.toContain("window.confirm");
  });

  it("hub flash dismiss clears query via router.replace", () => {
    const hook = readFileSync(join(ROOT, "lib/me/useMeSettingsHubFlash.ts"), "utf8");
    expect(hook).toContain("parseMeSettingsFlash");
    expect(hook).toContain("router.replace(ME_SETTINGS_HUB_PATH)");
  });
});
