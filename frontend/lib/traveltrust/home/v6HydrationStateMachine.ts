/** /traveltrust v6 render graph · 三段 hydration 闸（纯态机 · 无 DOM） */

export type TraveltrustV6HydrationPhase = "router" | "pulse" | "brief" | "scroll-lock" | "ready";

export type TraveltrustV6HydrationStore = {
  routerReady: boolean;
  pulseReady: boolean;
  briefReady: boolean;
  scrollLockReady: boolean;
};

export const TRAVELTRUST_V6_HYDRATION_INITIAL: TraveltrustV6HydrationStore = {
  routerReady: false,
  pulseReady: false,
  briefReady: false,
  scrollLockReady: false,
};

export function computeTraveltrustV6HydrationPhase(
  store: TraveltrustV6HydrationStore,
): TraveltrustV6HydrationPhase {
  if (!store.routerReady) return "router";
  if (!store.pulseReady) return "pulse";
  if (!store.briefReady) return "brief";
  if (!store.scrollLockReady) return "scroll-lock";
  return "ready";
}

export function isTraveltrustV6HydrationComplete(store: TraveltrustV6HydrationStore): boolean {
  return computeTraveltrustV6HydrationPhase(store) === "ready";
}

export function traveltrustPathnameRouterReady(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === "/traveltrust" || pathname.startsWith("/traveltrust/");
}
