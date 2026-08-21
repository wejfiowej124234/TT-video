import { describe, expect, it } from "vitest";

import {
  TRAVELTRUST_V6_HYDRATION_INITIAL,
  computeTraveltrustV6HydrationPhase,
  isTraveltrustV6HydrationComplete,
  traveltrustPathnameRouterReady,
} from "./v6HydrationStateMachine";

describe("traveltrust v6 hydration state machine", () => {
  it("progresses router → pulse → brief → scroll-lock → ready", () => {
    let store = { ...TRAVELTRUST_V6_HYDRATION_INITIAL };
    expect(computeTraveltrustV6HydrationPhase(store)).toBe("router");

    store = { ...store, routerReady: true };
    expect(computeTraveltrustV6HydrationPhase(store)).toBe("pulse");

    store = { ...store, pulseReady: true };
    expect(computeTraveltrustV6HydrationPhase(store)).toBe("brief");

    store = { ...store, briefReady: true };
    expect(computeTraveltrustV6HydrationPhase(store)).toBe("scroll-lock");

    store = { ...store, scrollLockReady: true };
    expect(computeTraveltrustV6HydrationPhase(store)).toBe("ready");
    expect(isTraveltrustV6HydrationComplete(store)).toBe(true);
  });

  it("accepts /traveltrust pathname variants for router ready", () => {
    expect(traveltrustPathnameRouterReady("/traveltrust")).toBe(true);
    expect(traveltrustPathnameRouterReady("/traveltrust/announcements")).toBe(true);
    expect(traveltrustPathnameRouterReady("/market")).toBe(false);
  });
});
