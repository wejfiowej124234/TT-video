import { describe, expect, it } from "vitest";
import { TRAVELTRUST_HERO_TRUST_CHIPS, TRAVELTRUST_HEADER_WALLET_ID } from "./traveltrustHeroTrustChips";

describe("traveltrustHeroTrustChips", () => {
  it("keeps spec-aligned chip order and ids", () => {
    expect(TRAVELTRUST_HERO_TRUST_CHIPS.map((c) => c.id)).toEqual([
      "escrow",
      "governance",
      "compliance",
    ]);
  });

  it("exposes header wallet anchor for deduped hero CTA", () => {
    expect(TRAVELTRUST_HEADER_WALLET_ID).toBe("tt-header-wallet");
  });
});
