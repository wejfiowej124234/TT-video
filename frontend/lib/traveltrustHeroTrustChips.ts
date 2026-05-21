/** Hero trust chips — ① 旅游向首屏标签（L5-1）；托管细则见 `#trust` disclaimer */
export const TRAVELTRUST_HERO_TRUST_CHIPS = [
  {
    id: "escrow",
    key: "traveltrust_trust_chip_escrow",
    icon: "escrow" as const,
  },
  {
    id: "governance",
    key: "traveltrust_trust_chip_governance",
    icon: "governance" as const,
  },
  {
    id: "compliance",
    key: "traveltrust_trust_chip_compliance",
    icon: "compliance" as const,
  },
] as const;
export type TraveltrustHeroTrustChipId = (typeof TRAVELTRUST_HERO_TRUST_CHIPS)[number]["id"];

/** Header wallet anchor — single connect/disconnect surface when hero wallet is connected (TT-PH1-169). */
export const TRAVELTRUST_HEADER_WALLET_ID = "tt-header-wallet";
