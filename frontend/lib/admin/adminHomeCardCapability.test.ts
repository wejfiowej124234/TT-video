import { describe, expect, it } from "vitest";

import { ADMIN_HOME_CARDS, resolveAdminHomeCardTier } from "./adminHomeModel";
import { ADMIN_HOME_CARD_TIER_BY_HREF } from "./adminHomeCardCapability";

describe("adminHomeCardCapability", () => {
  it("maps write/super_write tiers for onboarding and approvals", () => {
    expect(ADMIN_HOME_CARD_TIER_BY_HREF["/admin/provider-applications"]).toBe("write");
    expect(ADMIN_HOME_CARD_TIER_BY_HREF["/admin/approvals"]).toBe("super_write");
    expect(ADMIN_HOME_CARD_TIER_BY_HREF["/admin/flags"]).toBe("super_write");
  });

  it("resolves tier for every home card href", () => {
    for (const card of ADMIN_HOME_CARDS) {
      const tier = resolveAdminHomeCardTier(card);
      expect(["read", "write", "super_write", "placeholder"]).toContain(tier);
    }
  });
});
