/**
 * Hero 旅游地球动画 · 维护者锁定清单（`TT-GLOBE-L5-FROZEN-2026-05` · ①）
 *
 * **禁止**在未解除锁定前改动下列路径（含视觉 token、光照、弧线、针脚、大气）。
 * 解除条件：用户 / maintainer 书面明确「解除地球锁定」+ 更新本文件 `LOCKED_AT` + 证据 README。
 *
 * 证据 SSOT：`frontend/evidence/GO_local_hero_globe_a_closure/README.md`
 */

export const TRAVELTRUST_HERO_GLOBE_FROZEN_ID = "TT-GLOBE-L5-FROZEN-2026-05" as const;

/** 用户书面解除锁定后暖化批次（空域 + 球面 · L5 色系统一） */
export const TRAVELTRUST_HERO_GLOBE_UNLOCK_PASS = "TT-GLOBE-L5-UNLOCK-WARM-INK-2026-05" as const;

/** Pass A · 地球写实（褐化/弱 PBR/半径 SSOT · ①）— 已书面批准 2026-05-21 */
export const TRAVELTRUST_HERO_GLOBE_EARTH_REALISM_UNLOCK_PASS =
  "TT-GLOBE-L5-UNLOCK-EARTH-REALISM-2026-05" as const;

/** 解除锁定日（①） */
export const TRAVELTRUST_HERO_GLOBE_UNLOCKED_AT = "2026-05-20";

/** Pass A 地球写实解锁日（①） */
export const TRAVELTRUST_HERO_GLOBE_EARTH_REALISM_UNLOCKED_AT = "2026-05-21";

/** 本批次收口复锁日（P0 目视冻结后更新 · ①） */
export const TRAVELTRUST_HERO_GLOBE_FROZEN_LOCKED_AT = "2026-05-21";

/** Pass A 小幅提亮批次（`traveltrustHeroGlobeBrighten.ts` · ①） */
export const TRAVELTRUST_HERO_GLOBE_PASS_A_BRIGHTEN_AT = "2026-05-21";

/** Director Final Pass · 镜头语言（冻结 Pass A filter · ①） */
export const TRAVELTRUST_HERO_L5_DIRECTOR_FINAL_PASS_AT = "2026-05-21";

/**
 * 相对仓库根路径。CI / 契约测试：文件存在且含 `TRAVELTRUST_HERO_GLOBE_FROZEN_ID` 或 `@frozen TT-GLOBE-L5-FROZEN`。
 */
export const TRAVELTRUST_HERO_GLOBE_FROZEN_RELATIVE_PATHS = [
  "frontend/lib/traveltrustHeroGlobeFrozenManifest.ts",
  "frontend/lib/traveltrustGlobeEarthAsset.ts",
  "frontend/lib/traveltrustGlobeSun.ts",
  "frontend/lib/traveltrustGlobeEarthTexture.ts",
  "frontend/lib/traveltrustCinematicVisual.ts",
  "frontend/lib/traveltrustCinematicPageL5.ts",
  "frontend/lib/traveltrustPhase1GlobeRegions.ts",
  "frontend/lib/traveltrustGlobeArcCull.ts",
  "frontend/lib/traveltrustGlobeGeodesy.ts",
  "frontend/lib/traveltrustGlobePinDisplay.ts",
  "frontend/lib/traveltrustGlobeHeroHud.ts",
  "frontend/lib/traveltrustHeroL5DirectorFinalPass.ts",
  "frontend/lib/traveltrustHeroCinematicAlign.ts",
  "frontend/lib/traveltrustHeroGlobeAlign.ts",
  "frontend/lib/traveltrustHeroSplitLayout.ts",
  "frontend/lib/traveltrustGlobeHeroTuning.ts",
  "frontend/lib/traveltrustHeroGlobeBrighten.ts",
  "frontend/components/traveltrust/cinematic/TravelTrustTourismGlobe.tsx",
  "frontend/components/traveltrust/cinematic/TravelTrustTourismGlobeLayers.tsx",
  "frontend/components/traveltrust/cinematic/TravelTrustPhase1TravelArcs.tsx",
  "frontend/components/traveltrust/cinematic/TravelTrustPhase1GlobeHighlights.tsx",
  "frontend/components/traveltrust/cinematic/TravelTrustGlobeInteractionContext.tsx",
  "frontend/components/traveltrust/cinematic/TravelTrustCinematicBloom.tsx",
  "frontend/components/traveltrust/cinematic/TravelTrustWeb3CinematicElements.tsx",
] as const;
