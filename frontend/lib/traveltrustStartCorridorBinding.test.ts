import { describe, expect, it } from "vitest";
import {
  resolveTraveltrustStartCorridorBinding,
  resolveTraveltrustStartCorridorId,
} from "./traveltrustStartCorridorBinding";

describe("traveltrustStartCorridorBinding", () => {
  it("maps region hubs to corridor ids", () => {
    expect(resolveTraveltrustStartCorridorId("us", "any")).toBe("atlantic");
    expect(resolveTraveltrustStartCorridorId("cn", "any")).toBe("asia");
    expect(resolveTraveltrustStartCorridorId("au", "any")).toBe("pacific");
    expect(resolveTraveltrustStartCorridorId("ae", "any")).toBe("mena");
  });

  it("falls back to route bias when region missing", () => {
    expect(resolveTraveltrustStartCorridorId(null, "atlantic")).toBe("atlantic");
    expect(resolveTraveltrustStartCorridorId(null, "asia")).toBe("asia");
    expect(resolveTraveltrustStartCorridorId(null, "any")).toBe("any");
  });

  it("returns three step paths per corridor", () => {
    const asia = resolveTraveltrustStartCorridorBinding("th", "any");
    expect(asia.corridorId).toBe("asia");
    expect(asia.stepPaths).toHaveLength(3);
    expect(asia.stepPaths[0]).toMatch(/^M /);
    expect(asia.stepSubtitleKeys[1]).toBe("traveltrust_start_corridor_asia_step_match");
    expect(asia.defaultStepId).toBe("plan");
  });
});
