/**
 * Protocol SSOT v1.0.3 — frontend read-only mirror (P2).
 * Authoritative: docs/spec/governance-token/protocol-ssot.v1.yaml
 * Runtime refresh: GET /api/v1/governance/protocol-reference → protocol_ssot
 */

export const PROTOCOL_SSOT_VERSION = "1.0.3" as const;

export type ProtocolJurisdictionId =
  | "CN"
  | "US"
  | "FR"
  | "ES"
  | "JP"
  | "TH"
  | "SG"
  | "KR"
  | "AU"
  | "AE";

export type ProtocolJurisdiction = {
  id: ProtocolJurisdictionId;
  tier: "S" | "A" | "B";
  fee_route_bps: number;
  phase1_open_bps: number;
  steward_stake_bps: number;
  min_hold_bps: number;
  seat_cap: number;
  subscription_lock_months: number;
};

export const PROTOCOL_SSOT_V1 = {
  version: PROTOCOL_SSOT_VERSION,
  ttg: {
    symbol: "TTG",
    decimals: 18,
    total_supply: 10_000_000,
  },
  lock_tiers: {
    snapshot_min_lock_days: 7,
    seat_buyout_min_lock_days: 90,
    buyout_cooldown_days: 180,
    steward_seat_min_tenure_months: 24,
    steward_resign_notice_days: 180,
    steward_stake_release_delay_days: 90,
    steward_stake_release_vest_days: 365,
    country_pool_subscription_lock_months: 24,
    redemption_window_days_per_quarter: 15,
    redemption_max_nav_pct_bps: 1000,
  },
  jurisdictions: [
    { id: "CN", tier: "S", fee_route_bps: 400, phase1_open_bps: 300, steward_stake_bps: 400, min_hold_bps: 300, seat_cap: 1, subscription_lock_months: 24 },
    { id: "US", tier: "S", fee_route_bps: 400, phase1_open_bps: 300, steward_stake_bps: 400, min_hold_bps: 300, seat_cap: 1, subscription_lock_months: 24 },
    { id: "FR", tier: "S", fee_route_bps: 450, phase1_open_bps: 350, steward_stake_bps: 450, min_hold_bps: 350, seat_cap: 1, subscription_lock_months: 24 },
    { id: "ES", tier: "S", fee_route_bps: 450, phase1_open_bps: 350, steward_stake_bps: 450, min_hold_bps: 350, seat_cap: 1, subscription_lock_months: 24 },
    { id: "JP", tier: "A", fee_route_bps: 250, phase1_open_bps: 200, steward_stake_bps: 250, min_hold_bps: 200, seat_cap: 1, subscription_lock_months: 24 },
    { id: "TH", tier: "A", fee_route_bps: 250, phase1_open_bps: 200, steward_stake_bps: 250, min_hold_bps: 200, seat_cap: 1, subscription_lock_months: 24 },
    { id: "SG", tier: "A", fee_route_bps: 200, phase1_open_bps: 150, steward_stake_bps: 200, min_hold_bps: 200, seat_cap: 1, subscription_lock_months: 24 },
    { id: "KR", tier: "A", fee_route_bps: 200, phase1_open_bps: 150, steward_stake_bps: 200, min_hold_bps: 200, seat_cap: 1, subscription_lock_months: 24 },
    { id: "AU", tier: "B", fee_route_bps: 150, phase1_open_bps: 100, steward_stake_bps: 150, min_hold_bps: 100, seat_cap: 1, subscription_lock_months: 24 },
    { id: "AE", tier: "B", fee_route_bps: 150, phase1_open_bps: 100, steward_stake_bps: 150, min_hold_bps: 100, seat_cap: 1, subscription_lock_months: 24 },
  ] satisfies ProtocolJurisdiction[],
} as const;

export function cumulativeStewardStakeBps(jurisdictionIds: readonly string[]): number {
  const set = new Set(jurisdictionIds.map((j) => j.trim().toUpperCase()));
  return PROTOCOL_SSOT_V1.jurisdictions
    .filter((j) => set.has(j.id))
    .reduce((sum, j) => sum + j.steward_stake_bps, 0);
}

export function cumulativeTtgUnitsRequired(jurisdictionIds: readonly string[]): number {
  const bps = cumulativeStewardStakeBps(jurisdictionIds);
  return (PROTOCOL_SSOT_V1.ttg.total_supply * bps) / 10_000;
}

export function isValidProtocolJurisdictionId(id: string): id is ProtocolJurisdictionId {
  return PROTOCOL_SSOT_V1.jurisdictions.some((j) => j.id === id.trim().toUpperCase());
}
