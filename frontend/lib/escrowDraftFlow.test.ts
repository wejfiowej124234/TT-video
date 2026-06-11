import { describe, expect, it } from "vitest";
import {
  experienceDraftHeaderMetaKey,
  orderAllowsConfirmFinalPlan,
} from "./escrowDraftFlow";

describe("escrowDraftFlow", () => {
  it("orderAllowsConfirmFinalPlan matches backend confirm_final_plan_impl", () => {
    expect(orderAllowsConfirmFinalPlan({ state: "draft" })).toBe(true);
    expect(orderAllowsConfirmFinalPlan({ state: "created" })).toBe(false);
    expect(orderAllowsConfirmFinalPlan({ state: "open" })).toBe(false);
    expect(
      orderAllowsConfirmFinalPlan({ state: "accepted", sub_status: "confirmed" }),
    ).toBe(true);
    expect(orderAllowsConfirmFinalPlan({ state: "accepted", sub_status: "pending_bilateral" })).toBe(
      false,
    );
    expect(orderAllowsConfirmFinalPlan({ state: "draft", snapshotHash: "0xabc" })).toBe(false);
  });

  it("experienceDraftHeaderMetaKey", () => {
    expect(
      experienceDraftHeaderMetaKey({ publishedToDiscover: false, hasGuideAssigned: false }),
    ).toBe("escrow_draftMeta_pickGuide");
    expect(
      experienceDraftHeaderMetaKey({ publishedToDiscover: true, hasGuideAssigned: false }),
    ).toBe("escrow_draftMeta_waitingGuide");
    expect(
      experienceDraftHeaderMetaKey({ publishedToDiscover: true, hasGuideAssigned: true }),
    ).toBe("escrow_draftMeta_published_guide");
    expect(
      experienceDraftHeaderMetaKey({
        publishedToDiscover: true,
        hasGuideAssigned: true,
        guideAcceptPending: true,
      }),
    ).toBe("escrow_draftMeta_guide_wait_accept");
    expect(
      experienceDraftHeaderMetaKey({
        publishedToDiscover: true,
        hasGuideAssigned: true,
        bilateralPending: true,
      }),
    ).toBe("escrow_draftMeta_bilateral_pending");
  });
});
