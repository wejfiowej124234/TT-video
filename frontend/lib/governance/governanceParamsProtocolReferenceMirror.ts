/**
 * Frontend bundled mirror of protocol fee disclosure for `/governance/params` offline.
 * ACTIVE = Design Lock DL_R1 CountryFeeRouter (5% platform → 45/55|100% ProjectPool).
 * global_pool_split ttg_stakers = 0 (LEGACY EXIT — do not present as ACTIVE holder dividends).
 */
import type { ProtocolRef84Mirror } from "@/lib/governanceParams84Readonly";

export const GOVERNANCE_PARAMS_PROTOCOL_MIRROR_DOC_VERSION = "v9-dl-r1" as const;
export const GOVERNANCE_PARAMS_PROTOCOL_MIRROR_CLASS = "LEGACY_SHAPE_ACTIVE_ECONOMICS_OVERLAY" as const;

export const GOVERNANCE_PARAMS_PROTOCOL_REFERENCE_MIRROR: ProtocolRef84Mirror = {
  status: "ok",
  doc_ref: "docs/runbook/TT-TTG-V9-OWNER-DESIGN-LOCK-LATEST.md",
  doc_version: GOVERNANCE_PARAMS_PROTOCOL_MIRROR_DOC_VERSION,
  note:
    "ACTIVE Design Lock DL_R1: platform fee 500 bps → CountryFeeRouter; with steward 45/55 else 100% ProjectPool. global_pool_split.ttg_stakers=0 EXIT (LEGACY P4Cap/globalStakers must not be ACTIVE UI truth). Valuation anchor below is LEGACY mock — not ACTIVE sale price.",
  fee_router: {
    layer1_percent_of_allocatable_platform_fee: {
      country_bucket: 45,
      global_pool: 55,
    },
    /** LEGACY shape retained for type/substance; ACTIVE economics = ProjectPool sink, not staker dividends */
    global_pool_split_percent: {
      ttg_stakers: 0,
      reserve: 0,
      operations: 100,
    },
    orthogonality_ref:
      "DL_R1: CountryFeeRouter → ProjectPool; KEEP Money Path FeeRouter setFeeRouter pending cutover",
  },
  valuation_anchor: {
    id: "ttg-reference-price-v1-LEGACY-DO-NOT-USE-AS-ACTIVE",
    doc_ref: "frontend/lib/governance/ttgReferencePriceV1.ts",
    status: "LEGACY_engineering_default_superseded",
    reference_price_cny_per_ttg: 200,
    fdv_cny: 2_000_000_000,
    total_supply_ttg: 25_000_000_000_000,
    mock_usdc_cny_fx: 7.2,
    mock_usdc_per_ttg: 200 / 7.2,
    fundraise_model: "v9_five_norm_batches_window_not_open",
    fundraise_governance_ref: "docs/runbook/TT-TTG-V9-OWNER-DESIGN-LOCK-LATEST.md",
    independent_parameter_systems: {
      fundraise_target: "five_norm_primary_batches",
      seat_stake_ttg: "role_stake_steward_live_supply_bps",
      fee_points: "country_fee_router_project_pool",
      auto_conversion_between_systems: false,
    },
  },
  phase1_countries: [
    { name_zh: "中国", tier: "S", national_pool_cap_fee_points: 4.0, phase1_open_fee_points: 3.0, fundraise_target_cny_wan: 8000, fundraise_target_source: "governance_board_per_country", notes: "入境旅游大国" },
    { name_zh: "美国", tier: "S", national_pool_cap_fee_points: 4.0, phase1_open_fee_points: 3.0, fundraise_target_cny_wan: 8000, fundraise_target_source: "governance_board_per_country", notes: "高消费市场" },
    { name_zh: "法国", tier: "S", national_pool_cap_fee_points: 4.5, phase1_open_fee_points: 3.5, fundraise_target_cny_wan: 9000, fundraise_target_source: "governance_board_per_country", notes: "全球领先目的地" },
    { name_zh: "西班牙", tier: "S", national_pool_cap_fee_points: 4.5, phase1_open_fee_points: 3.5, fundraise_target_cny_wan: 9000, fundraise_target_source: "governance_board_per_country", notes: "高消费" },
    { name_zh: "日本", tier: "A", national_pool_cap_fee_points: 2.5, phase1_open_fee_points: 2.0, fundraise_target_cny_wan: 5000, fundraise_target_source: "governance_board_per_country", notes: "高端旅游" },
    { name_zh: "泰国", tier: "A", national_pool_cap_fee_points: 2.5, phase1_open_fee_points: 2.0, fundraise_target_cny_wan: 3500, fundraise_target_source: "governance_board_per_country", notes: "亚洲热门" },
    { name_zh: "新加坡", tier: "A", national_pool_cap_fee_points: 2.0, phase1_open_fee_points: 1.5, fundraise_target_cny_wan: 3000, fundraise_target_source: "governance_board_per_country", notes: "高端" },
    { name_zh: "韩国", tier: "A", national_pool_cap_fee_points: 2.0, phase1_open_fee_points: 1.5, fundraise_target_cny_wan: 4000, fundraise_target_source: "governance_board_per_country", notes: "亚洲" },
    { name_zh: "澳大利亚", tier: "B", national_pool_cap_fee_points: 1.5, phase1_open_fee_points: 1.0, fundraise_target_cny_wan: 2000, fundraise_target_source: "governance_board_per_country", notes: "高消费" },
    { name_zh: "阿联酋", tier: "B", national_pool_cap_fee_points: 1.5, phase1_open_fee_points: 1.0, fundraise_target_cny_wan: 2000, fundraise_target_source: "governance_board_per_country", notes: "中东" },
  ],
  checksums: {
    phase1_open_fee_points_sum: 22,
    national_pool_cap_fee_points_sum: 29,
    country_bucket_percent: 45,
    phase1_open_over_country_bucket: "22/45≈48.9%",
    valuation_anchor_id: "ttg-reference-price-v1-LEGACY-DO-NOT-USE-AS-ACTIVE",
    active_fee_sink: "ProjectPool",
    active_stakers_bps: 0,
  },
};

export function resolveGovernanceParamsProtocolData(
  apiData: ProtocolRef84Mirror | null,
  apiError: boolean,
): { data: ProtocolRef84Mirror; source: "api" | "mirror" } {
  if (apiData && !apiError) {
    return { data: apiData, source: "api" };
  }
  return { data: GOVERNANCE_PARAMS_PROTOCOL_REFERENCE_MIRROR, source: "mirror" };
}
