import { describe, expect, it } from "vitest";

import {
  deriveMeIdentitiesCoreCardView,
  deriveMeIdentitiesCorePhase,
  entitlementsViewForCoreSurface,
  ME_IDENTITIES_STEWARD_ACTIVE_HREF,
  parseMeIdentitiesCoreCardSignals,
  providerRegistrationDraftNonEmpty,
  type MeIdentitiesCoreCardSignals,
} from "./meIdentitiesCoreCardModel";
import { parseOnboardingEntitlementsView } from "./meOnboardingViewModel";

const HREFS = {
  applyHref: "/provider/register",
  onboardingHref: "/me/onboarding?role=provider&from=identities_hub",
  activeHref: "/market/provider",
};

function signals(partial: Partial<MeIdentitiesCoreCardSignals>): MeIdentitiesCoreCardSignals {
  return {
    surface: "provider",
    loggedIn: true,
    userRole: null,
    slotState: null,
    applicationStatus: null,
    hasRegistrationDraft: false,
    hasActivePaidEntitlement: false,
    hasPendingEntitlement: false,
    ...partial,
  };
}

describe("meIdentitiesCoreCardModel", () => {
  it("detects non-empty provider registration draft", () => {
    expect(providerRegistrationDraftNonEmpty({})).toBe(false);
    expect(providerRegistrationDraftNonEmpty({ v: 1 })).toBe(false);
    expect(providerRegistrationDraftNonEmpty({ v: 1, legalName: "Acme" })).toBe(true);
  });

  it("derives not_applied when logged out without draft", () => {
    expect(deriveMeIdentitiesCorePhase(signals({ loggedIn: false }))).toBe("not_applied");
  });

  it("derives draft when logged out but local/server draft exists", () => {
    expect(deriveMeIdentitiesCorePhase(signals({ loggedIn: false, hasRegistrationDraft: true }))).toBe("draft");
  });

  it("derives active when user role matches", () => {
    expect(deriveMeIdentitiesCorePhase(signals({ userRole: "provider" }))).toBe("active");
    expect(
      deriveMeIdentitiesCorePhase(signals({ surface: "steward", userRole: "region_steward" })),
    ).toBe("active");
  });

  it("derives restricted on rejection or slot restricted", () => {
    expect(deriveMeIdentitiesCorePhase(signals({ applicationStatus: "rejected" }))).toBe("restricted");
    expect(deriveMeIdentitiesCorePhase(signals({ slotState: "restricted" }))).toBe("restricted");
  });

  it("derives confirm_pending when paid entitlement but role not confirmed", () => {
    expect(
      deriveMeIdentitiesCorePhase(
        signals({ hasActivePaidEntitlement: true, applicationStatus: "approved" }),
      ),
    ).toBe("confirm_pending");
  });

  it("prefers reviewing over payment_pending while application in review", () => {
    expect(
      deriveMeIdentitiesCorePhase(
        signals({ applicationStatus: "submitted", hasPendingEntitlement: true }),
      ),
    ).toBe("reviewing");
    expect(
      deriveMeIdentitiesCorePhase(signals({ surface: "steward", applicationStatus: "under_review" })),
    ).toBe("reviewing");
  });

  it("prefers role_applications PG status over memory application", () => {
    const parsed = parseMeIdentitiesCoreCardSignals({
      surface: "provider",
      loggedIn: true,
      mePayload: { user: { role: "traveler" } },
      slotState: null,
      providerApplicationRaw: { application: { status: "draft" } },
      stewardApplicationRaw: null,
      entitlementsRaw: null,
      providerRegistrationDraft: null,
      roleApplications: [
        { id: "1", kind: "provider_onboarding", status: "submitted" },
      ],
    });
    expect(parsed.applicationStatus).toBe("submitted");
    expect(deriveMeIdentitiesCorePhase(parsed)).toBe("reviewing");
  });

  it("derives payment_pending after approval or pending entitlement", () => {
    expect(deriveMeIdentitiesCorePhase(signals({ applicationStatus: "approved" }))).toBe("payment_pending");
    expect(deriveMeIdentitiesCorePhase(signals({ hasPendingEntitlement: true }))).toBe("payment_pending");
    expect(deriveMeIdentitiesCorePhase(signals({ slotState: "pending" }))).toBe("payment_pending");
  });

  it("derives draft from steward application draft status", () => {
    expect(
      deriveMeIdentitiesCorePhase(
        signals({ surface: "steward", applicationStatus: "draft" }),
      ),
    ).toBe("draft");
  });

  it("maps phases to href + CTA", () => {
    const reviewing = deriveMeIdentitiesCoreCardView(
      signals({ applicationStatus: "reviewing" }),
      HREFS,
    );
    expect(reviewing.phase).toBe("reviewing");
    expect(reviewing.href).toBe("/provider/register");
    expect(reviewing.ctaLabelKey).toBe("me_identities_card_cta_review_progress");

    const pay = deriveMeIdentitiesCoreCardView(signals({ applicationStatus: "approved" }), HREFS);
    expect(pay.phase).toBe("payment_pending");
    expect(pay.href).toBe(HREFS.onboardingHref);
    expect(pay.ctaLabelKey).toBe("me_identities_card_cta_complete_payment");

    const active = deriveMeIdentitiesCoreCardView(signals({ userRole: "provider" }), HREFS);
    expect(active.phase).toBe("active");
    expect(active.href).toBe("/provider");
    expect(active.ctaLabelKey).toBe("me_identities_card_merchant_workspace_cta");

    const stewardActive = deriveMeIdentitiesCoreCardView(
      signals({ surface: "steward", userRole: "region_steward" }),
      {
        ...HREFS,
        applyHref: "/steward/register",
        activeHref: ME_IDENTITIES_STEWARD_ACTIVE_HREF,
      },
    );
    expect(stewardActive.phase).toBe("active");
    expect(stewardActive.href).toBe("/governance?view=region");
    expect(stewardActive.ctaLabelKey).toBe("me_identities_card_steward_workspace_cta");
  });

  it("parses entitlements by role_target", () => {
    const raw = {
      status: "ok",
      entitlements: [
        { id: "e1", role_target: "provider", sku: "p", status: "paid", paid_at: null, expires_at: null },
        { id: "e2", role_target: "region_steward", sku: "s", status: "pending", paid_at: null, expires_at: null },
      ],
    };
    const view = parseOnboardingEntitlementsView(raw);
    const providerOnly = entitlementsViewForCoreSurface(view, "provider");
    expect(providerOnly?.hasActivePaid).toBe(true);
    expect(providerOnly?.items).toHaveLength(1);
    const stewardOnly = entitlementsViewForCoreSurface(view, "steward");
    expect(stewardOnly?.hasActivePaid).toBe(false);
    expect(stewardOnly?.items[0]?.status).toBe("pending");
  });

  it("parseMeIdentitiesCoreCardSignals merges trust.provider_registration_status", () => {
    const parsed = parseMeIdentitiesCoreCardSignals({
      surface: "provider",
      loggedIn: true,
      mePayload: {
        user: { id: "u1", role: "tourist", email: "a@b.c" },
        trust: { provider_registration_status: "reviewing", kyc_status: "none", wallet_linked: false },
      },
      slotState: null,
      providerApplicationRaw: { status: "ok", application: null },
      stewardApplicationRaw: null,
      entitlementsRaw: null,
      providerRegistrationDraft: null,
    });
    expect(parsed.applicationStatus).toBe("reviewing");
    expect(deriveMeIdentitiesCorePhase(parsed)).toBe("reviewing");
  });
});
