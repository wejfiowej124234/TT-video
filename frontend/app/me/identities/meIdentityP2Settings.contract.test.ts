import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const FE = join(__dir, "..", "..", "..");
const read = (rel: string) => readFileSync(join(FE, rel), "utf8");

describe("me identity P2 settings · ① contract", () => {
  it("routes and API clients wire merchant/steward/acquisition profile endpoints", () => {
    const routes = read("lib/api/routes.ts");
    expect(routes).toContain('meMerchantProfile: "/api/v1/me/merchant-profile"');
    expect(routes).toContain('meRegionStewardProfile: "/api/v1/me/region-steward-profile"');
    expect(routes).toContain('meAcquisitionProfile: "/api/v1/me/acquisition-profile"');

    expect(read("lib/apiClient/meMerchantProfile.ts")).toContain("getMeMerchantProfile");
    expect(read("lib/apiClient/meMerchantProfile.ts")).toContain("patchMeMerchantProfile");
    expect(read("lib/apiClient/meStewardProfile.ts")).toContain("getMeStewardProfile");
    expect(read("lib/apiClient/meStewardProfile.ts")).toContain("patchMeStewardProfile");
    expect(read("lib/apiClient/meAcquisitionProfile.ts")).toContain("getMeAcquisitionProfile");
    expect(read("lib/apiClient/meAcquisitionProfile.ts")).toContain("patchMeAcquisitionProfile");
  });

  it("shared identity settings shell and panels exist", () => {
    expect(read("components/me/identitySettings/IdentitySlotSettingsShell.tsx")).toContain("MeSettingsL5FlowPage");
    expect(read("components/me/identitySettings/IdentitySlotReviewStatusPanel.tsx")).toContain(
      'data-tt-identity-slot-review-status="1"',
    );
    expect(read("components/me/identitySettings/IdentitySlotReviewStatusPanel.tsx")).toContain(
      "resolveIdentitySlotReviewStatusView",
    );
    expect(read("components/me/identitySettings/IdentitySlotReviewStatusPanel.tsx")).not.toMatch(
      /rejectionMessage\?\.trim\(\)/,
    );
    expect(read("components/me/identitySettings/IdentitySlotBlockedReasonsPanel.tsx")).toContain(
      "resolveIdentitySlotBlockedReasonKeys",
    );
    expect(read("lib/me/identitySlotReviewStatusModel.ts")).toContain(
      "identitySlotReviewShowsRejectionDetails",
    );
    expect(read("lib/me/identitySlotReviewStatusModel.ts")).toContain(
      "filterIdentitySlotBlockedReasonKeysForApplicationStatus",
    );
  });

  it("four-track settings pass applicationStatus into blocked/review panels consistently", () => {
    for (const rel of [
      "app/me/identities/guide/settings/MeGuideProfileSettingsPageInner.tsx",
      "app/me/identities/merchant/settings/MeMerchantProfileSettingsPageInner.tsx",
      "app/me/identities/region-steward/settings/MeStewardProfileSettingsPageInner.tsx",
      "app/me/identities/acquisition/settings/MeAcquisitionProfileSettingsPageInner.tsx",
    ]) {
      const page = read(rel);
      expect(page).toContain("IdentitySlotBlockedReasonsPanel");
      expect(page).toContain("IdentitySlotReviewStatusPanel");
      expect(page).toContain("applicationStatus={");
    }
  });

  it("guide settings page wires blocked/review panels (four-track parity)", () => {
    const page = read("app/me/identities/guide/settings/MeGuideProfileSettingsPageInner.tsx");
    expect(page).toContain("IdentitySlotBlockedReasonsPanel");
    expect(page).toContain("IdentitySlotReviewStatusPanel");
    expect(page).toContain("resolveGuideProfileSettingsView");
    expect(page).toContain("IdentitySlotSettingsPatchGatePanel");
    expect(page).toContain("data-tt-me-guide-profile-readonly");
  });

  it("four-track settings mirror API profile_patch_allowed gate", () => {
    expect(read("lib/me/identitySlotSettingsGate.ts")).toContain("profile_patch_allowed");
    expect(read("lib/guide/guideProfileSettingsModel.ts")).toContain("resolveIdentityProfilePatchGate");
    for (const rel of [
      "app/me/identities/merchant/settings/MeMerchantProfileSettingsPageInner.tsx",
      "app/me/identities/region-steward/settings/MeStewardProfileSettingsPageInner.tsx",
      "app/me/identities/acquisition/settings/MeAcquisitionProfileSettingsPageInner.tsx",
    ]) {
      const page = read(rel);
      expect(page).toContain("IdentitySlotSettingsPatchGatePanel");
      expect(page).toContain("resolveIdentityProfilePatchGate");
    }
    const guidePage = read("app/me/identities/guide/settings/MeGuideProfileSettingsPageInner.tsx");
    expect(guidePage).toContain("IdentitySlotSettingsPatchGatePanel");
    expect(guidePage).toContain("resolveGuideProfileSettingsView");
    expect(read("lib/mapOrderWriteError.ts")).toContain("identity_slot_profile_patch_forbidden");
  });

  it("merchant settings page wires form, review panel, conditional preview, workspace links", () => {
    const page = read("app/me/identities/merchant/settings/MeMerchantProfileSettingsPageInner.tsx");
    expect(page).toContain("MerchantProfileMarketPreview");
    expect(page).toContain("!fromProviderWorkbench && !formReadOnly && isDirty");
    expect(page).toContain("fromProviderWorkbench");
    expect(page).toContain("IdentitySlotReviewStatusPanel");
    expect(page).toContain("ME_IDENTITIES_MERCHANT_WORKSPACE_HREF");
    expect(page).toContain('"data-tt-me-merchant-profile-settings": "1"');
    const preview = read("components/me/identitySettings/MerchantProfileMarketPreview.tsx");
    expect(preview).toContain("MarketSubsiteMasonry");
    expect(preview).toContain("previewOnly");
    expect(preview).toContain("dirtyOnly");
  });

  it("steward settings page has read-only jurisdictions and editable motivation", () => {
    const page = read("app/me/identities/region-steward/settings/MeStewardProfileSettingsPageInner.tsx");
    expect(page).toContain('data-tt-me-steward-profile-readonly="1"');
    expect(page).toContain("me-steward-profile-motivation");
    expect(page).toContain('"data-tt-me-steward-profile-settings": "1"');
  });

  it("acquisition settings page has trust strip and masonry preview", () => {
    const page = read("app/me/identities/acquisition/settings/MeAcquisitionProfileSettingsPageInner.tsx");
    expect(page).toContain('data-tt-me-acquisition-profile-trust="1"');
    expect(page).toContain("me_acquisition_profile_trust_bond_note");
    expect(page).toContain("AcquisitionProfileMarketPreview");
    const preview = read("components/me/identitySettings/AcquisitionProfileMarketPreview.tsx");
    expect(preview).toContain("acquisitionToMasonryItem");
    expect(preview).toContain("me_acquisition_profile_preview_bounty_demo_note");
  });

  it("identities hub links active slots to workspaces (settings secondary)", () => {
    const hub = read("app/me/identities/page.tsx");
    expect(hub).toContain("useMeIdentitiesProfileLinkThumbs");
    expect(hub).toContain("ME_IDENTITIES_MERCHANT_WORKSPACE_HREF");
    expect(hub).toContain("me_identities_card_merchant_workspace_cta");
    expect(hub).toContain("deriveMeIdentitiesAcquisitionCardView");
    expect(read("lib/me/meIdentitiesAcquisitionHubModel.ts")).toContain(
      "me_identities_card_acquisition_workspace_cta",
    );
    expect(hub).toContain("ME_IDENTITIES_STEWARD_WORKSPACE_HREF");
    expect(hub).toContain("me_identities_card_steward_workspace_cta");
    const model = read("lib/me/meIdentitiesCoreCardModel.ts");
    expect(model).toContain('ME_IDENTITIES_STEWARD_WORKSPACE_HREF = "/governance?view=region"');
    expect(model).toContain('ME_IDENTITIES_ACQUISITION_WORKSPACE_HREF = "/market/acquisition"');
  });

  it("Hub P2-3 wires blocked_reason lines on identity cards", () => {
    const hub = read("app/me/identities/page.tsx");
    expect(hub).toContain("useMeIdentityHubBlockedReasons");
    expect(hub).toContain("blockedReasonBySurface");
    expect(read("components/me/MeIdentitiesL5IdentityCard.tsx")).toContain("blockedReasonLines");
    expect(read("components/me/MeIdentitiesL5IdentityCard.tsx")).toContain(
      "data-tt-me-identities-card-blocked",
    );
    expect(read("lib/me/identitySlotBlockedReasonsModel.ts")).toContain(
      "ME_IDENTITIES_HUB_BLOCKED_REASON_MAX_LINES",
    );
    expect(read("lib/me/useMeIdentityHubBlockedReasons.ts")).toContain("applicationStatus");
  });
});
