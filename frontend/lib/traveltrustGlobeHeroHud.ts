"use client";

/** @frozen TT-GLOBE-L5-FROZEN-2026-05 — see `traveltrustHeroGlobeFrozenManifest.ts` */

import { useEffect, useState } from "react";
import type { HeroGlobeRouteBias } from "@/lib/traveltrustGlobeArcCull";

type GlobeHeroHudState = {
  visibleHubIds: string[];
  routeBias: HeroGlobeRouteBias;
};

let state: GlobeHeroHudState = {
  visibleHubIds: [],
  routeBias: "any",
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** Synced from WebGL decor each frame (① · L5 hero HUD). */
export function setTraveltrustGlobeHeroHud(patch: Partial<GlobeHeroHudState>): void {
  const next = { ...state, ...patch };
  const sameBias = next.routeBias === state.routeBias;
  const sameIds =
    next.visibleHubIds.length === state.visibleHubIds.length &&
    next.visibleHubIds.every((id, i) => id === state.visibleHubIds[i]);
  if (sameBias && sameIds) return;
  state = next;
  emit();
}

export function getTraveltrustGlobeHeroHud(): GlobeHeroHudState {
  return state;
}

export function useTraveltrustGlobeHeroHud(): GlobeHeroHudState {
  const [, tick] = useState(0);
  useEffect(() => {
    const sub = () => tick((n) => n + 1);
    listeners.add(sub);
    return () => {
      listeners.delete(sub);
    };
  }, []);
  return state;
}
