import { describe, expect, it } from "vitest";
import { resolveMeSettingsTrustProgress } from "./meSettingsTrustProgressModel";
import type { MeTrustSummary } from "@/lib/meTrust";

const t = (k: string) => k;

const baseTrust: MeTrustSummary = {
  kyc_status: "verified",
  wallet_linked: true,
  guide_registration_status: null,
  risk_level: "low",
};

describe("meSettingsTrustProgressModel", () => {
  it("prioritizes email verification as primary CTA", () => {
    const view = resolveMeSettingsTrustProgress({
      emailVerified: false,
      trust: { ...baseTrust, wallet_linked: false, kyc_status: "none" },
      t,
    });
    expect(view.primaryCta.kind).toBe("email_resend");
    expect(view.checklist.find((s) => s.id === "wallet")?.state).toBe("blocked");
    expect(view.coreComplete).toBe(false);
  });

  it("routes to wallet after email is verified", () => {
    const view = resolveMeSettingsTrustProgress({
      emailVerified: true,
      trust: { ...baseTrust, wallet_linked: false },
      t,
    });
    expect(view.primaryCta).toMatchObject({ kind: "link", labelKey: "me_settings_trust_primary_verify_wallet" });
    expect(view.checklist.find((s) => s.id === "wallet")?.state).toBe("action");
  });

  it("marks kyc pending without wallet primary override", () => {
    const view = resolveMeSettingsTrustProgress({
      emailVerified: true,
      trust: { ...baseTrust, wallet_linked: true, kyc_status: "pending" },
      t,
    });
    expect(view.checklist.find((s) => s.id === "kyc")?.state).toBe("pending");
    expect(view.showKycDetail).toBe(true);
  });

  it("wallet blocked while linked shows locked status not bound badge", () => {
    const view = resolveMeSettingsTrustProgress({
      emailVerified: false,
      trust: { ...baseTrust, wallet_linked: true, kyc_status: "none" },
      t,
    });
    const wallet = view.checklist.find((s) => s.id === "wallet");
    expect(wallet?.state).toBe("blocked");
    expect(wallet?.statusText).toBe("me_settings_trust_step_status_locked");
    expect(wallet?.descKey).toBe("me_settings_trust_step_wallet_desc_blocked_linked");
    expect(view.showKycDetail).toBe(false);
  });

  it("shows complete state when core steps done", () => {
    const view = resolveMeSettingsTrustProgress({
      emailVerified: true,
      trust: baseTrust,
      t,
    });
    expect(view.primaryCta.kind).toBe("complete");
    expect(view.coreComplete).toBe(true);
    expect(view.showKycDetail).toBe(false);
  });

  it("guide operator adds registration and listing steps; listing CTA when incomplete", () => {
    const view = resolveMeSettingsTrustProgress({
      emailVerified: true,
      trust: { ...baseTrust, guide_registration_status: "active" },
      guideOperator: true,
      guideProfile: { guide_id: "g1" },
      t,
    });
    expect(view.showGuideAdmissionSection).toBe(true);
    expect(view.checklist.some((s) => s.id === "guide_listing")).toBe(true);
    expect(view.primaryCta).toMatchObject({
      kind: "link",
      labelKey: "me_settings_trust_primary_guide_listing",
    });
  });

  it("guide operator complete when registration active and listing full", () => {
    const view = resolveMeSettingsTrustProgress({
      emailVerified: true,
      trust: { ...baseTrust, guide_registration_status: "active" },
      guideOperator: true,
      guideProfile: {
        guide_id: "g1",
        city: "杭州",
        languages: ["zh"],
        service_types: ["walking"],
        bio: "bio",
        hourly_rate: "45",
      },
      t,
    });
    expect(view.coreComplete).toBe(true);
    expect(view.checklist.find((s) => s.id === "guide_listing")?.state).toBe("done");
  });
});
