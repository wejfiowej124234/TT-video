import type { TraveltrustStartCorridorId } from "@/lib/traveltrustStartCorridorBinding";
import {
  TRAVELTRUST_HERO_P3_DECOR_NODES,
  isHeroP3DecorNodeHighlighted,
  type HeroP3DecorNode,
} from "@/lib/traveltrustHeroP3DecorNodes";
import { TRAVELTRUST_HERO_L5_MAX_VISIBLE_LABELS } from "@/lib/traveltrustHeroL5FinalPolish";

const NODE_BY_ID = Object.fromEntries(TRAVELTRUST_HERO_P3_DECOR_NODES.map((n) => [n.id, n])) as Record<
  string,
  HeroP3DecorNode
>;

const TIER_RANK = { S: 0, A: 1, B: 2 } as const;

function scoreLabelCandidate(
  node: HeroP3DecorNode,
  focusedRegionId: string | null,
  activeCorridorId: TraveltrustStartCorridorId,
  focusId: string | null,
  edgeFade: number,
): number {
  const isFocus =
    Boolean(focusId && (node.id === focusId || node.phase1RegionId === focusId));
  const onActiveCorridor =
    activeCorridorId !== "any" && node.corridorId === activeCorridorId;
  const focusBoost = isFocus ? 1_000 : 0;
  const corridorBoost =
    isFocus || isHeroP3DecorNodeHighlighted(node, focusedRegionId, activeCorridorId)
      ? 80
      : onActiveCorridor && focusId
        ? 70
        : 0;
  const tierBoost = node.tier === "S" ? 30 : node.tier === "A" ? 20 : 10;
  return focusBoost + corridorBoost + tierBoost + edgeFade * 5;
}

/**
 * Hero L5 首屏：核心标签同时最多 3–4 个；聚焦走廊时优先焦点 + 同走廊高亮，减轻叠字。
 */
export function pickHeroL5VisibleLabelIds(
  candidateIds: readonly string[],
  ctx: {
    focusedRegionId: string | null;
    activeCorridorId: TraveltrustStartCorridorId;
    focusId: string | null;
    edgeFadeById?: Readonly<Record<string, number>>;
  },
): Set<string> {
  const max = TRAVELTRUST_HERO_L5_MAX_VISIBLE_LABELS;
  const unique = [...new Set(candidateIds)].filter((id) => NODE_BY_ID[id]);
  if (unique.length <= max) return new Set(unique);

  const ranked = unique
    .map((id) => {
      const node = NODE_BY_ID[id]!;
      const edgeFade = ctx.edgeFadeById?.[id] ?? 1;
      return {
        id,
        score: scoreLabelCandidate(
          node,
          ctx.focusedRegionId,
          ctx.activeCorridorId,
          ctx.focusId,
          edgeFade,
        ),
        tier: node.tier,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return TIER_RANK[a.tier] - TIER_RANK[b.tier];
    });

  return new Set(ranked.slice(0, max).map((r) => r.id));
}
