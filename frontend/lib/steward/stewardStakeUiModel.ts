import { formatUnits } from "viem";

import { formatWalletOrDidShort } from "@/lib/formatWalletOrDidShort";
import { PROTOCOL_SSOT_V1 } from "@/lib/governance/protocolSsot.v1";
import { stakeJurisdictionCountryCode } from "@/lib/steward/jurisdictionBytes2";

/** Human-readable TTG amount; rejects unformatted wei-like strings. */
export function formatTtgAmount(
  amount: bigint | undefined,
  decimals: number | undefined,
): string | null {
  if (amount === undefined) return null;
  const d =
    decimals !== undefined && Number.isFinite(decimals) && decimals >= 0 && decimals <= 36
      ? decimals
      : PROTOCOL_SSOT_V1.ttg.decimals;
  try {
    const raw = formatUnits(amount, d);
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    if (raw.length > 14 && !raw.includes(".")) return null;
    return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  } catch {
    return null;
  }
}

/** protocol-ssot doc TTG units (non-wei) for jurisdiction country code. */
export function protocolStewardStakeTtgUnits(countryCode: string | null): number | null {
  if (!countryCode) return null;
  const row = PROTOCOL_SSOT_V1.jurisdictions.find((j) => j.id === countryCode);
  if (!row) return null;
  return (PROTOCOL_SSOT_V1.ttg.total_supply * row.steward_stake_bps) / 10_000;
}

export function formatProtocolStewardStakeTtgUnits(jurisdictionId: string): string | null {
  const code = stakeJurisdictionCountryCode(jurisdictionId);
  const units = protocolStewardStakeTtgUnits(code);
  if (units == null) return null;
  return units.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function stewardStakeSectionTitleKey(appStatus: string, inRelease: boolean): string {
  if (inRelease) return "stewardSeat_release_section";
  if (appStatus === "approved") {
    return "stewardSeat_stake_section_active";
  }
  return "stewardSeat_stake_section_application";
}

export function stewardShowsOnboardingCta(appStatus: string | undefined): boolean {
  if (!appStatus) return true;
  return !["approved", "stake_release_pending", "released"].includes(appStatus);
}

export function stewardOffchainSeatLabelKey(appStatus: string): string {
  switch (appStatus) {
    case "approved":
      return "steward_workbench_stake_offchain_active";
    case "stake_pending":
    case "under_review":
      return "steward_workbench_stake_offchain_review";
    case "stake_release_pending":
      return "steward_workbench_stake_offchain_releasing";
    default:
      return "steward_workbench_stake_offchain_other";
  }
}

const EVM_WALLET_RE = /^0x[0-9a-fA-F]{40}$/;

export function isValidEvmWalletAddress(raw: string | null | undefined): boolean {
  return typeof raw === "string" && EVM_WALLET_RE.test(raw.trim());
}

export function formatStewardWalletDisplay(raw: string | null | undefined): string {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return "—";
  return formatWalletOrDidShort(s) ?? s;
}

/** ① multi-demo 主理人 · 对齐 Anvil deployer / 本地 TTG funding 钱包 */
export const MULTI_DEMO_STEWARD_WALLET = "0x104FCb93B5e097F92c93Ee4621C487C6C953D212" as const;

const LEGACY_MULTI_DEMO_SYNTHETIC_PREFIX = "0x4d554c5449";

export function isMultiDemoStewardWallet(raw: string | null | undefined): boolean {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!s) return false;
  if (s === MULTI_DEMO_STEWARD_WALLET.toLowerCase()) return true;
  if (s.startsWith(LEGACY_MULTI_DEMO_SYNTHETIC_PREFIX)) return true;
  return s.startsWith("0xmulti");
}

export const STEWARD_CHAIN_STAKE_SUMMARY_STAKED_KEY =
  "steward_workbench_stake_chain_summary_staked" as const;

export function isStewardChainStakeComplete(chainStakeSummaryKey: string): boolean {
  return chainStakeSummaryKey === STEWARD_CHAIN_STAKE_SUMMARY_STAKED_KEY;
}

export function stewardChainStakeSummaryKey(
  rows: Array<{ hasStake: boolean | null }>,
  opts: { isConnected: boolean; walletMatch: boolean },
): string {
  if (rows.length === 0) return "steward_workbench_stake_chain_summary_none";
  if (!opts.isConnected) return "steward_workbench_stake_chain_summary_connect";
  if (!opts.walletMatch) return "steward_workbench_stake_chain_summary_wallet_mismatch";
  if (rows.every((r) => r.hasStake === true)) return STEWARD_CHAIN_STAKE_SUMMARY_STAKED_KEY;
  if (rows.some((r) => r.hasStake === true)) return "steward_workbench_stake_chain_summary_partial";
  if (rows.every((r) => r.hasStake === null)) return "steward_workbench_stake_chain_summary_reading";
  return "steward_workbench_stake_chain_summary_pending";
}
