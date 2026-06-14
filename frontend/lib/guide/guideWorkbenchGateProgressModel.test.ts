import { describe, expect, it } from "vitest";
import type { MeGuideProfile } from "@/lib/apiClient/meGuideProfile";
import type { MeTrustSummary } from "@/lib/meTrust";
import { resolveGuideWorkbenchGateProgress } from "./guideWorkbenchGateProgressModel";

const t = (k: string) => k;

const baseTrust: MeTrustSummary = {
  kyc_status: "none",
  wallet_linked: true,
  guide_registration_status: "active",
  risk_level: "low",
};

const fullProfile: MeGuideProfile = {
  guide_id: "g1",
  city: "杭州",
  country_code: "CN",
  languages: ["zh"],
  service_types: ["walking"],
  bio: "bio",
  hourly_rate: "45",
};

describe("resolveGuideWorkbenchGateProgress", () => {
  it("returns null when registration active, kyc verified, listing complete, low risk", () => {
    const view = resolveGuideWorkbenchGateProgress({
      trust: { ...baseTrust, kyc_status: "verified" },
      profile: fullProfile,
      guideHasReceptionHistory: true,
      showInboxEmpty: false,
      t,
    });
    expect(view).toBeNull();
  });

  it("onboarding variant for new guide with kyc none", () => {
    const view = resolveGuideWorkbenchGateProgress({
      trust: baseTrust,
      profile: fullProfile,
      guideHasReceptionHistory: false,
      showInboxEmpty: true,
      t,
    });
    expect(view?.variant).toBe("onboarding");
    expect(view?.steps.find((s) => s.id === "kyc")?.state).toBe("action");
    expect(view?.primaryCta.kind).toBe("link");
  });

  it("primary CTA targets listing edit when kyc done but profile empty", () => {
    const view = resolveGuideWorkbenchGateProgress({
      trust: { ...baseTrust, kyc_status: "verified" },
      profile: { guide_id: "g1" },
      guideHasReceptionHistory: false,
      showInboxEmpty: true,
      t,
    });
    expect(view?.steps.find((s) => s.id === "listing")?.state).toBe("action");
    expect(view?.primaryCta.labelKey).toBe("guide_workbench_profile_summary_edit");
  });

  it("compact variant with risk strip when only risk anomaly remains", () => {
    const view = resolveGuideWorkbenchGateProgress({
      trust: {
        ...baseTrust,
        kyc_status: "verified",
        risk_level: "high",
        recommended_actions: ["review_payout"],
      },
      profile: fullProfile,
      guideHasReceptionHistory: true,
      showInboxEmpty: false,
      t,
    });
    expect(view?.variant).toBe("compact");
    expect(view?.showRiskStrip).toBe(true);
  });
});
