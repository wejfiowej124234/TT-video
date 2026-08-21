"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { useTraveltrustGlobeHeroHud } from "@/lib/traveltrustGlobeHeroHud";
import { useHeroGlobeP1Link } from "@/lib/traveltrustHeroGlobeP1Link";
import { useHeroP3GlobeBoundProjection } from "@/lib/traveltrustHeroP3GlobeBoundProjection";
import {
  TRAVELTRUST_HERO_P3_CORE_LABEL_COUNT,
  TRAVELTRUST_HERO_P3_DECOR_NODES,
  isHeroP3CoreLabelNode,
  isHeroP3DecorNodeHighlighted,
  resolveHeroP3DecorNodeFocusId,
} from "@/lib/traveltrustHeroP3DecorNodes";
import { resolveTraveltrustStartCorridorId } from "@/lib/traveltrustStartCorridorBinding";
import { layoutHeroGlobeLabels } from "@/lib/traveltrustHeroGlobeLabelLayout";
import {
  TRAVELTRUST_HERO_L5_LABEL_DIM_ON_FOCUS_MUL,
  TRAVELTRUST_HERO_L5_MAX_VISIBLE_LABELS,
  TRAVELTRUST_HERO_L5_VISUAL_CLOSURE_ID,
  resolveHeroL5DestinationLabelKey,
} from "@/lib/traveltrustHeroL5FinalPolish";
import { pickHeroL5VisibleLabelIds } from "@/lib/traveltrustHeroL5LabelPick";
import { useMemo } from "react";

export function TravelTrustHeroDestinationLabels() {
  const { t } = useTranslation();
  const { focusedRegionId } = useHeroGlobeP1Link();
  const { routeBias } = useTraveltrustGlobeHeroHud();
  const activeCorridorId = resolveTraveltrustStartCorridorId(focusedRegionId, routeBias);
  const focusId = resolveHeroP3DecorNodeFocusId(focusedRegionId);
  const { nodes: projected, projectionActive, revision } = useHeroP3GlobeBoundProjection(
    TRAVELTRUST_HERO_P3_DECOR_NODES,
  );

  const { visibleLabels, labelLayout } = useMemo(() => {
    const candidates = projected.filter((node) => {
      if (!isHeroP3CoreLabelNode(node.id)) return false;
      /** 平面 equirect % 不随地球自转/yaw — 会落在太平洋等错误位置；仅显示 globe-bound */
      if (!projectionActive || node.projectionMode !== "globe-bound") return false;
      if (node.globeBound && !node.globeBound.visible) return false;
      return true;
    });
    const edgeFadeById = Object.fromEntries(
      candidates.map((node) => [node.id, node.globeBound?.edgeFade ?? 1]),
    );
    const pickedIds = pickHeroL5VisibleLabelIds(
      candidates.map((n) => n.id),
      { focusedRegionId, activeCorridorId, focusId, edgeFadeById },
    );
    const visible = candidates.filter((node) => pickedIds.has(node.id));
    const layout = layoutHeroGlobeLabels(
      visible.map((node) => ({
        id: node.id,
        leftPct: node.leftPct,
        topPct: node.topPct,
        tier: node.tier,
      })),
    );
    return { visibleLabels: visible, labelLayout: layout };
  }, [projected, projectionActive, revision, focusId, focusedRegionId, activeCorridorId]);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[2] overflow-visible"
      aria-hidden
      data-tt-traveltrust-hero-p3-labels="1"
      data-tt-traveltrust-hero-p3-label-count={String(TRAVELTRUST_HERO_P3_CORE_LABEL_COUNT)}
      data-tt-traveltrust-hero-p3-label-visible={focusId ? "1" : "0"}
      data-tt-traveltrust-hero-p3-projection-active={projectionActive ? "1" : "0"}
      data-tt-traveltrust-hero-l5-destination-labels="1"
      data-tt-traveltrust-hero-l5-visual-closure={TRAVELTRUST_HERO_L5_VISUAL_CLOSURE_ID}
      data-tt-traveltrust-hero-l5-label-max={String(TRAVELTRUST_HERO_L5_MAX_VISIBLE_LABELS)}
      data-tt-traveltrust-hero-l5-label-rendered={String(visibleLabels.length)}
    >
      {visibleLabels.map((node) => {
        const active = isHeroP3DecorNodeHighlighted(node, focusedRegionId, activeCorridorId);
        const limbFade = node.globeBound?.edgeFade ?? 1;
        const layout = labelLayout[node.id];
        const baseOpacity = layout?.baseOpacity ?? 0.72;
        const offset = layout?.offsetPx ?? { dx: 0, dy: 0 };
        const opacity =
          (active ? 0.96 : focusId ? baseOpacity * TRAVELTRUST_HERO_L5_LABEL_DIM_ON_FOCUS_MUL : baseOpacity) *
          limbFade;
        const tierScale = node.tier === "S" ? 1 : node.tier === "A" ? 0.96 : 0.92;
        const labelKey = resolveHeroL5DestinationLabelKey(node.id, node.phase1RegionId, node.labelKey);
        return (
          <div
            key={`label-${node.id}`}
            className="absolute max-w-[7rem] pb-0.5 text-center"
            style={{
              left: `${node.leftPct}%`,
              top: `${node.topPct}%`,
              opacity,
              transform: `translate(calc(-50% + ${offset.dx}px), calc(-100% + ${offset.dy}px))`,
            }}
            data-tt-traveltrust-hero-p3-label="1"
            data-tt-traveltrust-hero-p3-label-id={node.id}
            data-tt-traveltrust-hero-p3-label-tier={node.tier}
          >
            <span
              className="inline-block max-w-full truncate rounded-full border border-ref-sun/18 bg-ink-950/78 px-1.5 py-0.5 font-semibold leading-tight text-ref-sun shadow-[0_2px_8px_rgba(8,6,5,0.85)] backdrop-blur-[3px]"
              style={{ fontSize: `${(node.tier === "S" ? 10.5 : 9.5) * tierScale}px` }}
            >
              {t(labelKey as "traveltrust_hero_l5_dest_cn")}
            </span>
          </div>
        );
      })}
    </div>
  );
}
