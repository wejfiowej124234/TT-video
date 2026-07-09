/**
 * Frontend bundled mirror of `governance_doc_reference::protocol_reference_json()`.
 * Used when API is unavailable so `/governance/params` stays readable offline / dev-without-backend.
 * Keep in sync with crates/api/src/routes/governance_doc_reference.rs
 */
import type { ProtocolRef84Mirror } from "@/lib/governanceParams84Readonly";

export const GOVERNANCE_PARAMS_PROTOCOL_MIRROR_DOC_VERSION = "1.0.22" as const;

export const GOVERNANCE_PARAMS_PROTOCOL_REFERENCE_MIRROR: ProtocolRef84Mirror = {
  status: "ok",
  doc_ref: "docs/spec/84-第一阶段10国Country-Pool发行参数总表.md",
  doc_version: GOVERNANCE_PARAMS_PROTOCOL_MIRROR_DOC_VERSION,
  note: "Target 叙事参数；非链上读数。三轨独立：募资目标=治理委员会逐国参数；Seat质押=责任锁仓；Fee Points=收益分配等级。无自动换算。TTG参考价仅用于Mock/FDV。",
  fee_router: {
    layer1_percent_of_allocatable_platform_fee: {
      country_bucket: 45,
      global_pool: 55,
    },
    global_pool_split_percent: {
      ttg_stakers: 65,
      reserve: 20,
      operations: 15,
    },
    orthogonality_ref: "84 §1.1.1：仲裁费、Staking.slash 等与 45/55 正交；Runbook §7.1",
  },
  valuation_anchor: {
    id: "ttg-reference-price-v1-draft-20260615",
    doc_ref: "docs/spec/governance-token/ttg-reference-price-v1-draft.md",
    status: "engineering_default_phase1",
    reference_price_cny_per_ttg: 200,
    fdv_cny: 2_000_000_000,
    total_supply_ttg: 10_000_000,
    mock_usdc_cny_fx: 7.2,
    mock_usdc_per_ttg: 200 / 7.2,
    fundraise_model: "governance_board_per_country_independent",
    fundraise_governance_ref: "docs/spec/governance-token/country-pool-fundraise-governance-v1.md",
    independent_parameter_systems: {
      fundraise_target: "governance_board_market_size_per_country",
      seat_stake_ttg: "seat_tier_protocol_ssot_liability_lock",
      fee_points: "country_revenue_grade_and_seat_tier",
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
    valuation_anchor_id: "ttg-reference-price-v1-draft-20260615",
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
