import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ME_SETTINGS_PROFILE_PATH, TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import {
  profileCompletenessPercent,
  resolveProfileWalletDisplay,
} from "@/lib/me/meSettingsProfileDisplay";

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("me settings profile L5 (①)", () => {
  it("profile path and panel markers", () => {
    expect(ME_SETTINGS_PROFILE_PATH).toBe("/me/settings/profile");
    const page = read("app/me/settings/profile/MeSettingsProfilePageInner.tsx");
    const panel = read("components/me/MeSettingsProfilePanel.tsx");
    expect(page).toContain("MeSettingsProfilePanel");
    expect(page).not.toContain("CommunityMeAccountPanel");
    expect(page).not.toContain("TT_COMMUNITY_PAGE_L5");
    expect(panel).toContain('data-tt-me-settings-profile-panel="1"');
    expect(panel).toContain("MeSettingsProfileEditForm");
    expect(panel).toContain("MeSettingsProfileAccountDetails");
    expect(panel).not.toContain("MeProfileSection");
    expect(panel).not.toContain("MeSettingsProfileCommunityLinks");
    expect(panel).not.toContain("data-tt-me-settings-profile-content-links");
  });

  it("single edit CTA on identity card; inline form when editing", () => {
    const identity = read("components/me/MeSettingsProfileIdentityCard.tsx");
    const details = read("components/me/MeSettingsProfileDetails.tsx");
    expect(identity).toContain("profileIdentityEditBtn");
    expect(identity).not.toContain("profileIdentityEditBtnPrimary");
    expect(identity).toContain("data-tt-me-settings-profile-avatar-load-failed");
    expect(details).not.toContain("me_editProfile");
    expect(read("components/me/MeSettingsProfilePanel.tsx")).toContain("onCancelEdit");
  });

  it("avatar upload errors map to profile-specific i18n", () => {
    const mapper = read("lib/me/mapProfileAvatarUploadError.ts");
    expect(mapper).toContain("me_settings_profile_avatar_upload_server_disabled");
    expect(read("components/me/communityMePage/useCommunityMeAccountPanelAvatar.ts")).toContain(
      "mapProfileAvatarUploadError",
    );
  });

  it("wallet display resolves connected-but-unsaved", () => {
    const t = (key: string, vars?: Record<string, string>) =>
      key === "me_settings_profile_wallet_connected_unsaved"
        ? `Connected ${vars?.wallet ?? ""}`
        : key;
    const r = resolveProfileWalletDisplay(t, "", "0x1234567890abcdef1234567890abcdef12345678");
    expect(r.kind).toBe("connected_unsaved");
    expect(r.displayText).toContain("0x");
  });

  it("completeness percent respects avatar nickname wallet", () => {
    const pct = profileCompletenessPercent(
      { nickname: "A", avatar_url: "https://x/a.png", default_wallet_address: "0xabc" },
      false,
    );
    expect(pct).toBe(100);
  });

  it("L5 tokens include profile field groups and completeness", () => {
    expect(TT_ME_SETTINGS_L5.profileFieldGroupTitle).toContain("ref-sun");
    expect(TT_ME_SETTINGS_L5.profileCompletenessTrack).toBeTruthy();
    expect(TT_ME_SETTINGS_L5.profileIdentityEditBtn).toContain("min-h-[44px]");
    expect(TT_ME_SETTINGS_L5.profileAvatarLoadFailed).toBeTruthy();
  });

  it("useMePage sends bio on save when feature enabled", () => {
    const hook = read("components/me/useMePage.ts");
    expect(hook).toContain("bio:");
    expect(hook).toContain("isCommunityMeBioEnabled");
  });
});
