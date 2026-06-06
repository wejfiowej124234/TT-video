import type { GuideCardItem } from "./GuideCard";

/** 将 `getGuide` 详情 PATCH 到列表项，保持 `id` 不被覆盖。 */
export function mergeGuideFromApi(base: GuideCardItem, api: unknown): GuideCardItem {
  if (api == null || typeof api !== "object") return base;
  const patch = api as Partial<GuideCardItem>;
  return { ...base, ...patch, id: base.id };
}
