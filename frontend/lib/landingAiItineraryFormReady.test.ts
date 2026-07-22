import { describe, expect, it } from "vitest";

import {
  isLandingAiItineraryFormReady,
  parseLandingAiBudget,
} from "@/lib/landingAiItineraryFormReady";

describe("landingAiItineraryFormReady", () => {
  const ready = {
    country: "日本",
    cities: ["东京"],
    startDate: "2026-08-01",
    endDate: "2026-08-05",
    partySize: 2,
    budget: "8000",
  };

  it("parseLandingAiBudget rejects empty and non-positive", () => {
    expect(parseLandingAiBudget("")).toBeNull();
    expect(parseLandingAiBudget("  ")).toBeNull();
    expect(parseLandingAiBudget("0")).toBeNull();
    expect(parseLandingAiBudget("-1")).toBeNull();
    expect(parseLandingAiBudget("abc")).toBeNull();
    expect(parseLandingAiBudget("1200.5")).toBe(1200.5);
  });

  it("isLandingAiItineraryFormReady requires country cities dates party budget", () => {
    expect(isLandingAiItineraryFormReady(ready)).toBe(true);
    expect(isLandingAiItineraryFormReady({ ...ready, country: "" })).toBe(false);
    expect(isLandingAiItineraryFormReady({ ...ready, cities: [] })).toBe(false);
    expect(isLandingAiItineraryFormReady({ ...ready, startDate: "" })).toBe(false);
    expect(isLandingAiItineraryFormReady({ ...ready, endDate: "" })).toBe(false);
    expect(
      isLandingAiItineraryFormReady({
        ...ready,
        startDate: "2026-08-10",
        endDate: "2026-08-01",
      }),
    ).toBe(false);
    expect(isLandingAiItineraryFormReady({ ...ready, partySize: 0 })).toBe(false);
    expect(isLandingAiItineraryFormReady({ ...ready, budget: "" })).toBe(false);
  });
});
