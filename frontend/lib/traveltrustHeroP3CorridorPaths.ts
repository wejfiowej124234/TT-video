/**
 * P3-A · Hero 装饰走廊弧线（SVG · 示意 · ①）
 */
import type { TraveltrustStartCorridorId } from "@/lib/traveltrustStartCorridorBinding";

export type HeroP3CorridorRoute = {
  id: string;
  corridorId: TraveltrustStartCorridorId;
  /** viewBox 0 0 100 56 */
  pathD: string;
};

/** 8 条示意走廊 · DOM 流光（非 Phase1 WebGL arcs） */
export const TRAVELTRUST_HERO_P3_CORRIDOR_ROUTES: readonly HeroP3CorridorRoute[] = [
  { id: "asia-cn-jp", corridorId: "asia", pathD: "M 72 28 Q 78 22 84 24" },
  { id: "asia-sea", corridorId: "asia", pathD: "M 68 32 Q 74 30 80 28 L 86 26" },
  { id: "asia-india-hub", corridorId: "asia", pathD: "M 62 30 Q 68 26 74 28" },
  { id: "atlantic-us-eu", corridorId: "atlantic", pathD: "M 22 26 Q 38 22 52 24" },
  { id: "atlantic-trans", corridorId: "atlantic", pathD: "M 18 30 Q 32 24 48 26 T 58 28" },
  { id: "atlantic-latam", corridorId: "atlantic", pathD: "M 16 34 Q 28 32 40 30" },
  { id: "pacific-ring", corridorId: "pacific", pathD: "M 78 34 Q 84 38 90 36" },
  { id: "mena-bridge", corridorId: "mena", pathD: "M 54 28 Q 58 24 64 26 L 70 30" },
] as const;

export const TRAVELTRUST_HERO_P3_CORRIDOR_ROUTE_COUNT = TRAVELTRUST_HERO_P3_CORRIDOR_ROUTES.length;

export function isHeroP3CorridorRouteHighlighted(
  route: HeroP3CorridorRoute,
  activeCorridorId: TraveltrustStartCorridorId,
  hasFocus: boolean,
): boolean {
  if (hasFocus) return route.corridorId === activeCorridorId;
  return activeCorridorId === "any" || route.corridorId === activeCorridorId;
}
