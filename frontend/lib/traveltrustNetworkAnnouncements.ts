/** 网络页公告 — ① 本地静态；② 可换 API `GET /api/v1/traveltrust/announcements` */

import {
  TRAVELTRUST_GOVERNANCE_ANNOUNCEMENTS,
  TRAVELTRUST_PRODUCT_ANNOUNCEMENTS,
  TRAVELTRUST_PROTOCOL_STATUS_ANNOUNCEMENTS,
  traveltrustAnnouncementLaneLabelKey,
  type TravelTrustAnnouncementLane,
  type TravelTrustAnnouncementWithLane,
} from "./traveltrustAnnouncementCatalog";
import {
  TRAVELTRUST_DEPLOY_PHASE1_ACTIVE_ISO,
  TRAVELTRUST_DEPLOY_PHASE2_ISO,
  TRAVELTRUST_DEPLOY_PHASE3_ISO,
  TRAVELTRUST_PHASE25_CLOSED_ISO,
  TRAVELTRUST_PHASE3_ENTRY_ISO,
  TRAVELTRUST_PLATFORM_LAUNCH_ISO,
  TRAVELTRUST_VACANCY_V1_ACTIVE_ISO,
} from "./traveltrustAnnouncementDates";
import {
  resolveTraveltrustAnnouncementDefaultCtaKind,
  traveltrustAnnouncementSortIso,
  validateTraveltrustAnnouncementContract,
} from "./traveltrustAnnouncementSchema";

export {
  TRAVELTRUST_DEPLOY_PHASE1_ACTIVE_ISO,
  TRAVELTRUST_DEPLOY_PHASE2_ISO,
  TRAVELTRUST_DEPLOY_PHASE3_ISO,
  TRAVELTRUST_PHASE25_CLOSED_ISO,
  TRAVELTRUST_PHASE3_ENTRY_ISO,
  TRAVELTRUST_PLATFORM_LAUNCH_ISO,
  TRAVELTRUST_VACANCY_V1_ACTIVE_ISO,
};
export type { TravelTrustAnnouncementLane, TravelTrustAnnouncementWithLane };
export {
  TRAVELTRUST_ANNOUNCEMENT_LANES,
  TRAVELTRUST_GOVERNANCE_ANNOUNCEMENTS,
  TRAVELTRUST_PRODUCT_ANNOUNCEMENTS,
  TRAVELTRUST_PROTOCOL_STATUS_ANNOUNCEMENTS,
  traveltrustAnnouncementLaneLabelKey,
} from "./traveltrustAnnouncementCatalog";

/**
 * 运营模型 · 四条独立时间线（禁止混排）
 *
 * lane: product | governance | protocol_status  (+ roadmap · ttg_round 独立模块)
 * kind: product | trust | community | campaign
 * contentTier: live | upcoming | roadmap
 */
export const TRAVELTRUST_PUBLIC_DISCLOSURE_REGISTRY = "registry/traveltrust-public-disclosure.v1.yaml" as const;

export const TRAVELTRUST_PULSE_LEGACY_ID_ALIASES: Readonly<Record<string, string>> = {
  "trust-escrow-core": "product-deploy-phase1",
  "product-intro": "product-deploy-phase1",
};

export const TRAVELTRUST_ANNOUNCEMENT_OPS_RULES = {
  kinds: ["product", "trust", "community", "campaign"] as const,
  lanes: ["product", "governance", "protocol_status"] as const,
  contentTiers: ["live", "upcoming", "roadmap"] as const,
  maxPulseVisible: 6,
  frozen: true as const,
} as const;

export const TRAVELTRUST_ANNOUNCEMENTS_PATH = "/traveltrust/announcements";
export const TRAVELTRUST_PULSE_MAX_VISIBLE = 6;
export const TRAVELTRUST_ANNOUNCEMENTS_TTG_SECTION_ID = "ttg-governance" as const;
export const TRAVELTRUST_ANNOUNCEMENTS_PROTOCOL_SECTION_ID = "protocol-runtime" as const;

export const TRAVELTRUST_ANNOUNCEMENT_LIFECYCLE = {
  trust: "permanent",
  productDays: 30,
  campaign: "expires_at",
  community: "expires_at",
} as const;

export type TravelTrustAnnouncementKind = "product" | "trust" | "community" | "campaign";
export type TravelTrustAnnouncementProductTemplate =
  | "platform_intro"
  | "destination"
  | "booking_feature"
  | "payment_option"
  | "guide_service";
export type TravelTrustAnnouncementNetworkScope = "mainnet" | "testnet" | "all" | "none";
export type TravelTrustAnnouncementCtaKind = "book_now" | "learn_more" | "vote_now" | "join_now";
export type TravelTrustContentTier = "live" | "upcoming" | "roadmap";

export type TravelTrustAnnouncement = TravelTrustAnnouncementWithLane;

/** 全量登记（分轨合并 · 深链 / 契约校验） */
export const TRAVELTRUST_NETWORK_ANNOUNCEMENTS: TravelTrustAnnouncement[] = [
  ...TRAVELTRUST_PRODUCT_ANNOUNCEMENTS,
  ...TRAVELTRUST_GOVERNANCE_ANNOUNCEMENTS,
  ...TRAVELTRUST_PROTOCOL_STATUS_ANNOUNCEMENTS,
];

const ANNOUNCEMENT_SOURCE_INDEX = new Map(
  TRAVELTRUST_NETWORK_ANNOUNCEMENTS.map((item, index) => [item.id, index]),
);

function sortAnnouncements(a: TravelTrustAnnouncement, b: TravelTrustAnnouncement): number {
  return (ANNOUNCEMENT_SOURCE_INDEX.get(a.id) ?? 0) - (ANNOUNCEMENT_SOURCE_INDEX.get(b.id) ?? 0);
}

function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function traveltrustAnnouncementPageHref(announcementId?: string): string {
  if (!announcementId) return TRAVELTRUST_ANNOUNCEMENTS_PATH;
  const resolved = TRAVELTRUST_PULSE_LEGACY_ID_ALIASES[announcementId] ?? announcementId;
  return `${TRAVELTRUST_ANNOUNCEMENTS_PATH}#${resolved}`;
}

export function resolveTraveltrustPulseAnnouncementId(id: string): string {
  return TRAVELTRUST_PULSE_LEGACY_ID_ALIASES[id] ?? id;
}

export function resolveTraveltrustAnnouncementExpiresAt(item: TravelTrustAnnouncement): string | null {
  if (item.pinned || item.kind === "trust") return null;
  if (item.expiresAt) return item.expiresAt;
  if (item.kind === "product" && item.effectiveAt) {
    return addDaysIso(item.effectiveAt, TRAVELTRUST_ANNOUNCEMENT_LIFECYCLE.productDays);
  }
  return null;
}

export function isTraveltrustAnnouncementActive(
  item: TravelTrustAnnouncement,
  now: Date = new Date(),
): boolean {
  if (item.pinned || item.kind === "trust") return true;
  if (item.contentTier === "upcoming") return true;
  if (item.lane === "product" && item.contentTier === "live" && !item.effectiveAt) return true;

  const today = now.toISOString().slice(0, 10);

  if (item.kind === "campaign" || item.kind === "community") {
    if (!item.expiresAt) return item.lane === "governance";
    return today <= item.expiresAt;
  }

  if (item.kind === "product") {
    const expires = resolveTraveltrustAnnouncementExpiresAt(item);
    return expires ? today <= expires : true;
  }

  return true;
}

export function traveltrustAnnouncementBenefitKey(messageKey: string): string {
  return `${messageKey}_benefit`;
}

export function traveltrustContentTierLabelKey(tier: TravelTrustContentTier): string {
  return `traveltrust_content_tier_${tier}`;
}

export function traveltrustAnnouncementCtaHref(item: TravelTrustAnnouncement): string | undefined {
  return item.ctaHref ?? item.href;
}

export function resolveTraveltrustAnnouncementCtaKind(
  item: TravelTrustAnnouncement,
): TravelTrustAnnouncementCtaKind {
  return item.ctaKind ?? resolveTraveltrustAnnouncementDefaultCtaKind(item.kind);
}

export function resolveTraveltrustAnnouncementRowCtaLabelKey(item: TravelTrustAnnouncement): string {
  if (item.contentTier !== "live") {
    return "traveltrust_pulse_view_detail";
  }
  if (item.kind === "campaign" || item.kind === "community") {
    return `traveltrust_pulse_cta_${resolveTraveltrustAnnouncementCtaKind(item)}`;
  }
  return "traveltrust_pulse_view_detail";
}

const PROTOCOL_MODAL_CTA_LABEL_KEYS: Readonly<Record<string, string>> = {
  "phase3-entry-mainnet-prep": "traveltrust_announcements_detail_cta_view_params",
  "product-deploy-phase3": "traveltrust_announcements_detail_cta_view_params",
  "product-deploy-phase2": "traveltrust_announcements_detail_cta_view_proposals",
  "product-deploy-phase1": "traveltrust_announcements_detail_cta_subscribe_ttg",
};

const PRODUCT_MODAL_CTA_LABEL_KEYS: Readonly<Record<string, string>> = {
  "product-ttg-v8-25t": "traveltrust_pulse_cta_learn_more",
  "campaign-referral": "traveltrust_pulse_cta_join_now",
  "product-role-traveler": "traveltrust_pulse_cta_learn_more",
  "product-role-guide": "traveltrust_pulse_cta_learn_more",
  "product-role-merchant": "traveltrust_pulse_cta_learn_more",
  "product-role-acquisition": "traveltrust_pulse_cta_learn_more",
  "product-role-steward": "traveltrust_pulse_cta_learn_more",
  "product-planned-launch": "traveltrust_product_ann_cta_explore",
  "product-escrow-usdc": "traveltrust_product_ann_cta_trust",
  "product-guide-merchant": "traveltrust_product_ann_cta_apply",
  "product-governance-teaser": "traveltrust_announcements_detail_cta_view_proposals",
  "product-security-disclosure": "traveltrust_product_ann_cta_trust",
  "governance-proposals": "traveltrust_announcements_detail_cta_view_proposals",
  "governance-params": "traveltrust_announcements_detail_cta_view_params",
};

export function isTraveltrustPulseDeployAnnouncement(id: string): boolean {
  return id in PROTOCOL_MODAL_CTA_LABEL_KEYS;
}

export function resolveTraveltrustAnnouncementModalCtaLabelKey(item: TravelTrustAnnouncement): string {
  if (item.contentTier !== "live") {
    return "traveltrust_announcements_detail_view_full";
  }
  const productKey = PRODUCT_MODAL_CTA_LABEL_KEYS[item.id];
  if (productKey) return productKey;
  const protocolKey = PROTOCOL_MODAL_CTA_LABEL_KEYS[item.id];
  if (protocolKey) return protocolKey;
  return `traveltrust_pulse_cta_${resolveTraveltrustAnnouncementCtaKind(item)}`;
}

export function resolveTraveltrustAnnouncementPreviewStatusLabelKey(
  item: TravelTrustAnnouncement,
): string | null {
  if (item.contentTier === "upcoming" && item.releaseAt === TRAVELTRUST_PLATFORM_LAUNCH_ISO) {
    return "traveltrust_announcements_detail_status_planned_launch";
  }
  if (item.contentTier === "live" && item.networkScope === "mainnet") {
    return "traveltrust_announcements_detail_status_mainnet_live";
  }
  if (item.networkScope === "testnet" && item.contentTier === "live") {
    return "traveltrust_announcements_detail_status_sepolia_active";
  }
  if (item.networkScope === "testnet" && item.contentTier === "upcoming") {
    return "traveltrust_announcements_detail_status_sepolia_planned";
  }
  if (item.networkScope === "all" && item.contentTier === "live") {
    return "traveltrust_announcements_detail_status_available";
  }
  return null;
}

export function traveltrustAnnouncementPreviewStatusBadgeTone(
  item: TravelTrustAnnouncement,
): "active" | "live" | "planned" | null {
  const key = resolveTraveltrustAnnouncementPreviewStatusLabelKey(item);
  if (!key) return null;
  if (key === "traveltrust_announcements_detail_status_mainnet_live") return "live";
  if (key === "traveltrust_announcements_detail_status_sepolia_active") return "active";
  return "planned";
}

export function assertTraveltrustAnnouncementsSchemaContract(
  items: TravelTrustAnnouncement[] = TRAVELTRUST_NETWORK_ANNOUNCEMENTS,
): string[] {
  return items.flatMap((item) => validateTraveltrustAnnouncementContract(item));
}

function sortAnnouncementsByTimeline(a: TravelTrustAnnouncement, b: TravelTrustAnnouncement): number {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  const dateCmp = traveltrustAnnouncementSortIso(b).localeCompare(traveltrustAnnouncementSortIso(a));
  if (dateCmp !== 0) return dateCmp;
  return sortAnnouncements(a, b);
}

function listActiveInLane(lane: TravelTrustAnnouncementLane): TravelTrustAnnouncement[] {
  return TRAVELTRUST_NETWORK_ANNOUNCEMENTS.filter(
    (item) => item.lane === lane && isTraveltrustAnnouncementActive(item),
  ).sort(sortAnnouncements);
}

export function listTraveltrustAnnouncementsByLane(lane: TravelTrustAnnouncementLane): TravelTrustAnnouncement[] {
  return listActiveInLane(lane);
}

export function listTraveltrustNetworkAnnouncementsTimeline(): TravelTrustAnnouncement[] {
  return [...TRAVELTRUST_NETWORK_ANNOUNCEMENTS.filter((item) => isTraveltrustAnnouncementActive(item))].sort(
    sortAnnouncementsByTimeline,
  );
}

export function listActiveTraveltrustNetworkAnnouncements(): TravelTrustAnnouncement[] {
  return TRAVELTRUST_NETWORK_ANNOUNCEMENTS.filter((item) => isTraveltrustAnnouncementActive(item)).sort(
    sortAnnouncements,
  );
}

/** 首页 Pulse · 仅 product 轨 */
export function listTraveltrustPulseProductAnnouncements(): TravelTrustAnnouncement[] {
  return listActiveInLane("product").slice(0, TRAVELTRUST_PULSE_MAX_VISIBLE);
}

/** @deprecated 使用 listTraveltrustPulseProductAnnouncements */
export function listTraveltrustNetworkAnnouncementsNewestFirst(): TravelTrustAnnouncement[] {
  return listTraveltrustPulseProductAnnouncements();
}

export function traveltrustAnnouncementPhaseLabelKey(id: string): string {
  switch (id) {
    case "phase3-entry-mainnet-prep":
      return "traveltrust_pulse_phase_label_entry";
    case "product-deploy-phase3":
      return "traveltrust_pulse_phase_label_3";
    case "product-deploy-phase2":
      return "traveltrust_pulse_phase_label_2";
    case "product-deploy-phase1":
      return "traveltrust_pulse_phase_label_1";
    default:
      return "traveltrust_pulse_phase_label_update";
  }
}

export function traveltrustAnnouncementListLabelKey(item: TravelTrustAnnouncement): string {
  if (item.lane === "protocol_status") {
    return traveltrustAnnouncementPhaseLabelKey(item.id);
  }
  return traveltrustAnnouncementLaneLabelKey(item.lane);
}

export function formatTraveltrustAnnouncementListDate(
  iso: string | undefined,
  locale: string,
): string | null {
  if (!iso) return null;
  try {
    const d = new Date(`${iso}T12:00:00.000Z`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(locale.startsWith("zh") ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return iso;
  }
}

export {
  resolveTraveltrustAnnouncementDefaultCtaKind,
  resolveTraveltrustAnnouncementDisplayDate,
  traveltrustAnnouncementDisplayDateDetailLabelKey,
  traveltrustAnnouncementSortIso,
  TRAVELTRUST_ANNOUNCEMENT_KIND_DEFAULT_CTA,
  validateTraveltrustAnnouncementContract,
  validateTraveltrustRoadmapMilestoneContract,
} from "./traveltrustAnnouncementSchema";
