import { describe, expect, it } from "vitest";
import {
  filterIdentitySlotBlockedReasonKeysForApplicationStatus,
  identitySlotReviewShowsRejectionDetails,
  resolveIdentitySlotBlockedReasonKeys,
  resolveIdentitySlotReviewStatusView,
} from "./identitySlotReviewStatusModel";

describe("identitySlotReviewStatusModel", () => {
  it("shows rejection details only when application_status is rejected", () => {
    expect(identitySlotReviewShowsRejectionDetails("rejected")).toBe(true);
    expect(identitySlotReviewShowsRejectionDetails("active")).toBe(false);
    expect(identitySlotReviewShowsRejectionDetails("approved")).toBe(false);
    expect(identitySlotReviewShowsRejectionDetails("pending")).toBe(false);
    expect(identitySlotReviewShowsRejectionDetails(null)).toBe(false);
  });

  it("drops stale rejection fields for active and approved", () => {
    const active = resolveIdentitySlotReviewStatusView({
      applicationStatus: "active",
      rejectionCodes: ["DOC_BLUR"],
      rejectionMessage: "stale operator note",
    });
    expect(active.showRejectionDetails).toBe(false);
    expect(active.rejectionCodes).toEqual([]);
    expect(active.rejectionMessage).toBeNull();
    expect(active.showPanel).toBe(true);

    const approved = resolveIdentitySlotReviewStatusView({
      applicationStatus: "approved",
      rejectionMessage: "stale",
    });
    expect(approved.rejectionMessage).toBeNull();
  });

  it("keeps rejection fields for rejected status", () => {
    const rejected = resolveIdentitySlotReviewStatusView({
      applicationStatus: "rejected",
      rejectionCodes: ["DOC_BLUR", "  "],
      rejectionMessage: "  Please re-upload  ",
    });
    expect(rejected.showRejectionDetails).toBe(true);
    expect(rejected.rejectionCodes).toEqual(["DOC_BLUR"]);
    expect(rejected.rejectionMessage).toBe("Please re-upload");
  });

  it("filters review blocked reason consistently with application_status", () => {
    const keys = ["wallet", "review", "stake"] as const;

    expect(
      filterIdentitySlotBlockedReasonKeysForApplicationStatus(keys, "active"),
    ).toEqual(["wallet", "stake"]);
    expect(
      filterIdentitySlotBlockedReasonKeysForApplicationStatus(keys, "approved"),
    ).toEqual(["wallet", "stake"]);
    expect(
      filterIdentitySlotBlockedReasonKeysForApplicationStatus(keys, "rejected"),
    ).toEqual(["wallet", "stake"]);
    expect(
      filterIdentitySlotBlockedReasonKeysForApplicationStatus(keys, "pending_review"),
    ).toEqual(["wallet", "review", "stake"]);
  });

  it("resolveIdentitySlotBlockedReasonKeys normalizes then filters", () => {
    expect(
      resolveIdentitySlotBlockedReasonKeys(["review", "wallet"], "active"),
    ).toEqual(["wallet"]);
    expect(
      resolveIdentitySlotBlockedReasonKeys({ review: true, payment: true }, "rejected"),
    ).toEqual(["payment"]);
  });
});
