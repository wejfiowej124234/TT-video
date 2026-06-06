import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("me settings batch 14 deep flows (①)", () => {
  it("community logout uses header L5 confirm (not profile card row)", () => {
    const logout = readFileSync(join(ROOT, "components/header/HeaderUserMenuL5Logout.tsx"), "utf8");
    const card = readFileSync(join(ROOT, "components/me/communityMePage/CommunityMeAccountPanelProfileCard.tsx"), "utf8");
    expect(logout).toContain("data-tt-header-logout-l5");
    expect(card).not.toContain("MeLogoutL5Button");
  });

  it("notification prefs page wires PUT settings_preferences", () => {
    const page = readFileSync(join(ROOT, "app/me/settings/notifications-prefs/page.tsx"), "utf8");
    const api = readFileSync(join(ROOT, "lib/me/meSettingsPreferencesApi.ts"), "utf8");
    expect(page).toContain("useMeSettingsUserPreferences");
    expect(page).toContain("data-tt-me-settings-notif-prefs");
    expect(api).toContain("putMeSettingsPreferencesToApi");
    expect(readFileSync(join(ROOT, "components/me/MeSettingsSavedToast.tsx"), "utf8")).toContain(
      "data-tt-me-settings-saved-toast",
    );
  });

  it("F-025 dispute seed helper exists", () => {
    const seed = readFileSync(join(ROOT, "e2e/helpers/meSettingsF025DisputeSeed.ts"), "utf8");
    expect(seed).toContain("ensureDisputeIdForBearer");
    expect(seed).toContain("mock-pay");
    expect(seed).toContain("guideRowIdForSeedGuideAccount");
  });

  it("e2e spec covers batch 14 flows", () => {
    const spec = readFileSync(join(ROOT, "e2e/me-settings-l5-hub.spec.ts"), "utf8");
    const helpers = readFileSync(join(ROOT, "e2e/helpers/meSettingsE2e.ts"), "utf8");
    expect(spec).toContain("header logout from settings profile uses L5 confirm");
    expect(spec).toContain("notification prefs toggles persist across reload");
    expect(spec).toContain("ensureDisputeIdForBearer");
    expect(helpers).toContain("communityMeLogoutWithL5Confirm");
  });
});
