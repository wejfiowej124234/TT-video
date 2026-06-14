import { stringToHex } from "viem";

import { PROTOCOL_SSOT_V1 } from "@/lib/governance/protocolSsot.v1";

const VALID_STAKE_JURISDICTIONS = new Set(
  PROTOCOL_SSOT_V1.jurisdictions.map((row) => row.id.toUpperCase()),
);

/**
 * protocol-ssot 辖区 id → 链上 stake `bytes2` 国家码（两字母，例 CN）。
 * 支持历史/演示子区划写法 CN-ZJ → CN（与 API `steward_stake_pool::stake_jurisdiction_country_code` 同源）。
 */
export function stakeJurisdictionCountryCode(jurisdictionId: string): string | null {
  const j = jurisdictionId.trim().toUpperCase();
  if (!j) return null;
  if (/^[A-Z]{2}$/.test(j) && VALID_STAKE_JURISDICTIONS.has(j)) return j;
  const sub = j.match(/^([A-Z]{2})[-_]/);
  if (sub && VALID_STAKE_JURISDICTIONS.has(sub[1])) return sub[1];
  return null;
}

/** 两字母辖区 → `bytes2`（与 API `steward_stake_pool::jurisdiction_bytes2` 同源，例 CN → 0x434e） */
export function jurisdictionIdToBytes2(jurisdictionId: string): `0x${string}` {
  const key = stakeJurisdictionCountryCode(jurisdictionId);
  if (!key) {
    throw new Error("invalid_jurisdiction");
  }
  return stringToHex(key, { size: 2 });
}

export function tryJurisdictionIdToBytes2(jurisdictionId: string): `0x${string}` | null {
  try {
    return jurisdictionIdToBytes2(jurisdictionId);
  } catch {
    return null;
  }
}
