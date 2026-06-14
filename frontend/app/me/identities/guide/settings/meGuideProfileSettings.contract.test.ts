import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const FE = join(__dir, "..", "..", "..", "..", "..");
const read = (rel: string) => readFileSync(join(FE, rel), "utf8");

describe("me guide profile settings · ① contract", () => {
  it("guide settings page wires blocked/review panels and shared shell (P2 parity)", () => {
    const page = read("app/me/identities/guide/settings/MeGuideProfileSettingsPageInner.tsx");
    expect(page).toContain("IdentitySlotSettingsShell");
    expect(page).toContain("resolveGuideProfileSettingsBack");
    expect(page).toContain("useSearchParams");
    expect(page).toContain("IdentitySlotBlockedReasonsPanel");
    expect(page).toContain("IdentitySlotReviewStatusPanel");
    expect(page).toContain("resolveGuideProfileSettingsView");
    expect(page).toContain("showOnboardingPanels");
    expect(page).toContain("GuideProfileApplicationMaterialsPanel");
    expect(page).toContain("GUIDE_WORKSPACE_HREF");
    expect(page).toContain('"data-tt-me-guide-profile-settings": "1"');
    expect(page).toContain('"data-tt-me-guide-profile-active-edit": "1"');
  });

  it("P0 sprint: preview draft SSOT includes hourly_currency and local avatar upload", () => {
    const page = read("app/me/identities/guide/settings/MeGuideProfileSettingsPageInner.tsx");
    expect(page).toContain("buildGuideProfileMarketPreviewDraft");
    expect(read("lib/guide/guideProfileSettingsModel.ts")).toContain("hourly_currency");
    expect(read("components/me/identitySettings/IdentitySlotProfileImageField.tsx")).toContain(
      'data-tt-me-guide-profile-avatar-upload="1"',
    );
    expect(read("components/me/identitySettings/IdentitySlotProfileImageField.tsx")).toContain("GuideRegisterFileField");
    expect(page).not.toContain("GuideProfileSettingsActiveBar");
    expect(page).toContain("me_guide_profile_form_subtitle_edit_only");
    expect(page).toContain("dirtyOnly");
    expect(read("app/me/identities/guide/settings/GuideProfileMarketPreview.tsx")).toContain(
      "data-tt-me-guide-profile-preview-dirty-only",
    );
    expect(read("lib/guide/guideWorkbenchProfileSummaryModel.ts")).toContain("buildGuideProfileMarketPreviewDraft");
    expect(read("lib/guide/guideProfileSettingsValidation.ts")).toContain("validateGuideProfileForm");
    expect(read("app/me/identities/guide/settings/GuideProfileMarketPreview.tsx")).toContain(
      "data-tt-me-guide-profile-public-link",
    );
  });

  it("guide profile API client includes application_materials", () => {
    expect(read("lib/apiClient/meGuideProfile.ts")).toContain("application_materials");
    expect(read("lib/apiClient/meGuideProfile.ts")).toContain("MeGuideApplicationMaterials");
  });

  it("routes and page wire GET/PATCH /api/v1/me/guide-profile", () => {
    expect(read("lib/api/routes.ts")).toContain('meGuideProfile: "/api/v1/me/guide-profile"');
    expect(read("lib/apiClient/meGuideProfile.ts")).toContain("getMeGuideProfile");
    expect(read("lib/apiClient/meGuideProfile.ts")).toContain("patchMeGuideProfile");
    const page = read("app/me/identities/guide/settings/MeGuideProfileSettingsPageInner.tsx");
    expect(page).toContain("GuideProfileMarketPreview");
    expect(page).toContain("dirtyOnly");
    expect(page).toContain("data-tt-me-guide-profile-settings");
    expect(read("app/me/identities/guide/settings/GuideProfileMarketPreview.tsx")).toContain("GuideCard");
  });

  it("market preview uses GuideCard glass shell read-only", () => {
    const preview = read("app/me/identities/guide/settings/GuideProfileMarketPreview.tsx");
    expect(preview).toContain("GuideCard");
    expect(preview).toContain("previewOnly");
    expect(preview).not.toContain("onView={() => {}}");
    expect(preview).toContain('data-tt-me-guide-profile-preview="1"');
  });

  it("identities hub links active guides to settings (CTA · no layout change)", () => {
    const hub = read("app/me/identities/page.tsx");
    expect(hub).toContain("guideApplyHref");
    expect(hub).toContain("me_identities_card_guide_settings_cta");
    expect(read("lib/me/meIdentitiesProfileLinksModel.ts")).toContain("/me/identities/guide/settings");
  });

  it("admin guide applications queue mirrors provider pattern", () => {
    expect(read("lib/api/routes.ts")).toContain('adminGuideApplications: "/api/v1/admin/guide-applications"');
    expect(read("app/admin/guide-applications/AdminGuideApplicationsPageMain.tsx")).toContain(
      'data-tt-admin-onboarding-queue-list="guide"',
    );
    expect(read("components/admin/AdminGuideApplicationReviewCard.tsx")).toContain(
      'data-testid="admin-guide-application-review"',
    );
    expect(read("app/admin/users/[id]/AdminUserDetailPageMain.tsx")).toContain("AdminGuideApplicationReviewCard");
  });

  it("P3: public_title field wired end-to-end", () => {
    expect(read("lib/apiClient/meGuideProfile.ts")).toContain("public_title");
    expect(read("lib/guideDisplayName.ts")).toContain("public_title");
    const page = read("app/me/identities/guide/settings/MeGuideProfileSettingsPageInner.tsx");
    expect(page).toContain("me-guide-profile-public-title");
    expect(page).toContain("public_title:");
    expect(read("lib/guide/guideProfileSettingsValidation.ts")).toContain("MAX_LEN_PUBLIC_TITLE");
  });
});
