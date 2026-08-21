/**
 * Official www 「协议总清单」 rows — mainnet read-only disclosure (chain_id=1).
 * SSOT: registry/mainnet-address-registry.v1.yaml · frontend/.env.mainnet.local
 * Official create path: Wired → SR-FT (not Track1 SR 0xe5C3…).
 * ≠ Production GO · do not send funds.
 */

export type OfficialProtocolDirectoryGroup = "money_path" | "governance" | "primary_market";

export type OfficialProtocolDirectoryRow = {
  id: string;
  order: number;
  address: `0x${string}`;
  group: OfficialProtocolDirectoryGroup;
  titleKey: string;
  descriptionKey: string;
};

/** Official live disclosure set (matches www 2026-08-16 product pin + FTB). */
export const OFFICIAL_MAINNET_PROTOCOL_DIRECTORY_ROWS: OfficialProtocolDirectoryRow[] = [
  {
    id: "escrow_factory_v2_wired",
    order: 1,
    address: "0xEE0BE3a8a8658E06c44539deD758Fb70A7f3C1C6",
    group: "money_path",
    titleKey: "traveltrust_protocol_directory_row_escrow_factory_title",
    descriptionKey: "traveltrust_protocol_directory_row_escrow_factory_desc",
  },
  {
    id: "settlement_router_ft",
    order: 2,
    address: "0xD1DAE665eDc16FCEc7b7530Ead3504A846457147",
    group: "money_path",
    titleKey: "traveltrust_protocol_directory_row_settlement_router_title",
    descriptionKey: "traveltrust_protocol_directory_row_settlement_router_desc",
  },
  {
    id: "fee_router",
    order: 3,
    address: "0x2aF47CB6390d7e51C210920b0A62d4d3abD68A72",
    group: "money_path",
    titleKey: "traveltrust_protocol_directory_row_fee_router_title",
    descriptionKey: "traveltrust_protocol_directory_row_fee_router_desc",
  },
  {
    id: "governance_timelock",
    order: 4,
    address: "0x50F0B26167EC73e327D97c54C81F1c1B9eFB22f7",
    group: "governance",
    titleKey: "traveltrust_protocol_directory_row_timelock_title",
    descriptionKey: "traveltrust_protocol_directory_row_timelock_desc",
  },
  {
    id: "governor",
    order: 5,
    address: "0x46Ce671b04d21760e496646bb370ADEbC374ea4d",
    group: "governance",
    titleKey: "traveltrust_protocol_directory_row_governor_title",
    descriptionKey: "traveltrust_protocol_directory_row_governor_desc",
  },
  {
    id: "governance_token",
    order: 6,
    address: "0x3cB1b328E7a4ea01006b0697813aFEEdafe8512A",
    group: "governance",
    titleKey: "traveltrust_protocol_directory_row_governance_token_title",
    descriptionKey: "traveltrust_protocol_directory_row_governance_token_desc",
  },
  {
    id: "primary_market",
    order: 7,
    address: "0xf7B7BBa2a5f21b91Fbb016d6B8853DEFa34f56ce",
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
