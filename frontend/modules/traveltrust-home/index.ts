/**
 * TravelTrust 营销首页模块（企业分层入口）
 *
 * - core/：纯逻辑（里程碑、预取、常量）
 * - context/：入口闸状态
 * - hooks/：里程碑上报
 * - presentation/：读条 UI、页面壳、layout 预取
 *
 * UI 区块经 `@/lib/traveltrust/home/cinematic-bridge` 引用 cinematic；
 * 样式 token SSOT 位于 lib/traveltrust/l5（`traveltrustCinematicNonGlobeL5` 为兼容门面）。
 */

export { TRAVELTRUST_HOME_ENTRY_GATE_L5, TRAVELTRUST_HOME_PREFETCH_L5, TRAVELTRUST_HOME_WEBGL_MOUNT_MS } from "./core/constants";
export {
  TRAVELTRUST_HOME_ENTRY_MILESTONES,
  TRAVELTRUST_HOME_ENTRY_MILESTONE_WEIGHTS,
  computeTraveltrustHomeEntryProgress,
  isTraveltrustHomeEntryComplete,
  type TraveltrustHomeEntryMilestoneId,
} from "./core/milestones";
export {
  runTraveltrustHomeCriticalPrefetch,
  scheduleTraveltrustHomeDeferredPrefetch,
  shouldSkipTraveltrustHomeEntryGate,
  markTraveltrustHomeEntryGateDone,
} from "./core/prefetch";
export { HomeEntryGateProvider, useHomeEntryGate } from "./context/HomeEntryGateContext";
export { useTraveltrustHomeEntryMilestone } from "./hooks/useTraveltrustHomeEntryMilestone";
export { TravelTrustHomeEntryOverlay } from "./presentation/TravelTrustHomeEntryOverlay";
export { TravelTrustHomePageShell } from "./presentation/TravelTrustHomePageShell";
export { TravelTrustHomePrefetchBoot } from "./presentation/TravelTrustHomePrefetchBoot";
export { TravelTrustNetworkPageComposer } from "./presentation/TravelTrustNetworkPageComposer";
export {
  TRAVELTRUST_HOME_SECTION_ORDER,
  TravelTrustHomeHeroSection,
  TravelTrustHomeBelowFoldSection,
  TravelTrustHomeWebGLLayer,
} from "./sections";
