"use client";

import { useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useTraveltrustGlobeHeroHud } from "@/lib/traveltrustGlobeHeroHud";
import { useHeroGlobeP1Link } from "@/lib/traveltrustHeroGlobeP1Link";
import {
  TRAVELTRUST_HERO_P3_CORE_LABEL_COUNT,
  TRAVELTRUST_HERO_P3_DECOR_NODES,
  isHeroP3CoreLabelNode,
  isHeroP3DecorNodeHighlighted,
  resolveHeroP3DecorNodeFocusId,
} from "@/lib/traveltrustHeroP3DecorNodes";
import { resolveTraveltrustStartCorridorId } from "@/lib/traveltrustStartCorridorBinding";
import { projectHeroP3DecorNodes } from "@/lib/traveltrustHeroP3ScreenProjection";

export function TravelTrustHeroDestinationLabels() {
  const { t } = useTranslation();
  const { focusedRegionId } = useHeroGlobeP1Link();
  const { routeBias } = useTraveltrustGlobeHeroHud();
  const activeCorridorId = resolveTraveltrustStartCorridorId(focusedRegionId, routeBias);
  const focusId = resolveHeroP3DecorNodeFocusId(focusedRegionId);
  const projected = useMemo(() => projectHeroP3DecorNodes(TRAVELTRUST_HERO_P3_DECOR_NODES), []);

  const visibleLabels = projected.filter((node) => {
    if (!isHeroP3CoreLabelNode(node.id)) return false;
    if (focusId) return isHeroP3DecorNodeHighlighted(node, focusedRegionId, activeCorridorId);
    return true;
  });

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[2] overflow-visible"
      aria-hidden
      data-tt-traveltrust-hero-p3-labels="1"
      data-tt-traveltrust-hero-p3-label-count={String(TRAVELTRUST_HERO_P3_CORE_LABEL_COUNT)}
      data-tt-traveltrust-hero-p3-label-visible={focusId ? "1" : "0"}
    >
      {visibleLabels.map((node) => {
        const active = isHeroP3DecorNodeHighlighted(node, focusedRegionId, activeCorridorId);
        const opacity = active ? 0.92 : focusId ? 0 : 0.36;
        return (
          <div
            key={`label-${node.id}`}
            className="absolute max-w-[4.5rem] -translate-x-1/2 -translate-y-full pb-0.5 text-center"
            style={{ left: `${node.leftPct}%`, top: `${node.topPct}%`, opacity }}
            data-tt-traveltrust-hero-p3-label="1"
            data-tt-traveltrust-hero-p3-label-id={node.id}
          >
            <span className="block truncate text-[9px] font-semibold leading-tight text-ref-sun/90 drop-shadow-[0_1px_2px_rgba(12,10,9,0.9)]">
              {t(node.labelKey as "traveltrust_phase1_region_cn")}
            </span>
          </div>
        );
      })}
    </div>
  );
}
