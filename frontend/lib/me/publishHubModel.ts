/**
 * 发布中心 · 五轨功能模型（SSOT：`PUBLISH-HUB-L5-DESIGN.md` §3）
 * 社区帖不在此页 — 见头像下拉 `header_userMenu_my_posts` → `/community/me/posts`
 */
import { PUBLISH_HUB_PATH } from "@/lib/me/publishHubL5";

export { PUBLISH_HUB_PATH };

export const PUBLISH_HUB_RAILS = [
  "all",
  "trip",
  "guide",
  "merchant",
  "acquisition",
  "governance",
] as const;

export type PublishHubRailFilter = (typeof PUBLISH_HUB_RAILS)[number];

export type PublishHubContentRail = Exclude<PublishHubRailFilter, "all">;

export type PublishHubItemRail = PublishHubContentRail;

export type { PublishHubItem, PublishHubItemStatusTone } from "@/lib/me/publishHubItemModel";

export function publishHubFilterShowsRail(
  filter: PublishHubRailFilter,
  rail: PublishHubContentRail,
): boolean {
  return filter === "all" || filter === rail;
}

/** Phase A：五轨功能 inventory / preview；无占位 Section。 */
export const PUBLISH_HUB_PHASE_A_ACTIVE_RAILS: readonly PublishHubContentRail[] = [
  "trip",
  "guide",
  "merchant",
  "acquisition",
  "governance",
];

export function publishHubRailPhaseAActive(rail: PublishHubContentRail): boolean {
  return PUBLISH_HUB_PHASE_A_ACTIVE_RAILS.includes(rail);
}

export function publishHubFilterLabelKey(filter: PublishHubRailFilter): string {
  if (filter === "all") return "publish_hub_filter_all";
  return `publish_hub_filter_${filter}`;
}

export function publishHubRailSectionLabelKey(rail: PublishHubContentRail): string {
  return `publish_hub_rail_${rail}_title`;
}

export function publishHubRailPlaceholderKey(rail: PublishHubContentRail): string {
  return `publish_hub_rail_${rail}_phase_a_placeholder`;
}

/** `?filter=` / `?rail=` 深链（① · 数据链；② identity switcher 默认轨另闸 PH-B-2） */
export function publishHubFilterFromSearchParams(
  params: Pick<URLSearchParams, "get"> | null | undefined,
): PublishHubRailFilter | null {
  if (!params) return null;
  const raw = (params.get("filter") ?? params.get("rail") ?? "").trim().toLowerCase();
  if (!raw) return null;
  return (PUBLISH_HUB_RAILS as readonly string[]).includes(raw) ? (raw as PublishHubRailFilter) : null;
}
