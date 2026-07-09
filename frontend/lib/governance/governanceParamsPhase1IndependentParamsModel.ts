import type { CountryRow84 } from "@/lib/governanceParams84Readonly";
import { COUNTRY_POOL_FUNDRAISE_TARGETS_CNY_WAN } from "@/lib/governance/countryPoolFundraiseGovernanceV1";
import { resolvePhase1JurisdictionId } from "@/lib/governance/governanceParamsCountryDisplay";

/** 客户端 overlay：治理募资表覆盖 API 镜像行（① 只读 · 无 Seat×参考价推导） */
export function applyGovernanceFundraiseTargetToRows(rows: CountryRow84[]): CountryRow84[] {
  return rows.map((row) => {
    const jurisdictionId = resolvePhase1JurisdictionId(row.name_zh);
    if (!jurisdictionId) return row;
    const target = COUNTRY_POOL_FUNDRAISE_TARGETS_CNY_WAN[jurisdictionId];
    return {
      ...row,
      fundraise_target_cny_wan: target,
      fundraise_target_source: "governance_board_per_country",
    };
  });
}
