/**
 * Official www 「协议总清单」 rows — mainnet read-only disclosure (chain_id=1).
 * ACTIVE SSOT: frontend/lib/governance/v9PublicContractRegistry.ts (Phase1).
 * Status: DEPLOYED_PENDING_CUTOVER · ≠ Production GO · sale window not open.
 * KEEP Money Path rows are KEEP (historical funds path); FeeRouter cutover pending.
 */

import { V9_PUBLIC_CONTRACTS } from "@/lib/governance/v9PublicContractRegistry";

export type OfficialProtocolDirectoryGroup = "money_path" | "governance" | "primary_market";

export type OfficialProtocolDirectoryRow = {
  id: string;
  order: number;
  address: `0x${string}`;
  group: OfficialProtocolDirectoryGroup;
  titleKey: string;
  descriptionKey: string;
};

/** ACTIVE Phase1 disclosure set + KEEP Money Path (W-P1-06). */
export const OFFICIAL_MAINNET_PROTOCOL_DIRECTORY_ROWS: OfficialProtocolDirectoryRow[] = [
  {
    id: "keep_escrow_factory",
    order: 1,
    address: V9_PUBLIC_CONTRACTS.keepEscrowFactory,
    group: "money_path",
    titleKey: "traveltrust_protocol_directory_row_escrow_factory_title",
    descriptionKey: "traveltrust_protocol_directory_row_escrow_factory_desc",
  },
  {
    id: "keep_settlement_router",
    order: 2,
    address: V9_PUBLIC_CONTRACTS.keepSettlementRouter,
    group: "money_path",
    titleKey: "traveltrust_protocol_directory_row_settlement_router_title",
    descriptionKey: "traveltrust_protocol_directory_row_settlement_router_desc",
  },
  {
    id: "country_fee_router",
    order: 3,
    address: V9_PUBLIC_CONTRACTS.countryFeeRouter,
    group: "money_path",
    titleKey: "traveltrust_protocol_directory_row_fee_router_title",
    descriptionKey: "traveltrust_protocol_directory_row_fee_router_desc",
  },
  {
    id: "solo_timelock",
    order: 4,
    address: V9_PUBLIC_CONTRACTS.soloTimelock,
    group: "governance",
    titleKey: "traveltrust_protocol_directory_row_timelock_title",
    descriptionKey: "traveltrust_protocol_directory_row_timelock_desc",
  },
  {
    id: "governor_v9",
    order: 5,
    address: V9_PUBLIC_CONTRACTS.governor,
    group: "governance",
    titleKey: "traveltrust_protocol_directory_row_governor_title",
    descriptionKey: "traveltrust_protocol_directory_row_governor_desc",
  },
  {
    id: "ttg_v9",
    order: 6,
    address: V9_PUBLIC_CONTRACTS.ttg,
    group: "governance",
    titleKey: "traveltrust_protocol_directory_row_governance_token_title",
    descriptionKey: "traveltrust_protocol_directory_row_governance_token_desc",
  },
  {
    id: "batch_primary_market",
    order: 7,
    address: V9_PUBLIC_CONTRACTS.market,
    group: "primary_market",
    titleKey: "traveltrust_protocol_directory_row_primary_market_title",
    descriptionKey: "traveltrust_protocol_directory_row_primary_market_desc",
  },
];

export function shortenEvmAddress(address: string): string {
  const normalized = address.trim();
  if (normalized.length < 12) return normalized;
  return `${normalized.slice(0, 6)}…${normalized.slice(-4)}`;
}

export function etherscanAddressUrl(address: string): string {
  return `https://etherscan.io/address/${address}`;
}

export function officialProtocolDirectoryGroupLabelKey(
  group: OfficialProtocolDirectoryGroup,
): string {
  return `traveltrust_protocol_directory_group_${group}`;
}
