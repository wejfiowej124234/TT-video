"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { HeroP3DecorNode } from "@/lib/traveltrustHeroP3DecorNodes";
import { resolveHeroP3HubLatLon } from "@/lib/traveltrustHeroP3DecorNodes";
import {
  getHeroGlobeProjectionSnapshot,
  subscribeHeroGlobeProjection,
  type HeroGlobeBoundScreenPoint,
} from "@/lib/traveltrustHeroGlobeProjectionStore";
import { latLonToHeroP3ScreenPercent } from "@/lib/traveltrustHeroP3ScreenProjection";

export type HeroP3ProjectedDecorNode = HeroP3DecorNode & {
  leftPct: number;
  topPct: number;
  projectionMode: "globe-bound" | "equirect-fallback";
  globeBound: HeroGlobeBoundScreenPoint | null;
};

function mergeNode(
  node: HeroP3DecorNode,
  globePoint: HeroGlobeBoundScreenPoint | undefined,
  active: boolean,
): HeroP3ProjectedDecorNode {
  if (active && globePoint) {
    return {
      ...node,
      leftPct: globePoint.leftPct,
      topPct: globePoint.topPct,
      projectionMode: "globe-bound",
      globeBound: globePoint,
    };
  }
  const hub = resolveHeroP3HubLatLon(node);
  const flat = latLonToHeroP3ScreenPercent(hub.lat, hub.lon);
  return {
    ...node,
    leftPct: flat.leftPct,
    topPct: flat.topPct,
    projectionMode: "equirect-fallback",
    globeBound: null,
  };
}

export function useHeroP3GlobeBoundProjection(
  nodes: readonly HeroP3DecorNode[],
): {
  projectionActive: boolean;
  revision: number;
  nodes: HeroP3ProjectedDecorNode[];
} {
  const snapshot = useSyncExternalStore(
    subscribeHeroGlobeProjection,
    getHeroGlobeProjectionSnapshot,
    getHeroGlobeProjectionSnapshot,
  );

  const projected = useMemo(
    () =>
      nodes.map((node) => mergeNode(node, snapshot.points[node.id], snapshot.active)),
    [nodes, snapshot.active, snapshot.points, snapshot.revision],
  );

  return {
    projectionActive: snapshot.active,
    revision: snapshot.revision,
    nodes: projected,
  };
}
