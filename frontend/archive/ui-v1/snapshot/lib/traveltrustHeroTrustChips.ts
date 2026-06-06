/**
 * Hero trust chips — copy keys aligned with spec 84/85 (TT-PH1-179 · ①).
 * Escrow trip funds ≠ subscription/Treasury; no yield or securities framing on chips.
 */
export const TRAVELTRUST_HERO_TRUST_CHIPS = [
  {
    id: "escrow",
    key: "traveltrust_trust_chip_escrow",
    icon: "escrow" as const,
    specNote: "84: escrow principal separate from subscription rail",
  },
  {
    id: "governance",
    key: "traveltrust_trust_chip_governance",
    icon: "governance" as const,
    specNote: "83/84: FeeRouter & governance params",
  },
  {
    id: "compliance",
    key: "traveltrust_trust_chip_compliance",
    icon: "compliance" as const,
    specNote: "85: not ICO; disclosures in trust strip",
  },
] as const;

export type TraveltrustHeroTrustChipId = (typeof TRAVELTRUST_HERO_TRUST_CHIPS)[number]["id"];

/** Header wallet anchor — single connect/disconnect surface when hero wallet is connected (TT-PH1-169). */
export const TRAVELTRUST_HEADER_WALLET_ID = "tt-header-wallet";
