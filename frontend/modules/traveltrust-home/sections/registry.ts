import type { TraveltrustHomeEntryMilestoneId } from "@/lib/traveltrust/home/milestones";
import { TRAVELTRUST_HOME_LAYOUT_LOCK_L5 } from "@/lib/traveltrustHomeLayoutLockL5";
import {
  loadTravelTrustPageCinematicCanvas,
  loadTravelTrustPageCinematicScene,
} from "@/lib/traveltrust/home/cinematic-bridge";

/** 与 layout lock 一致的叙事节顺序 */
export const TRAVELTRUST_HOME_SECTION_ORDER = TRAVELTRUST_HOME_LAYOUT_LOCK_L5.sectionOrder;

export type TraveltrustHomeSectionId = (typeof TRAVELTRUST_HOME_SECTION_ORDER)[number];

/** 入口闸预取 chunk（core 无 React · 仅路径注册表） */
export const TRAVELTRUST_HOME_CRITICAL_CHUNK_LOADERS = [
  loadTravelTrustPageCinematicScene,
  loadTravelTrustPageCinematicCanvas,
  () => import("../presentation/TravelTrustHomeComposerDynamics"),
  () => import("./TravelTrustHomeRolesSection"),
  () => import("./TravelTrustHomeLiquiditySection"),
  () => import("./TravelTrustHomeUnlockSection"),
  () => import("./TravelTrustHomeTrustSection"),
  () => import("./TravelTrustHomeSettlementSection"),
  () => import("./TravelTrustHomeStartCloseSection"),
] as const;

/** 叙事节 id → dynamic section 模块（不含 hero · hero 由 Composer 直挂） */
export const TRAVELTRUST_HOME_SECTION_CHUNK_LOADERS: Record<
  Exclude<TraveltrustHomeSectionId, "hero">,
  () => Promise<unknown>
> = {
  roles: () => import("./TravelTrustHomeRolesSection"),
  liquidity: () => import("./TravelTrustHomeLiquiditySection"),
  unlock: () => import("./TravelTrustHomeUnlockSection"),
  trust: () => import("./TravelTrustHomeTrustSection"),
  settlement: () => import("./TravelTrustHomeSettlementSection"),
};

export const TRAVELTRUST_HOME_DEFERRED_BELOW_FOLD_LOADER = () =>
  import("./TravelTrustHomeBelowFoldSection");

/** 折叠以下加载完成 → sections 里程碑 */
export const TRAVELTRUST_HOME_SECTIONS_MILESTONE: TraveltrustHomeEntryMilestoneId = "sections";
