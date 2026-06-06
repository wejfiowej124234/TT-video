import {
  TRAVELTRUST_HERO_GLOBE_LABEL_MIN_SEPARATION_PCT,
  TRAVELTRUST_HERO_GLOBE_LABEL_TIER_OPACITY,
} from "@/lib/traveltrustGlobeHeroTuning";
import type { HeroP3DecorNodeTier } from "@/lib/traveltrustHeroP3DecorNodes";

export type HeroGlobeLabelPlacement = {
  id: string;
  leftPct: number;
  topPct: number;
  tier: HeroP3DecorNodeTier;
};

export type HeroGlobeLabelLayout = {
  offsetPx: { dx: number; dy: number };
  baseOpacity: number;
};

const TIER_RANK: Record<HeroP3DecorNodeTier, number> = { S: 0, A: 1, B: 2 };

/**
 * 贪心分离：高优先 tier 先占位，过近则上移/微移 x，减轻 10 国标签叠字。
 */
export function layoutHeroGlobeLabels(
  placements: readonly HeroGlobeLabelPlacement[],
): Record<string, HeroGlobeLabelLayout> {
  const sorted = [...placements].sort((a, b) => {
    const tr = TIER_RANK[a.tier] - TIER_RANK[b.tier];
    if (tr !== 0) return tr;
    return a.topPct - b.topPct;
  });

  const out: Record<string, HeroGlobeLabelLayout> = {};
  const occupied: { left: number; top: number }[] = [];

  for (const node of sorted) {
    let dx = 0;
    let dy = 0;
    for (let pass = 0; pass < 4; pass++) {
      let hit = false;
      for (const o of occupied) {
        const dist = Math.hypot(node.leftPct + dx * 0.12 - o.left, node.topPct + dy * 0.12 - o.top);
        if (dist < TRAVELTRUST_HERO_GLOBE_LABEL_MIN_SEPARATION_PCT) {
          hit = true;
          dy -= 5;
          dx += node.id.charCodeAt(0) % 2 === 0 ? 4 : -4;
          break;
        }
      }
      if (!hit) break;
    }
    occupied.push({ left: node.leftPct + dx * 0.12, top: node.topPct + dy * 0.12 });
    out[node.id] = {
      offsetPx: { dx, dy },
      baseOpacity: TRAVELTRUST_HERO_GLOBE_LABEL_TIER_OPACITY[node.tier],
    };
  }

  return out;
}
