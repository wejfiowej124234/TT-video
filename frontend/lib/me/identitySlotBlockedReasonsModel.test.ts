import { describe, expect, it } from "vitest";
import {
  formatIdentitySlotBlockedReasonLabels,
  ME_IDENTITIES_HUB_BLOCKED_REASON_MAX_LINES,
  normalizeIdentitySlotBlockedReasons,
} from "./identitySlotBlockedReasonsModel";

describe("identitySlotBlockedReasonsModel", () => {
  it("normalizes array and record shapes", () => {
    expect(normalizeIdentitySlotBlockedReasons(["wallet", "bogus"])).toEqual(["wallet"]);
    expect(normalizeIdentitySlotBlockedReasons({ wallet: true, payment: false })).toEqual(["wallet"]);
  });

  it("caps hub card lines at three", () => {
    const t = (k: string) => k;
    const lines = formatIdentitySlotBlockedReasonLabels(
      { wallet: true, payment: true, review: true, stake: true },
      t,
      ME_IDENTITIES_HUB_BLOCKED_REASON_MAX_LINES,
      "pending_review",
    );
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("me_identities_blocked_wallet");
  });

  it("drops review line for active application_status (aligned with review panel)", () => {
    const t = (k: string) => k;
    const lines = formatIdentitySlotBlockedReasonLabels(["review", "wallet"], t, 3, "active");
    expect(lines).toEqual(["me_identities_blocked_wallet"]);
  });
});
