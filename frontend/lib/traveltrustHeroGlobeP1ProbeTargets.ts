/**
 * P1 E2E 探针 · Phase1 针脚在 Hero canvas 上的归一化坐标（①）
 * 仅 `NEXT_PUBLIC_TRAVELTRUST_E2E_PROBE=1` 经 `__ttHeroGlobeP1Probe` 暴露；不触碰 WebGL/视觉。
 */
import { resolveTraveltrustHubLatLon } from "@/lib/traveltrustGlobePinDisplay";
import { latLonToHeroP3ScreenPercent } from "@/lib/traveltrustHeroP3ScreenProjection";
import { TRAVELTRUST_PHASE1_GLOBE_REGIONS } from "@/lib/traveltrustPhase1GlobeRegions";

export type HeroGlobeP1PinProbeFraction = {
  regionId: string;
  fx: number;
  fy: number;
};

/** S 枢纽优先，便于探针尽快命中 */
const TIER_ORDER: Record<string, number> = { S: 0, A: 1, B: 2 };

export function listHeroGlobeP1PinProbeFractions(): HeroGlobeP1PinProbeFraction[] {
  return [...TRAVELTRUST_PHASE1_GLOBE_REGIONS]
    .sort((a, b) => (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9))
    .map((region) => {
      const hub = resolveTraveltrustHubLatLon(region);
      const pct = latLonToHeroP3ScreenPercent(hub.lat, hub.lon);
      return {
        regionId: region.id,
        fx: pct.leftPct / 100,
        fy: pct.topPct / 100,
      };
    });
}

const PROBE_RESET_CANDIDATES: { fx: number; fy: number }[] = [
  { fx: 0.78, fy: 0.28 },
  { fx: 0.62, fy: 0.78 },
  { fx: 0.38, fy: 0.22 },
  { fx: 0.52, fy: 0.48 },
];

/** 与全部针脚 fraction 保持最大间隔，避免 reset 时误命中 cn 等枢纽 */
export function resolveHeroGlobeP1ProbeResetFraction(): { fx: number; fy: number } {
  const pins = listHeroGlobeP1PinProbeFractions();
  let best = PROBE_RESET_CANDIDATES[0]!;
  let bestMinDist = -1;
  for (const c of PROBE_RESET_CANDIDATES) {
    let minDist = Infinity;
    for (const p of pins) {
      const dx = c.fx - p.fx;
      const dy = c.fy - p.fy;
      minDist = Math.min(minDist, Math.hypot(dx, dy));
    }
    if (minDist > bestMinDist) {
      bestMinDist = minDist;
      best = c;
    }
  }
  return best;
}
