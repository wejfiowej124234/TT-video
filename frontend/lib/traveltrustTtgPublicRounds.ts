/**
 * TTG Public Sale rounds · SSOT: TTG-TOKENOMICS-GENESIS-V2 + registry/ttg-vesting-registry.v1.yaml
 *
 * Genesis fixes Public Sale = 50% (5M) and round *roles*; per-round amounts are Registry
 * (initial 800k / 1.2M / 3M · mutable via governance · sum MUST remain 5M).
 *
 * GOV-04: per-wallet cap + min purchase. Seat stake is separate (no Country Shelf genesis bucket).
 */

import type { TraveltrustTtgRoundGovernanceStatus } from "./traveltrustAnnouncementLaneGovernance";
import { TRAVELTRUST_PLATFORM_LAUNCH_ISO } from "./traveltrustAnnouncementDates";

export type TraveltrustTtgPublicRoundStatus = TraveltrustTtgRoundGovernanceStatus;

export type TraveltrustTtgPublicRound = {
  id: "public_round_1" | "public_round_2" | "public_round_3";
  roundNumber: 1 | 2 | 3;
  status: TraveltrustTtgPublicRoundStatus;
  /** 本轮 TTG 额度（枚） */
  allocationTtg: number;
  /** GOV-04 单钱包上限（枚） */
  perWalletCapTtg: number;
  /** 用户向发放说明 locale key（非锁仓） */
  distributionKey: string;
  titleKey: string;
  paramsHref: string;
  /** 卡片 CTA — Round 2/3 治理门闸时指向提案页 */
  ctaHref: string;
  ctaLabelKey: string;
  /** Round 2/3 须治理投票开启 */
  requiresGovernanceApproval?: boolean;
};

/** Registry initial split · Genesis V2 Public Sale 50% · sum = 5_000_000 */
export const TRAVELTRUST_TTG_PUBLIC_ROUNDS: TraveltrustTtgPublicRound[] = [
  {
    id: "public_round_1",
    roundNumber: 1,
    status: "upcoming",
    allocationTtg: 800_000,
    perWalletCapTtg: 25_000,
    distributionKey: "traveltrust_ttg_round_distribution_r1",
    titleKey: "traveltrust_ttg_round_1_title",
    paramsHref: "/governance/params",
    ctaHref: "/governance/params",
    ctaLabelKey: "traveltrust_ttg_round_learn_more",
  },
  {
    id: "public_round_2",
    roundNumber: 2,
    status: "governance_approval_required",
    allocationTtg: 1_200_000,
    perWalletCapTtg: 25_000,
    distributionKey: "traveltrust_ttg_round_distribution_governance_gated",
    titleKey: "traveltrust_ttg_round_2_title",
    paramsHref: "/governance/params",
    ctaHref: "/governance/proposals",
    ctaLabelKey: "traveltrust_ttg_round_view_proposals",
    requiresGovernanceApproval: true,
  },
  {
    id: "public_round_3",
    roundNumber: 3,
    status: "governance_approval_required",
    allocationTtg: 3_000_000,
    perWalletCapTtg: 25_000,
    distributionKey: "traveltrust_ttg_round_distribution_governance_gated",
    titleKey: "traveltrust_ttg_round_3_title",
    paramsHref: "/governance/params",
    ctaHref: "/governance/proposals",
    ctaLabelKey: "traveltrust_ttg_round_view_proposals",
    requiresGovernanceApproval: true,
  },
];

/** Round 1 计划开放日与 product lane 同源（非 Production GO 承诺） */
export const TRAVELTRUST_TTG_ROUND_1_PLANNED_OPEN_ISO = TRAVELTRUST_PLATFORM_LAUNCH_ISO;

export function listTraveltrustTtgPublicRounds(): TraveltrustTtgPublicRound[] {
  return [...TRAVELTRUST_TTG_PUBLIC_ROUNDS];
}

export function traveltrustTtgRoundStatusLabelKey(status: TraveltrustTtgPublicRoundStatus): string {
  return `traveltrust_ttg_round_status_${status}`;
}

export function formatTraveltrustTtgAmount(ttg: number, locale: string): string {
  return ttg.toLocaleString(locale.startsWith("zh") ? "zh-CN" : "en-US");
}

/** Round 1 计划开放日 · 与 product lane / TRAVELTRUST_PLATFORM_LAUNCH_ISO 同源 */
export function formatTraveltrustTtgPlannedOpenDate(iso: string, locale: string): string {
  try {
    const d = new Date(`${iso}T12:00:00.000Z`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(locale.startsWith("zh") ? "zh-CN" : "en-US", {
      year: "numeric",
      month: locale.startsWith("zh") ? "long" : "short",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return iso;
  }
}

export function resolveTraveltrustTtgRoundDistributionText(
  round: TraveltrustTtgPublicRound,
  t: (key: string, vars?: Record<string, string | number>) => string,
  locale: string,
): string {
  if (round.id === "public_round_1") {
    return t("traveltrust_ttg_round_distribution_r1", {
      date: formatTraveltrustTtgPlannedOpenDate(TRAVELTRUST_TTG_ROUND_1_PLANNED_OPEN_ISO, locale),
    });
  }
  return t(round.distributionKey);
}
