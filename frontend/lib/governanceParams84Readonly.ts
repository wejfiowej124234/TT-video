/**
 * P5-5-3：84 参数与开放费点 **只读文档镜像** 消费逻辑（protocol-reference / pending）。
 * 与链上读数、投影 Σ 正交 — 仅用于 UI 对拍与展示，不可当作 fee-pool-aggregates 或 pool SSOT。
 */

export type FeeLayer = { country_bucket: number; global_pool: number };
export type GlobalSplit = { ttg_stakers: number; reserve: number; operations: number };
export type CountryRow84 = {
  name_zh: string;
  tier: string;
  national_pool_cap_fee_points: number;
  phase1_open_fee_points: number;
  fundraise_target_cny_wan: number;
  fundraise_target_source?: "governance_board_per_country";
  notes?: string;
};

/** 与 `governance_doc_reference::protocol_reference_json()` 成功体对齐的最小形状 */
export type ProtocolRef84Mirror = {
  status: string;
  doc_ref?: string;
  doc_version?: string;
  note?: string;
  pending_package_source?: string;
  fee_router?: {
    layer1_percent_of_allocatable_platform_fee?: FeeLayer;
    global_pool_split_percent?: GlobalSplit;
    orthogonality_ref?: string;
  };
  valuation_anchor?: {
    id?: string;
    reference_price_cny_per_ttg?: number;
    fdv_cny?: number;
    mock_usdc_per_ttg?: number;
    status?: string;
    fundraise_model?: string;
    fundraise_governance_ref?: string;
    independent_parameter_systems?: {
      fundraise_target?: string;
      seat_stake_ttg?: string;
      fee_points?: string;
      auto_conversion_between_systems?: boolean;
    };
  };
  phase1_countries?: CountryRow84[];
  checksums?: Record<string, string | number>;
};

export type FeeMetricDiffRow = { id: string; labelKey: string; cur: number; pen: number };

export function buildFeeMetricDiffRows(
  current: ProtocolRef84Mirror,
  pending: ProtocolRef84Mirror,
): FeeMetricDiffRow[] | null {
  const cL1 = current.fee_router?.layer1_percent_of_allocatable_platform_fee;
  const pL1 = pending.fee_router?.layer1_percent_of_allocatable_platform_fee;
  const cG = current.fee_router?.global_pool_split_percent;
  const pG = pending.fee_router?.global_pool_split_percent;
  if (
    !cL1 ||
    !pL1 ||
    !cG ||
    !pG ||
    typeof cL1.country_bucket !== "number" ||
    typeof pL1.country_bucket !== "number" ||
    typeof cL1.global_pool !== "number" ||
    typeof pL1.global_pool !== "number" ||
    typeof cG.ttg_stakers !== "number" ||
    typeof pG.ttg_stakers !== "number" ||
    typeof cG.reserve !== "number" ||
    typeof pG.reserve !== "number" ||
    typeof cG.operations !== "number" ||
    typeof pG.operations !== "number"
  ) {
    return null;
  }
  return [
    {
      id: "l1_country",
      labelKey: "governance_params_layer1_country",
      cur: cL1.country_bucket,
      pen: pL1.country_bucket,
    },
    {
      id: "l1_global",
      labelKey: "governance_params_layer1_global",
      cur: cL1.global_pool,
      pen: pL1.global_pool,
    },
    {
      id: "gp_stakers",
      labelKey: "governance_params_stakers",
      cur: cG.ttg_stakers,
      pen: pG.ttg_stakers,
    },
    {
      id: "gp_reserve",
      labelKey: "governance_params_reserve",
      cur: cG.reserve,
      pen: pG.reserve,
    },
    {
      id: "gp_ops",
      labelKey: "governance_params_operations",
      cur: cG.operations,
      pen: pG.operations,
    },
  ];
}

/** 避免 HTTP 200 但瘦响应被当成「已完整加载」 */
export function protocolReferenceHasSubstance(d: ProtocolRef84Mirror): boolean {
  const l1 = d.fee_router?.layer1_percent_of_allocatable_platform_fee;
  const gp = d.fee_router?.global_pool_split_percent;
  const hasLayer1 =
    l1 != null &&
    typeof l1.country_bucket === "number" &&
    Number.isFinite(l1.country_bucket) &&
    typeof l1.global_pool === "number" &&
    Number.isFinite(l1.global_pool);
  const hasGlobalSplit =
    gp != null &&
    typeof gp.ttg_stakers === "number" &&
    Number.isFinite(gp.ttg_stakers) &&
    typeof gp.reserve === "number" &&
    Number.isFinite(gp.reserve) &&
    typeof gp.operations === "number" &&
    Number.isFinite(gp.operations);
  const rows = d.phase1_countries;
  const hasCountries = Array.isArray(rows) && rows.length > 0;
  return hasLayer1 && hasGlobalSplit && hasCountries;
}

/** 文档镜像 checksums 的稳定展示顺序（缺键则跳过） */
export const PROTOCOL_REF_CHECKSUM_DISPLAY_KEYS = [
  "phase1_open_fee_points_sum",
  "national_pool_cap_fee_points_sum",
  "country_bucket_percent",
  "phase1_open_over_country_bucket",
] as const;

export type ProtocolRefChecksumKey = (typeof PROTOCOL_REF_CHECKSUM_DISPLAY_KEYS)[number];
