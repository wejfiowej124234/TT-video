"use client";

/** @frozen TT-GLOBE-L5-FROZEN-2026-05 — see `traveltrustHeroGlobeFrozenManifest.ts` */

import { useSyncExternalStore } from "react";
import type { HeroGlobeRouteBias } from "@/lib/traveltrustGlobeArcCull";

type GlobeHeroHudState = {
  visibleHubIds: string[];
  routeBias: HeroGlobeRouteBias;
};

const GLOBE_HERO_HUD_SERVER_SNAPSHOT: GlobeHeroHudState = {
  visibleHubIds: [],
  routeBias: "any",
};

let state: GlobeHeroHudState = GLOBE_HERO_HUD_SERVER_SNAPSHOT;

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

function subscribeGlobeHeroHud(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getGlobeHeroHudSnapshot(): GlobeHeroHudState {
  return state;
}

function getGlobeHeroHudServerSnapshot(): GlobeHeroHudState {
  return GLOBE_HERO_HUD_SERVER_SNAPSHOT;
}

/** SSR 与首帧客户端均用 `routeBias: "any"`，hydration 后再跟 WebGL 走廊同步。 */
export function useTraveltrustGlobeHeroHud(): GlobeHeroHudState {
  return useSyncExternalStore(subscribeGlobeHeroHud, getGlobeHeroHudSnapshot, getGlobeHeroHudServerSnapshot);
}
