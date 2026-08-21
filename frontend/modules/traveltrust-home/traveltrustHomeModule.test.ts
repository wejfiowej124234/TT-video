import { describe, expect, it } from "vitest";
import {
  computeTraveltrustHomeEntryProgress,
  isTraveltrustHomeEntryComplete,
  TRAVELTRUST_HOME_ENTRY_MILESTONE_WEIGHTS,
} from "./core/milestones";

describe("traveltrust-home module", () => {
  it("milestone weights sum to 100", () => {
    const sum = Object.values(TRAVELTRUST_HOME_ENTRY_MILESTONE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });

  it("computeTraveltrustHomeEntryProgress reaches 100 when all done", () => {
    const done = new Set(Object.keys(TRAVELTRUST_HOME_ENTRY_MILESTONE_WEIGHTS)) as Set<
      keyof typeof TRAVELTRUST_HOME_ENTRY_MILESTONE_WEIGHTS
    >;
    expect(computeTraveltrustHomeEntryProgress(done)).toBe(100);
    expect(isTraveltrustHomeEntryComplete(done)).toBe(true);
  });

  it("partial progress matches weights", () => {
    const done = new Set(["shell", "brief"] as const);
    expect(computeTraveltrustHomeEntryProgress(done)).toBe(35);
  });
});
