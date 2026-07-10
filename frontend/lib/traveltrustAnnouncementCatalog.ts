/**
 * 公告分轨目录 · product / governance / protocol_status
 * 路线图 · CMS `/api/v1/public/roadmap`（fallback: traveltrustRoadmap2026.ts）
 * TTG 轮次 · traveltrustTtgPublicRounds.ts（公告页专区块）
 * 治理通告 · governance 轨 / TTG 区块（不在 product 列表重复 governance teaser）
 */

import {
  TRAVELTRUST_DEPLOY_PHASE1_ACTIVE_ISO,
  TRAVELTRUST_PHASE25_CLOSED_ISO,
  TRAVELTRUST_PHASE3_ENTRY_ISO,
  TRAVELTRUST_PLATFORM_LAUNCH_ISO,
  TRAVELTRUST_VACANCY_V1_ACTIVE_ISO,
} from "./traveltrustAnnouncementDates";
import type {
  TravelTrustAnnouncementCtaKind,
  TravelTrustAnnouncementKind,
  TravelTrustAnnouncementNetworkScope,
  TravelTrustAnnouncementProductTemplate,
  TravelTrustContentTier,
} from "./traveltrustNetworkAnnouncements";

export type TravelTrustAnnouncementLane = "product" | "governance" | "protocol_status";

export type TravelTrustAnnouncementWithLane = {
  id: string;
  lane: TravelTrustAnnouncementLane;
  kind: TravelTrustAnnouncementKind;
  contentTier: TravelTrustContentTier;
  messageKey: string;
  effectiveAt?: string;
  releaseAt?: string;
  targetAt?: string;
  targetLabelKey?: string;
  href?: string;
  ctaHref?: string;
  ctaKind?: TravelTrustAnnouncementCtaKind;
  pinned?: boolean;
  networkScope?: TravelTrustAnnouncementNetworkScope;
  productTemplate?: TravelTrustAnnouncementProductTemplate;
  expiresAt?: string;
};

/** 第一层 · 产品公告（首页 Pulse 默认） */
export const TRAVELTRUST_PRODUCT_ANNOUNCEMENTS: TravelTrustAnnouncementWithLane[] = [
  {
    id: "product-planned-launch",
    lane: "product",
    kind: "product",
    contentTier: "upcoming",
    messageKey: "traveltrust_product_ann_planned_launch",
    releaseAt: TRAVELTRUST_PLATFORM_LAUNCH_ISO,
    href: "/traveltrust",
    ctaHref: "/traveltrust",
    pinned: true,
    networkScope: "none",
  },
  {
    id: "product-escrow-usdc",
    lane: "product",
    kind: "trust",
    contentTier: "upcoming",
    messageKey: "traveltrust_product_ann_escrow",
    releaseAt: TRAVELTRUST_PLATFORM_LAUNCH_ISO,
    href: "/trust",
    ctaHref: "/trust",
    networkScope: "none",
  },
  {
    id: "product-guide-merchant",
    lane: "product",
    kind: "product",
    contentTier: "upcoming",
    messageKey: "traveltrust_product_ann_guide_merchant",
    releaseAt: TRAVELTRUST_PLATFORM_LAUNCH_ISO,
    href: "/provider/register",
    ctaHref: "/provider/register",
    networkScope: "none",
  },
  {
    id: "product-security-disclosure",
    lane: "product",
    kind: "trust",
    contentTier: "live",
    messageKey: "traveltrust_product_ann_security",
    effectiveAt: TRAVELTRUST_PLATFORM_LAUNCH_ISO,
    href: "/trust",
    ctaHref: "/trust",
    networkScope: "all",
  },
];

/** 第二层 · 治理通告 */
export const TRAVELTRUST_GOVERNANCE_ANNOUNCEMENTS: TravelTrustAnnouncementWithLane[] = [
  {
    id: "governance-proposals",
    lane: "governance",
    kind: "community",
    contentTier: "upcoming",
    messageKey: "traveltrust_governance_ann_proposals",
    releaseAt: TRAVELTRUST_PLATFORM_LAUNCH_ISO,
    href: "/governance/proposals",
    ctaHref: "/governance/proposals",
    ctaKind: "vote_now",
    networkScope: "testnet",
  },
  {
    id: "governance-params",
    lane: "governance",
    kind: "trust",
    contentTier: "live",
    messageKey: "traveltrust_governance_ann_params",
    effectiveAt: TRAVELTRUST_DEPLOY_PHASE1_ACTIVE_ISO,
    href: "/governance/params",
    ctaHref: "/governance/params",
    networkScope: "testnet",
  },
];

/** 第三层 · 协议 / Runtime（公告页独立「协议状态」区块 + CMS protocol_status 轨） */
export const TRAVELTRUST_PROTOCOL_STATUS_ANNOUNCEMENTS: TravelTrustAnnouncementWithLane[] = [
  {
    id: "phase3-entry-mainnet-prep",
    lane: "protocol_status",
    kind: "product",
    contentTier: "live",
    messageKey: "traveltrust_pulse_phase3_entry",
    href: "/governance/params",
    ctaHref: "/governance/params",
    effectiveAt: TRAVELTRUST_PHASE3_ENTRY_ISO,
    pinned: true,
    networkScope: "testnet",
  },
  {
    id: "product-deploy-phase3",
    lane: "protocol_status",
    kind: "product",
    contentTier: "live",
    productTemplate: "payment_option",
    messageKey: "traveltrust_pulse_deploy_phase3",
    href: "/governance/params",
    ctaHref: "/governance/params",
    effectiveAt: TRAVELTRUST_VACANCY_V1_ACTIVE_ISO,
    expiresAt: "2026-12-31",
    networkScope: "testnet",
  },
  {
    id: "product-deploy-phase2",
    lane: "protocol_status",
    kind: "product",
    contentTier: "live",
    messageKey: "traveltrust_pulse_deploy_phase2",
    href: "/governance/proposals",
    ctaHref: "/governance/proposals",
    effectiveAt: TRAVELTRUST_PHASE25_CLOSED_ISO,
    expiresAt: "2026-12-31",
    networkScope: "testnet",
  },
  {
    id: "product-deploy-phase1",
    lane: "protocol_status",
    kind: "product",
    contentTier: "live",
    productTemplate: "platform_intro",
    messageKey: "traveltrust_pulse_deploy_phase1",
    href: "/traveltrust",
    ctaHref: "/traveltrust#liquidity",
    effectiveAt: TRAVELTRUST_DEPLOY_PHASE1_ACTIVE_ISO,
    expiresAt: "2026-12-31",
    networkScope: "testnet",
  },
];

export const TRAVELTRUST_ANNOUNCEMENT_LANES: TravelTrustAnnouncementLane[] = [
  "product",
  "governance",
  "protocol_status",
];

export function traveltrustAnnouncementLaneLabelKey(lane: TravelTrustAnnouncementLane): string {
  return `traveltrust_announcements_lane_${lane}`;
}
