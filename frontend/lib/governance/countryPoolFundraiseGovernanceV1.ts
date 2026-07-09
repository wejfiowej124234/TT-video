/** Country Pool 募资目标 · 治理委员会按国独立表（① · 与 Seat/Fee/参考价无自动换算） */

import type { ProtocolJurisdictionId } from "@/lib/governance/protocolSsot.v1";

export const COUNTRY_POOL_FUNDRAISE_GOVERNANCE_V1_REF =
  "docs/spec/governance-token/country-pool-fundraise-governance-v1.md";

export const COUNTRY_POOL_FUNDRAISE_TARGETS_CNY_WAN: Record<ProtocolJurisdictionId, number> = {
  CN: 8000,
  US: 8000,
  FR: 9000,
  ES: 9000,
  JP: 5000,
  TH: 3500,
  SG: 3000,
  KR: 4000,
  AU: 2000,
  AE: 2000,
};

export const COUNTRY_POOL_FUNDRAISE_TOTAL_CNY_WAN = 53_500;

export function countryPoolFundraiseTargetTotalCnyWan(): number {
  return COUNTRY_POOL_FUNDRAISE_TOTAL_CNY_WAN;
}

export function countryPoolFundraiseTargetWanForJurisdiction(
  jurisdictionId: ProtocolJurisdictionId,
): number {
  return COUNTRY_POOL_FUNDRAISE_TARGETS_CNY_WAN[jurisdictionId];
}
