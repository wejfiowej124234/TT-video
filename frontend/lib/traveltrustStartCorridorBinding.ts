/**
 * P2-B · #start 走廊与 region/step 绑定（示意 · 非航班数据 · ①）
 */
import type { HeroGlobeRouteBias } from "@/lib/traveltrustGlobeArcCull";
import {
  TT_START_ROUTE_CORRIDOR_GHOST_L5,
  TT_START_ROUTE_PATHS_L5,
} from "@/lib/traveltrust/l5";
import {
  TRAVELTRUST_START_L5_STEP_IDS,
  type TraveltrustStartL5StepId,
} from "@/lib/traveltrustStartStepIds";

export type TraveltrustStartCorridorId = "atlantic" | "asia" | "pacific" | "mena" | "any";

export type TraveltrustStartCorridorBinding = {
  corridorId: TraveltrustStartCorridorId;
  regionId: string | null;
  corridorGhostPath: string;
  stepPaths: readonly [string, string, string];
  defaultStepId: TraveltrustStartL5StepId;
  /** i18n keys: `traveltrust_start_corridor_{corridorId}_step_{stepId}` */
  stepSubtitleKeys: readonly [string, string, string];
};

const REGION_TO_CORRIDOR: Record<string, TraveltrustStartCorridorId> = {
  us: "atlantic",
  fr: "atlantic",
  es: "atlantic",
  cn: "asia",
  jp: "asia",
  th: "asia",
  sg: "asia",
  kr: "asia",
  au: "pacific",
  ae: "mena",
};

const CORRIDOR_GHOST: Record<TraveltrustStartCorridorId, string> = {
  atlantic: "M 14 44 Q 34 24, 50 30 T 86 44",
  asia: "M 14 44 Q 38 28, 56 32 T 88 42",
  pacific: "M 14 44 Q 30 36, 48 34 T 82 40",
  mena: "M 14 44 Q 36 26, 54 28 T 84 46",
  any: TT_START_ROUTE_CORRIDOR_GHOST_L5,
};

const CORRIDOR_STEP_PATHS: Record<TraveltrustStartCorridorId, readonly [string, string, string]> = {
  atlantic: [
    "M 14 44 Q 28 40, 38 36",
    "M 14 44 Q 32 32, 50 30 T 72 38",
    "M 14 44 Q 34 24, 50 30 T 86 44",
  ],
  asia: [
    "M 14 44 Q 30 38, 44 34",
    "M 14 44 Q 36 30, 54 28 T 76 36",
    "M 14 44 Q 38 28, 56 32 T 88 42",
  ],
  pacific: [
    "M 14 44 Q 26 42, 40 38",
    "M 14 44 Q 34 34, 52 32 T 74 38",
    "M 14 44 Q 30 36, 48 34 T 82 40",
  ],
  mena: [
    "M 14 44 Q 28 38, 42 34",
    "M 14 44 Q 34 30, 52 28 T 74 40",
    "M 14 44 Q 36 26, 54 28 T 84 46",
  ],
  any: [
    TT_START_ROUTE_PATHS_L5[0],
    TT_START_ROUTE_PATHS_L5[1],
    TT_START_ROUTE_PATHS_L5[2],
  ],
};

function stepSubtitleKeys(corridorId: TraveltrustStartCorridorId): readonly [string, string, string] {
  return [
    `traveltrust_start_corridor_${corridorId}_step_plan`,
    `traveltrust_start_corridor_${corridorId}_step_match`,
    `traveltrust_start_corridor_${corridorId}_step_escrow`,
  ] as const;
}

export function resolveTraveltrustStartCorridorId(
  regionId: string | null,
  routeBias: HeroGlobeRouteBias = "any",
): TraveltrustStartCorridorId {
  if (regionId && REGION_TO_CORRIDOR[regionId]) return REGION_TO_CORRIDOR[regionId];
  if (routeBias === "atlantic") return "atlantic";
  if (routeBias === "asia") return "asia";
  return "any";
}

export function resolveTraveltrustStartCorridorBinding(
  regionId: string | null,
  routeBias: HeroGlobeRouteBias = "any",
): TraveltrustStartCorridorBinding {
  const corridorId = resolveTraveltrustStartCorridorId(regionId, routeBias);
  return {
    corridorId,
    regionId,
    corridorGhostPath: CORRIDOR_GHOST[corridorId],
    stepPaths: CORRIDOR_STEP_PATHS[corridorId],
    defaultStepId: "plan",
    stepSubtitleKeys: stepSubtitleKeys(corridorId),
  };
}

export { TRAVELTRUST_START_L5_STEP_IDS };
