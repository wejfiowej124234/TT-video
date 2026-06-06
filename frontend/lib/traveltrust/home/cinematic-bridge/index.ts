/**
 * 首页入口桥 → cinematic 唯一导入面（与 entryBridge 同层）。
 * 实现须经 `@/lib/traveltrust/home/cinematic-bridge`；module 下 compat shim 仅 re-export。
 * cinematic 不得反向 import home module。
 */export { UNIFIED_PAGE_3D } from "./config";
export {
  TravelTrustCinematicShell,
  TravelTrustCinematicA11y,
  TravelTrustDevChunkRecoveryNotice,
  TravelTrustReducedMotionNotice,
} from "./shell";
export {
  TravelTrustHeroScrollContext,
  TravelTrustPageScrollContext,
  TravelTrustTheaterRoleProvider,
  TravelTrustTheaterViewportContext,
  type TheaterViewportAnchor,
} from "./scroll";
export { TravelTrustBelowFoldAtmosphere, TravelTrustCinematicViewportInk } from "./backdrop";
export { TravelTrustLandingChrome } from "./landing-chrome";
export { TravelTrustSnapChapter, TravelTrustSectionFilmDivider } from "./sections-ui";
export * from "./lazy";
