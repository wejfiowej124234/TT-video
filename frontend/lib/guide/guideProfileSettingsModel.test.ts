import { describe, expect, it } from "vitest";
import { DEFAULT_SETTLEMENT_CURRENCY_CODE } from "@/lib/defaultSettlementCurrency";
import {
  buildGuideProfileMarketPreviewDraft,
  resolveGuideProfileSettingsView,
} from "./guideProfileSettingsModel";

describe("guideProfileSettingsModel", () => {
  it("active + patch allowed collapses onboarding panels", () => {
    const view = resolveGuideProfileSettingsView({
      application_status: "active",
      profile_patch_allowed: true,
      slot_state: "active",
    });
    expect(view.formReadOnly).toBe(false);
    expect(view.showOnboardingPanels).toBe(false);
  });

  it("active without patch gate bool falls back to editable via application_status", () => {
    const view = resolveGuideProfileSettingsView({
      application_status: "active",
      status: "active",
    });
    expect(view.patchGate.patchAllowed).toBe(true);
    expect(view.showOnboardingPanels).toBe(false);
  });

  it("pending review keeps onboarding panels and read-only form", () => {
    const view = resolveGuideProfileSettingsView({
      application_status: "pending",
      profile_patch_allowed: false,
      slot_state: "pending",
    });
    expect(view.formReadOnly).toBe(true);
    expect(view.showOnboardingPanels).toBe(true);
  });

  it("rejected keeps onboarding panels (not active-editable collapse)", () => {
    const view = resolveGuideProfileSettingsView({
      application_status: "rejected",
      profile_patch_allowed: false,
      slot_state: "restricted",
    });
    expect(view.showOnboardingPanels).toBe(true);
  });

  it("preview draft includes hourly_currency default (USDC)", () => {
    const draft = buildGuideProfileMarketPreviewDraft(
      { guide_id: "g1", hourly_rate: "45" },
      {
        countryCode: "CN",
        city: "杭州",
        publicTitle: "",
        languages: "zh, en",
        serviceTypes: "向导服务",
        bio: "bio",
        hourlyRate: "45",
        avatarUrl: "",
      },
      (raw) => raw ?? undefined,
    );
    expect(draft.hourly_currency).toBe(DEFAULT_SETTLEMENT_CURRENCY_CODE);
    expect(draft.hourly_rate).toBe("45");
    expect(draft.city).toBe("杭州");
  });

  it("preview draft uses public_title when set", () => {
    const draft = buildGuideProfileMarketPreviewDraft(
      { guide_id: "g1", city: "杭州" },
      {
        countryCode: "CN",
        city: "杭州",
        publicTitle: "西湖文化向导",
        languages: "zh",
        serviceTypes: "向导服务",
        bio: "",
        hourlyRate: "",
        avatarUrl: "",
      },
      (raw) => raw ?? undefined,
    );
    expect(draft.public_title).toBe("西湖文化向导");
  });
});
