/**
 * P3-B · Hero 右侧走廊实况 + 托管时间轴文案键（① · 只读 P1/P2 状态）
 */
import type { HeroGlobeRouteBias } from "@/lib/traveltrustGlobeArcCull";
import {
  resolveTraveltrustStartCorridorBinding,
  resolveTraveltrustStartCorridorId,
  type TraveltrustStartCorridorId,
} from "@/lib/traveltrustStartCorridorBinding";
import type { TraveltrustStartL5StepId } from "@/lib/traveltrustStartStepIds";
import { TRAVELTRUST_HERO_P3_DECOR_NODES } from "@/lib/traveltrustHeroP3DecorNodes";

export type HeroP3NarrativeContext = {
  corridorId: TraveltrustStartCorridorId;
  corridorLabelKey:
    | "traveltrust_theater_route_label_transatlantic"
    | "traveltrust_theater_route_label_europe_asia"
    | "traveltrust_theater_route_label_pacific"
    | "traveltrust_theater_route_label_mena"
    | "traveltrust_theater_route_label_any";
  regionId: string | null;
  regionLabelKey: string;
  stepId: TraveltrustStartL5StepId;
  destinationHintKey: string;
};

const CORRIDOR_LABEL_KEY: Record<
  TraveltrustStartCorridorId,
  HeroP3NarrativeContext["corridorLabelKey"]
> = {
  atlantic: "traveltrust_theater_route_label_transatlantic",
  asia: "traveltrust_theater_route_label_europe_asia",
  pacific: "traveltrust_theater_route_label_pacific",
  mena: "traveltrust_theater_route_label_mena",
  any: "traveltrust_theater_route_label_any",
};

const CORRIDOR_DEST_HINT: Record<TraveltrustStartCorridorId, string> = {
  atlantic: "traveltrust_hero_p3_dest_atlantic",
  asia: "traveltrust_hero_p3_dest_asia",
  pacific: "traveltrust_hero_p3_dest_pacific",
  mena: "traveltrust_hero_p3_dest_mena",
  any: "traveltrust_hero_p3_dest_any",
};

export function resolveHeroP3RegionLabelKey(regionId: string | null): string {
  if (!regionId) return "traveltrust_hero_p3_region_any";
  const node = TRAVELTRUST_HERO_P3_DECOR_NODES.find((n) => n.phase1RegionId === regionId || n.id === regionId);
  return node?.labelKey ?? `traveltrust_phase1_region_${regionId}`;
}

export function resolveHeroP3NarrativeContext(
  regionId: string | null,
  routeBias: HeroGlobeRouteBias = "any",
  stepId: TraveltrustStartL5StepId | null = "plan",
): HeroP3NarrativeContext {
  const step = stepId ?? "plan";
  const binding = resolveTraveltrustStartCorridorBinding(regionId, routeBias);
  const corridorId = resolveTraveltrustStartCorridorId(regionId, routeBias);
  return {
    corridorId,
    corridorLabelKey: CORRIDOR_LABEL_KEY[corridorId],
    regionId: binding.regionId,
    regionLabelKey: resolveHeroP3RegionLabelKey(regionId),
    stepId: step,
    destinationHintKey: CORRIDOR_DEST_HINT[corridorId],
  };
}

export function buildHeroP3StartStepHref(
  regionId: string | null,
  step: TraveltrustStartL5StepId,
): string {
  const qs = new URLSearchParams();
  if (regionId && /^[a-z]{2}$/.test(regionId)) qs.set("region", regionId);
  qs.set("step", step);
  const tail = qs.toString();
  return `#start?${tail}`;
}
