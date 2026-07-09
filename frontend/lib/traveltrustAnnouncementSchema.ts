/**
 * TravelTrust 公告 Schema Contract — 冻结运营模型（API / Admin / CMS 同源校验）
 *
 * 核心维度（仅两组）：
 * - kind: product | trust | community | campaign
 * - contentTier: live | upcoming | roadmap
 *
 * 条件字段：
 * | 字段          | Live | Upcoming | Roadmap |
 * | title/summary | ✅   | ✅       | ✅      |
 * | effectiveAt   | ✅   | ❌       | ❌      |
 * | releaseAt     | ❌   | 可选     | ❌      |
 * | targetAt      | ❌   | ❌       | 可选    |
 * | cta           | 可选 | 可选     | 可选    |
 * | detailsUrl    | 可选 | 可选     | 可选    |
 */

import type {
  TravelTrustAnnouncement,
  TravelTrustAnnouncementCtaKind,
  TravelTrustAnnouncementKind,
  TravelTrustContentTier,
} from "./traveltrustNetworkAnnouncements";

export const TRAVELTRUST_ANNOUNCEMENT_KIND_DEFAULT_CTA: Record<
  TravelTrustAnnouncementKind,
  TravelTrustAnnouncementCtaKind
> = {
  product: "learn_more",
  trust: "learn_more",
  community: "vote_now",
  campaign: "join_now",
};

export type TravelTrustAnnouncementContractFields = Pick<
  TravelTrustAnnouncement,
  "id" | "kind" | "contentTier" | "messageKey" | "effectiveAt" | "releaseAt" | "targetAt" | "href" | "ctaHref" | "ctaKind"
>;

export type TravelTrustRoadmapMilestoneContractFields = {
  id: string;
  kind: TravelTrustAnnouncementKind;
  contentTier: "roadmap";
  messageKey: string;
  targetAt?: string;
  targetLabelKey?: string;
  releaseAt?: string;
  effectiveAt?: string;
  href?: string;
  ctaKind?: TravelTrustAnnouncementCtaKind;
};

function pushIf(errors: string[], cond: boolean, message: string) {
  if (cond) errors.push(message);
}

/** Pulse / 公告条目契约校验 — 返回错误列表，空 = 通过 */
export function validateTraveltrustAnnouncementContract(
  item: TravelTrustAnnouncementContractFields,
): string[] {
  const errors: string[] = [];
  const id = item.id || "(missing id)";

  if (item.contentTier === "live") {
    pushIf(errors, !item.effectiveAt?.trim(), `${id}: live requires effectiveAt`);
    pushIf(errors, Boolean(item.releaseAt), `${id}: live forbids releaseAt`);
    pushIf(errors, Boolean(item.targetAt), `${id}: live forbids targetAt`);
  }

  if (item.contentTier === "upcoming") {
    pushIf(errors, Boolean(item.effectiveAt), `${id}: upcoming forbids effectiveAt`);
    pushIf(errors, Boolean(item.targetAt), `${id}: upcoming forbids targetAt`);
  }

  if (item.contentTier === "roadmap") {
    pushIf(errors, Boolean(item.effectiveAt), `${id}: roadmap forbids effectiveAt`);
    pushIf(errors, Boolean(item.releaseAt), `${id}: roadmap forbids releaseAt`);
  }

  return errors;
}

/** 路线图节点契约校验 */
export function validateTraveltrustRoadmapMilestoneContract(
  item: TravelTrustRoadmapMilestoneContractFields,
): string[] {
  const errors: string[] = [];
  const id = item.id || "(missing id)";

  pushIf(errors, item.contentTier !== "roadmap", `${id}: roadmap milestone must have contentTier roadmap`);
  pushIf(errors, Boolean(item.effectiveAt), `${id}: roadmap forbids effectiveAt`);
  pushIf(errors, Boolean(item.releaseAt), `${id}: roadmap forbids releaseAt`);

  return errors;
}

export function resolveTraveltrustAnnouncementDefaultCtaKind(
  kind: TravelTrustAnnouncementKind,
): TravelTrustAnnouncementCtaKind {
  return TRAVELTRUST_ANNOUNCEMENT_KIND_DEFAULT_CTA[kind];
}

/** 按 contentTier 解析展示用日期（前端无需分支业务规则） */
export function resolveTraveltrustAnnouncementDisplayDate(
  item: Pick<TravelTrustAnnouncement, "contentTier" | "effectiveAt" | "releaseAt" | "targetAt">,
  t: (key: string) => string,
): string | null {
  switch (item.contentTier) {
    case "live":
      return item.effectiveAt ?? null;
    case "upcoming":
      return item.releaseAt ?? t("traveltrust_roadmap_target_tbd");
    case "roadmap":
      if (item.targetAt) return `${t("traveltrust_roadmap_target_prefix")} · ${item.targetAt}`;
      return t("traveltrust_roadmap_target_tbd");
  }
}

export function traveltrustAnnouncementDisplayDateDetailLabelKey(
  contentTier: TravelTrustContentTier,
): string {
  switch (contentTier) {
    case "live":
      return "traveltrust_announcements_detail_effective";
    case "upcoming":
      return "traveltrust_announcements_detail_release";
    case "roadmap":
      return "traveltrust_announcements_detail_target";
  }
}

/** 排序键：Live 用 effectiveAt；Upcoming 用 releaseAt；Roadmap 用 targetAt */
export function traveltrustAnnouncementSortIso(
  item: Pick<TravelTrustAnnouncement, "contentTier" | "effectiveAt" | "releaseAt" | "targetAt">,
): string {
  if (item.contentTier === "live") return item.effectiveAt ?? "0000-01-01";
  if (item.contentTier === "upcoming") return item.releaseAt ?? "0000-01-01";
  return item.targetAt ?? "0000-01-01";
}
