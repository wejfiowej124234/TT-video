import type { CountryRow84 } from "@/lib/governanceParams84Readonly";
import {
  PROTOCOL_SSOT_V1,
  type ProtocolJurisdiction,
  type ProtocolJurisdictionId,
} from "@/lib/governance/protocolSsot.v1";

const PHASE1_COUNTRY_EN: Record<string, { name: string; notes?: string }> = {
  中国: { name: "China", notes: "Major inbound tourism market" },
  美国: { name: "United States", notes: "High-spend market" },
  法国: { name: "France", notes: "Global destination" },
  西班牙: { name: "Spain", notes: "High consumption" },
  日本: { name: "Japan", notes: "Premium travel" },
  泰国: { name: "Thailand", notes: "Popular in Asia" },
  新加坡: { name: "Singapore", notes: "Premium hub" },
  韩国: { name: "South Korea", notes: "Asia" },
  澳大利亚: { name: "Australia", notes: "High consumption" },
  阿联酋: { name: "United Arab Emirates", notes: "Middle East" },
};

/** 84 镜像 `name_zh` → protocol-ssot jurisdiction id */
export const PHASE1_NAME_ZH_TO_JURISDICTION: Record<string, ProtocolJurisdictionId> = {
  中国: "CN",
  美国: "US",
  法国: "FR",
  西班牙: "ES",
  日本: "JP",
  泰国: "TH",
  新加坡: "SG",
  韩国: "KR",
  澳大利亚: "AU",
  阿联酋: "AE",
};

export type Phase1CountryProtocolStake = {
  jurisdictionId: ProtocolJurisdictionId;
  jurisdiction: ProtocolJurisdiction;
  stewardStakeBps: number;
  stewardStakeTtgUnits: number;
  feeCapFeePointsAligned: boolean;
  openFeePointsAligned: boolean;
};

function feePointsMatchBps(feePoints: number, bps: number): boolean {
  return Math.abs(feePoints * 100 - bps) < 0.01;
}

export function resolvePhase1JurisdictionId(nameZh: string): ProtocolJurisdictionId | null {
  return PHASE1_NAME_ZH_TO_JURISDICTION[nameZh.trim()] ?? null;
}

/** 十国表 · 84 费点 ↔ protocol-ssot Seat 质押对拍（① 只读） */
export function resolvePhase1CountryProtocolStake(row: CountryRow84): Phase1CountryProtocolStake | null {
  const jurisdictionId = resolvePhase1JurisdictionId(row.name_zh);
  if (!jurisdictionId) return null;
  const jurisdiction = PROTOCOL_SSOT_V1.jurisdictions.find((j) => j.id === jurisdictionId);
  if (!jurisdiction) return null;
  const stewardStakeTtgUnits =
    (PROTOCOL_SSOT_V1.ttg.total_supply * jurisdiction.steward_stake_bps) / 10_000;
  return {
    jurisdictionId,
    jurisdiction,
    stewardStakeBps: jurisdiction.steward_stake_bps,
    stewardStakeTtgUnits,
    feeCapFeePointsAligned: feePointsMatchBps(
      row.national_pool_cap_fee_points,
      jurisdiction.fee_route_bps,
    ),
    openFeePointsAligned: feePointsMatchBps(row.phase1_open_fee_points, jurisdiction.phase1_open_bps),
  };
}

export function formatPhase1StewardStakeTtg(units: number, locale: string): string {
  return units.toLocaleString(locale.startsWith("zh") ? "zh-CN" : "en-US", {
    maximumFractionDigits: 0,
  });
}

export function resolvePhase1CountryDisplay(
  row: CountryRow84,
  locale: string,
): { name: string; notes: string | undefined } {
  if (locale.startsWith("zh")) {
    return { name: row.name_zh, notes: row.notes };
  }
  const mapped = PHASE1_COUNTRY_EN[row.name_zh];
  return {
    name: mapped?.name ?? row.name_zh,
    notes: mapped?.notes ?? row.notes,
  };
}
