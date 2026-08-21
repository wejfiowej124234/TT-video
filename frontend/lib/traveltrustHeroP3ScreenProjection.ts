/**
 * P3-A · lat/lon → Hero globe viewport 百分比（示意 equirectangular · ①）
 */
import type { HeroP3DecorNode } from "@/lib/traveltrustHeroP3DecorNodes";
import { resolveHeroP3HubLatLon } from "@/lib/traveltrustHeroP3DecorNodes";

export type HeroP3ScreenPoint = {
  leftPct: number;
  topPct: number;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** 与 WebGL 针脚近似对齐（允许 ±2% 目视误差） */
export function latLonToHeroP3ScreenPercent(lat: number, lon: number): HeroP3ScreenPoint {
  const leftPct = clamp(((lon + 180) / 360) * 100, 3, 97);
  const topPct = clamp(((90 - lat) / 180) * 100, 6, 94);
  return { leftPct, topPct };
}

/** @deprecated 消费方请用 `useHeroP3GlobeBoundProjection`（地球绑定） */
export function projectHeroP3DecorNodes(
  nodes: readonly HeroP3DecorNode[],
): Array<HeroP3DecorNode & HeroP3ScreenPoint> {
  return nodes.map((node) => {
    const hub = resolveHeroP3HubLatLon(node);
    return {
      ...node,
      ...latLonToHeroP3ScreenPercent(hub.lat, hub.lon),
    };
  });
}
