/**
 * P2-C · #roles 剧场与 region / corridor / step 叙事绑定（① · 文案/状态 only）
 */
import type { TravelTrustRoleId } from "@/app/traveltrust/traveltrustIdentityModel";
import type { HeroGlobeRouteBias } from "@/lib/traveltrustGlobeArcCull";
import {
  resolveTraveltrustStartCorridorBinding,
  resolveTraveltrustStartCorridorId,
  type TraveltrustStartCorridorId,
} from "@/lib/traveltrustStartCorridorBinding";
import type { TraveltrustStartL5StepId } from "@/lib/traveltrustStartStepIds";

export type TraveltrustTheaterCorridorContext = {
  corridorId: TraveltrustStartCorridorId;
  regionId: string | null;
  stepId: TraveltrustStartL5StepId;
  defaultRoleId: TravelTrustRoleId;
  corridorLabelKey:
    | "traveltrust_theater_route_label_transatlantic"
    | "traveltrust_theater_route_label_europe_asia"
    | "traveltrust_theater_route_label_pacific"
    | "traveltrust_theater_route_label_mena"
    | "traveltrust_theater_route_label_any";
  narrativeSublineKey: string;
};

const STEP_DEFAULT_ROLE: Record<TraveltrustStartL5StepId, TravelTrustRoleId> = {
  plan: "traveler",
  match: "guide",
  escrow: "merchant",
};

const CORRIDOR_LABEL_KEY: Record<
  TraveltrustStartCorridorId,
  TraveltrustTheaterCorridorContext["corridorLabelKey"]
> = {
  atlantic: "traveltrust_theater_route_label_transatlantic",
  asia: "traveltrust_theater_route_label_europe_asia",
  pacific: "traveltrust_theater_route_label_pacific",
  mena: "traveltrust_theater_route_label_mena",
  any: "traveltrust_theater_route_label_any",
};

const CORRIDOR_STEP_ROLE: Partial<
  Record<TraveltrustStartCorridorId, Partial<Record<TraveltrustStartL5StepId, TravelTrustRoleId>>>
> = {
  atlantic: { escrow: "acquisition", match: "guide" },
  asia: { match: "guide", escrow: "merchant", plan: "traveler" },
  pacific: { escrow: "acquisition", plan: "traveler" },
  mena: { escrow: "region_steward", plan: "traveler" },
  any: { plan: "traveler", match: "guide", escrow: "merchant" },
};

function narrativeSublineKey(
  corridorId: TraveltrustStartCorridorId,
  stepId: TraveltrustStartL5StepId,
): string {
  return `traveltrust_theater_corridor_${corridorId}_step_${stepId}`;
}

export function resolveTraveltrustTheaterDefaultRole(
  corridorId: TraveltrustStartCorridorId,
  stepId: TraveltrustStartL5StepId,
): TravelTrustRoleId {
  return CORRIDOR_STEP_ROLE[corridorId]?.[stepId] ?? STEP_DEFAULT_ROLE[stepId];
}

export function resolveTraveltrustTheaterCorridorContext(
  regionId: string | null,
  routeBias: HeroGlobeRouteBias = "any",
  stepId: TraveltrustStartL5StepId | null = "plan",
): TraveltrustTheaterCorridorContext {
  const corridorId = resolveTraveltrustStartCorridorId(regionId, routeBias);
  const step = stepId ?? "plan";
  const binding = resolveTraveltrustStartCorridorBinding(regionId, routeBias);
  return {
    corridorId,
    regionId: binding.regionId,
    stepId: step,
    defaultRoleId: resolveTraveltrustTheaterDefaultRole(corridorId, step),
    corridorLabelKey: CORRIDOR_LABEL_KEY[corridorId],
    narrativeSublineKey: narrativeSublineKey(corridorId, step),
  };
}
