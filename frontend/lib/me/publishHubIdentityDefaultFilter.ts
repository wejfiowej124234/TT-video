/**
 * 发布中心 · 身份语境默认筛选（① · PH-B-2 本地子集；顶栏 switcher 全量留 ②）
 */
import type { PublishHubRailFilter } from "@/lib/me/publishHubModel";

export const PUBLISH_HUB_IDENTITY_QUERY_VALUES = [
  "traveler",
  "guide",
  "merchant",
  "acquisition",
  "region_steward",
] as const;

export type PublishHubIdentityQuery = (typeof PUBLISH_HUB_IDENTITY_QUERY_VALUES)[number];

const IDENTITY_TO_FILTER: Record<PublishHubIdentityQuery, PublishHubRailFilter> = {
  traveler: "trip",
  guide: "guide",
  merchant: "merchant",
  acquisition: "acquisition",
  region_steward: "governance",
};

export function publishHubFilterFromIdentityParam(
  raw: string | null | undefined,
): PublishHubRailFilter | null {
  const v = raw?.trim().toLowerCase();
  if (!v) return null;
  return (PUBLISH_HUB_IDENTITY_QUERY_VALUES as readonly string[]).includes(v)
    ? IDENTITY_TO_FILTER[v as PublishHubIdentityQuery]
    : null;
}

/** 无 URL 筛选时：按已开通 operator 槽推断默认轨（多槽时保持「全部」）；workspace context 见 `publishHubWorkspaceContextSync` */
export function publishHubDefaultFilterFromUnlockedSlots(opts: {
  guideUnlocked: boolean;
  merchantUnlocked: boolean;
  acquisitionUnlocked: boolean;
  stewardUnlocked: boolean;
}): PublishHubRailFilter | null {
  const unlocked: PublishHubRailFilter[] = [];
  if (opts.guideUnlocked) unlocked.push("guide");
  if (opts.merchantUnlocked) unlocked.push("merchant");
  if (opts.acquisitionUnlocked) unlocked.push("acquisition");
  if (opts.stewardUnlocked) unlocked.push("governance");
  return unlocked.length === 1 ? unlocked[0]! : null;
}
