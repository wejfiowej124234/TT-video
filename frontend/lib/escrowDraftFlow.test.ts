import { describe, expect, it } from "vitest";
import {
  experienceDraftHeaderMetaKey,
  orderAllowsConfirmFinalPlan,
} from "./escrowDraftFlow";

describe("escrowDraftFlow", () => {
  it("orderAllowsConfirmFinalPlan matches backend pre_confirm states", () => {
    expect(orderAllowsConfirmFinalPlan({ state: "draft" })).toBe(true);
    expect(orderAllowsConfirmFinalPlan({ state: "created" })).toBe(true);
    expect(orderAllowsConfirmFinalPlan({ state: "open" })).toBe(true);
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
  });
});
