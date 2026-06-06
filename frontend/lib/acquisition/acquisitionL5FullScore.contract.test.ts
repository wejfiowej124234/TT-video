import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { acquisitionFulfillmentRequiredForBounty } from "@/lib/acquisition/acquisitionFulfillmentEligibility";
import { parseMeTrustFromMeResponse } from "@/lib/meTrust";

describe("acquisition L5 full-score helpers (PD-009 · ①)", () => {
  it("fulfillment bond required at threshold bounty max", () => {
    expect(acquisitionFulfillmentRequiredForBounty(1000)).toBe(true);
    expect(acquisitionFulfillmentRequiredForBounty(999)).toBe(false);
    expect(acquisitionFulfillmentRequiredForBounty(5000)).toBe(true);
  });

  it("parseMeTrust exposes acquisition publish + bond fields", () => {
    const me = {
      trust: {
        acquisition_trust_score: 720,
        acquisition_publish_eligible: true,
        acquisition_publish_bond_waived: true,
        acquisition_publish_bond_active: false,
        acquisition_fulfillment_bond_active: true,
      },
    };
    const trust = parseMeTrustFromMeResponse(me, { id: "u1" });
    expect(trust?.acquisition_trust_score).toBe(720);
    expect(trust?.acquisition_publish_eligible).toBe(true);
    expect(trust?.acquisition_publish_bond_waived).toBe(true);
    expect(trust?.acquisition_fulfillment_bond_active).toBe(true);
  });

  it("mapOrderWriteError includes acquisition bond keys", () => {
    const map = readFileSync(join(process.cwd(), "lib", "mapOrderWriteError.ts"), "utf8");
    expect(map).toContain("acquisition_fulfillment_bond_required");
    expect(map).toContain("acquisition_publish_bond_required");
  });
});
