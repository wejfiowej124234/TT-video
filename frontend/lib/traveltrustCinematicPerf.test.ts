import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  initTraveltrustCinematicQualityPrefs,
  isTraveltrustCinematicLowQuality,
  setTraveltrustCinematicQualityPref,
  shouldAutoTraveltrustCinematicLowQuality,
} from "./traveltrustCinematicPerf";

describe("traveltrustCinematicPerf", () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal("sessionStorage", {
      getItem(k: string) {
        return store[k] ?? null;
      },
      setItem(k: string, v: string) {
        store[k] = v;
      },
      removeItem(k: string) {
        delete store[k];
      },
    });
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("768px"),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("auto-enables low quality on narrow viewport", () => {
    initTraveltrustCinematicQualityPrefs();
    expect(isTraveltrustCinematicLowQuality()).toBe(true);
  });

  it("respects explicit off preference", () => {
    setTraveltrustCinematicQualityPref("off");
    expect(isTraveltrustCinematicLowQuality()).toBe(false);
  });

  it("detects auto low-quality heuristics", () => {
    expect(shouldAutoTraveltrustCinematicLowQuality()).toBe(true);
  });
});
