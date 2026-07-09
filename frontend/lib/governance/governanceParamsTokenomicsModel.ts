/** TTG 10M 供应 · 公众三轮 · 文档锚点 · 前端只读 */

export const TTG_TOTAL_SUPPLY = 10_000_000 as const;

export const PROTOCOL_SSOT_DOC_ID = "protocol-ssot.v1" as const;
export const PROTOCOL_SSOT_DOC_VERSION = "1.0.2" as const;
export const TTG_ALLOCATION_FLOWS_DOC_ID = "ttg-allocation-permissions-flows-ssot-v1" as const;

export const GOVERNANCE_TOKENOMICS_FREEZE_DOC_ID = "TTG-TOKENOMICS-FREEZE-V1" as const;
export const GOVERNANCE_TOKENOMICS_FREEZE_DATE = "2026-06-16" as const;

export const GOVERNANCE_FREEZE_V1 = {
  GOV_01: { treasury_p4_deploy_cap_bps: 3000 },
  GOV_02: {
    governance_quorum_bps: 400,
    governance_approval_threshold_bps: 5000,
    governance_timelock_delay_hours: 48,
  },
  GOV_03: {
    max_active_seats_per_controlling_entity: 1,
    max_voting_power_per_address_bps: 400,
    max_aggregate_seat_stake_per_entity_bps: 400,
  },
  GOV_04: {
    public_sale_per_wallet_cap_ttg: 25_000,
    public_sale_min_purchase_usdc: 100,
  },
} as const;

export type GovernanceParamsSupplyRow = {
  id: string;
  labelKey: string;
  hintKey: string;
  sharePct: number;
  ttgUnits: number;
};

/** protocol-ssot §1 · 25/20/15/15/5/20 — 唯一供应分解（占 10M 100%） */
export const GOVERNANCE_TTG_SUPPLY_ROWS: readonly GovernanceParamsSupplyRow[] = [
  {
    id: "country_pool",
    labelKey: "governance_params_ttg_supply_country_pool",
    hintKey: "governance_params_ttg_supply_country_pool_hint",
    sharePct: 25,
    ttgUnits: 2_500_000,
  },
  {
    id: "public",
    labelKey: "governance_params_ttg_supply_public",
    hintKey: "governance_params_ttg_supply_public_hint",
    sharePct: 20,
    ttgUnits: 2_000_000,
  },
  {
    id: "ecosystem",
    labelKey: "governance_params_ttg_supply_ecosystem",
    hintKey: "governance_params_ttg_supply_ecosystem_hint",
    sharePct: 15,
    ttgUnits: 1_500_000,
  },
  {
    id: "team",
    labelKey: "governance_params_ttg_supply_team",
    hintKey: "governance_params_ttg_supply_team_hint",
    sharePct: 15,
    ttgUnits: 1_500_000,
  },
  {
    id: "advisors",
    labelKey: "governance_params_ttg_supply_advisors",
    hintKey: "governance_params_ttg_supply_advisors_hint",
    sharePct: 5,
    ttgUnits: 500_000,
  },
  {
    id: "treasury_dao",
    labelKey: "governance_params_ttg_supply_treasury_dao",
    hintKey: "governance_params_ttg_supply_treasury_dao_hint",
    sharePct: 20,
    ttgUnits: 2_000_000,
  },
] as const;

export type GovernanceParamsPublicRoundRow = {
  id: string;
  labelKey: string;
  ttgUnits: number;
  ofSupplyPct: number;
  ofPublicPct: number;
};

/** 公众 20% 内部分三轮 · 非 Web3 部署 Phase 1/2/3 */
export const GOVERNANCE_PUBLIC_SALE_ROUNDS: readonly GovernanceParamsPublicRoundRow[] = [
  {
    id: "round_1_early",
    labelKey: "governance_params_treasury_policy_round_round_1_early",
    ttgUnits: 500_000,
    ofSupplyPct: 5,
    ofPublicPct: 25,
  },
  {
    id: "round_2",
    labelKey: "governance_params_treasury_policy_round_round_2",
    ttgUnits: 500_000,
    ofSupplyPct: 5,
    ofPublicPct: 25,
  },
  {
    id: "round_3",
    labelKey: "governance_params_treasury_policy_round_round_3",
    ttgUnits: 1_000_000,
    ofSupplyPct: 10,
    ofPublicPct: 50,
  },
] as const;

export const GOVERNANCE_PUBLIC_SALE_TOTAL = {
  ttgUnits: 2_000_000,
  ofSupplyPct: 20,
  ofPublicPct: 100,
} as const;

export type GovernanceParamsPhaseContrastRow = {
  id: string;
  nameKey: string;
  timingKey: string;
  isKey: string;
  isNotKey: string;
};

/** Web3 产品部署阶段 ≠ 公众认购 Round 1/2/3 */
export const GOVERNANCE_PHASE_CONTRAST_ROWS: readonly GovernanceParamsPhaseContrastRow[] = [
  {
    id: "deploy_p1",
    nameKey: "governance_params_phase_contrast_deploy_p1_name",
    timingKey: "governance_params_phase_contrast_deploy_p1_timing",
    isKey: "governance_params_phase_contrast_deploy_p1_is",
    isNotKey: "governance_params_phase_contrast_deploy_p1_is_not",
  },
  {
    id: "round_1",
    nameKey: "governance_params_phase_contrast_round_1_name",
    timingKey: "governance_params_phase_contrast_round_1_timing",
    isKey: "governance_params_phase_contrast_round_1_is",
    isNotKey: "governance_params_phase_contrast_round_1_is_not",
  },
  {
    id: "deploy_p2",
    nameKey: "governance_params_phase_contrast_deploy_p2_name",
    timingKey: "governance_params_phase_contrast_deploy_p2_timing",
    isKey: "governance_params_phase_contrast_deploy_p2_is",
    isNotKey: "governance_params_phase_contrast_deploy_p2_is_not",
  },
  {
    id: "round_2",
    nameKey: "governance_params_phase_contrast_round_2_name",
    timingKey: "governance_params_phase_contrast_round_2_timing",
    isKey: "governance_params_phase_contrast_round_2_is",
    isNotKey: "governance_params_phase_contrast_round_2_is_not",
  },
] as const;

export type GovernanceParamsGovFreezeRow = {
  id: "GOV_01" | "GOV_02" | "GOV_03" | "GOV_04";
  titleKey: string;
  valueKey: string;
};

export const GOVERNANCE_FREEZE_TABLE_ROWS: readonly GovernanceParamsGovFreezeRow[] = [
  { id: "GOV_01", titleKey: "governance_params_tokenomics_freeze_GOV_01_title_user", valueKey: "governance_params_tokenomics_freeze_GOV_01_value" },
  { id: "GOV_02", titleKey: "governance_params_tokenomics_freeze_GOV_02_title_user", valueKey: "governance_params_tokenomics_freeze_GOV_02_value" },
  { id: "GOV_03", titleKey: "governance_params_tokenomics_freeze_GOV_03_title_user", valueKey: "governance_params_tokenomics_freeze_GOV_03_value" },
  { id: "GOV_04", titleKey: "governance_params_tokenomics_freeze_GOV_04_title_user", valueKey: "governance_params_tokenomics_freeze_GOV_04_value" },
] as const;

export type GovernanceParamsTreasuryPolicyOption = {
  id: string;
  labelKey: string;
  hintKey: string;
};

export const GOVERNANCE_TREASURY_POLICY_OPTIONS: readonly GovernanceParamsTreasuryPolicyOption[] = [
  {
    id: "buyback",
    labelKey: "governance_params_treasury_policy_option_buyback",
    hintKey: "governance_params_treasury_policy_option_buyback_hint_v2",
  },
  {
    id: "burn",
    labelKey: "governance_params_treasury_policy_option_burn",
    hintKey: "governance_params_treasury_policy_option_burn_hint_v2",
  },
  {
    id: "holder_rewards",
    labelKey: "governance_params_treasury_policy_option_holder_rewards",
    hintKey: "governance_params_treasury_policy_option_holder_rewards_hint",
  },
  {
    id: "ecosystem",
    labelKey: "governance_params_treasury_policy_option_ecosystem",
    hintKey: "governance_params_treasury_policy_option_ecosystem_hint_v2",
  },
  {
    id: "country_pool",
    labelKey: "governance_params_treasury_policy_option_country_pool",
    hintKey: "governance_params_treasury_policy_option_country_pool_hint",
  },
] as const;

export function governanceFreezeLocaleVars(locale: string): Record<string, string | number> {
  const capPct = GOVERNANCE_FREEZE_V1.GOV_01.treasury_p4_deploy_cap_bps / 100;
  return {
    cap: capPct,
    quorum: GOVERNANCE_FREEZE_V1.GOV_02.governance_quorum_bps / 100,
    approval: GOVERNANCE_FREEZE_V1.GOV_02.governance_approval_threshold_bps / 100,
    timelock: GOVERNANCE_FREEZE_V1.GOV_02.governance_timelock_delay_hours,
    seats: GOVERNANCE_FREEZE_V1.GOV_03.max_active_seats_per_controlling_entity,
    voteBps: GOVERNANCE_FREEZE_V1.GOV_03.max_voting_power_per_address_bps / 100,
    stakeBps: GOVERNANCE_FREEZE_V1.GOV_03.max_aggregate_seat_stake_per_entity_bps / 100,
    walletTtg: GOVERNANCE_FREEZE_V1.GOV_04.public_sale_per_wallet_cap_ttg.toLocaleString(locale),
    minUsdc: GOVERNANCE_FREEZE_V1.GOV_04.public_sale_min_purchase_usdc,
    supply: TTG_TOTAL_SUPPLY.toLocaleString(locale),
  };
}

export function formatTtgUnits(units: number, locale: string): string {
  return units.toLocaleString(locale);
}

export function formatSupplyPctOfTotal(sharePct: number, locale: string): string {
  return `${sharePct.toLocaleString(locale)}%`;
}
