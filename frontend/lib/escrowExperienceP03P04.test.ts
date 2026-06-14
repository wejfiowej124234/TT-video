import { describe, expect, it } from "vitest";
import {
  experienceConfirmBlockedReasonKey,
  isBilateralConfirmed,
  isBilateralPending,
  isGuideAcceptPending,
} from "./escrowExperienceP03P04";
import { orderAllowsConfirmFinalPlan } from "./escrowDraftFlow";

describe("escrowExperienceP03P04", () => {
  it("isGuideAcceptPending when created + guide assigned", () => {
    expect(isGuideAcceptPending({ state: "created" }, true)).toBe(true);
    expect(isGuideAcceptPending({ state: "accepted", sub_status: "pending_bilateral" }, true)).toBe(
      false,
    );
  });

  it("isBilateralPending after guide accept", () => {
    expect(isBilateralPending({ state: "accepted", sub_status: "pending_bilateral" })).toBe(true);
    expect(isBilateralPending({ state: "created" })).toBe(false);
  });

  it("isBilateralConfirmed gates confirm-final", () => {
    expect(isBilateralConfirmed({ state: "accepted", sub_status: "confirmed" })).toBe(true);
    expect(orderAllowsConfirmFinalPlan({ state: "created" })).toBe(false);
    expect(orderAllowsConfirmFinalPlan({ state: "accepted", sub_status: "confirmed" })).toBe(true);
  });

  it("experienceConfirmBlockedReasonKey prioritizes wait guide accept", () => {
    expect(
      experienceConfirmBlockedReasonKey({
        itineraryDraftDirty: false,
        hasGuideAssigned: true,
        guideAcceptPending: true,
        bilateralPending: false,
        amountOutOfSync: false,
        quoteAmountPersisted: true,
        quoteQuietSyncing: false,
      }),
    ).toBe("escrow_confirmBlocked_waitGuideAccept");
    expect(
      experienceConfirmBlockedReasonKey({
        itineraryDraftDirty: false,
        hasGuideAssigned: true,
        guideAcceptPending: false,
        bilateralPending: true,
        amountOutOfSync: false,
        quoteAmountPersisted: true,
        quoteQuietSyncing: false,
      }),
    ).toBe("escrow_confirmBlocked_waitBilateral");
  });
});
