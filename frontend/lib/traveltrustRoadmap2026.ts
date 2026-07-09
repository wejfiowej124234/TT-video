/** TravelTrust 2026 用户向路线图 — 状态由运营手动更新，不因日期自动变为「已完成」 */

import {
  resolveTraveltrustAnnouncementDisplayDate,
  traveltrustAnnouncementDisplayDateDetailLabelKey,
  validateTraveltrustRoadmapMilestoneContract,
} from "./traveltrustAnnouncementSchema";
import {
  TRAVELTRUST_ANNOUNCEMENT_OPS_RULES,
  TRAVELTRUST_DEPLOY_PHASE2_ISO,
  TRAVELTRUST_DEPLOY_PHASE3_ISO,
  TRAVELTRUST_PLATFORM_LAUNCH_ISO,
  type TravelTrustAnnouncementCtaKind,
  type TravelTrustAnnouncementKind,
  type TravelTrustContentTier,
} from "./traveltrustNetworkAnnouncements";

export {
  TRAVELTRUST_ANNOUNCEMENT_OPS_RULES,
  TRAVELTRUST_DEPLOY_PHASE2_ISO,
  TRAVELTRUST_DEPLOY_PHASE3_ISO,
  TRAVELTRUST_PLATFORM_LAUNCH_ISO,
};
export {
  TRAVELTRUST_PRODUCT_ROADMAP_ANCHOR,
  TRAVELTRUST_ROADMAP_2026_ANCHOR,
} from "./cmsRoadmapTypes";

/** 运营手动维护 · 须有证据才可标 completed */
export type TravelTrustRoadmapOpsStatus = "planned" | "in_progress" | "completed";

export type TravelTrustRoadmapMilestone = {
  id: string;
  sortOrder: number;
  status: TravelTrustRoadmapOpsStatus;
  contentTier: Extract<TravelTrustContentTier, "roadmap">;
  kind: TravelTrustAnnouncementKind;
  messageKey: string;
  benefitKey: string;
  targetAt?: string;
  targetLabelKey?: string;
  href?: string;
  ctaKind?: TravelTrustAnnouncementCtaKind;
};

/** 2026 · 可交付里程碑（TTG 认购见上方 TTG 区块 · 不在此重复） */
export const TRAVELTRUST_ROADMAP_2026: TravelTrustRoadmapMilestone[] = [
  {
    id: "milestone-app-launch",
    sortOrder: 10,
    status: "planned",
    contentTier: "roadmap",
    kind: "product",
    messageKey: "traveltrust_roadmap_2026_app",
    benefitKey: "traveltrust_roadmap_2026_app_benefit",
    targetLabelKey: "traveltrust_roadmap_target_2026_milestone",
    href: "/traveltrust",
    ctaKind: "learn_more",
  },
  {
    id: "milestone-china-guides",
    sortOrder: 20,
    status: "planned",
    contentTier: "roadmap",
    kind: "product",
    messageKey: "traveltrust_roadmap_2026_china_guides",
    benefitKey: "traveltrust_roadmap_2026_china_guides_benefit",
    targetLabelKey: "traveltrust_roadmap_target_2026_milestone",
    href: "/traveltrust/announcements#product-roadmap-milestone-china-guides",
    ctaKind: "learn_more",
  },
];

export function listTraveltrustRoadmap2026Milestones(): TravelTrustRoadmapMilestone[] {
  return [...TRAVELTRUST_ROADMAP_2026].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function assertTraveltrustRoadmap2026SchemaContract(
  items: TravelTrustRoadmapMilestone[] = TRAVELTRUST_ROADMAP_2026,
): string[] {
  return items.flatMap((item) =>
    validateTraveltrustRoadmapMilestoneContract({
      id: item.id,
      kind: item.kind,
      contentTier: item.contentTier,
      messageKey: item.messageKey,
      targetAt: item.targetAt,
      targetLabelKey: item.targetLabelKey,
      href: item.href,
      ctaKind: item.ctaKind,
    }),
  );
}

export function traveltrustRoadmapStatusLabelKey(status: TravelTrustRoadmapOpsStatus): string {
  return `traveltrust_roadmap_status_${status}`;
}

export function resolveTraveltrustRoadmapTargetLabel(
  item: TravelTrustRoadmapMilestone,
  t: (key: string) => string,
): string {
  if (item.targetAt) {
    return `${t("traveltrust_roadmap_target_prefix")} · ${item.targetAt}`;
  }
  if (item.targetLabelKey) return t(item.targetLabelKey);
  return t("traveltrust_roadmap_target_tbd");
}

export {
  resolveTraveltrustAnnouncementDisplayDate,
  traveltrustAnnouncementDisplayDateDetailLabelKey,
};
