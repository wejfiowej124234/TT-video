import { describe, expect, it } from "vitest";
import { resolveTraveltrustTheaterCorridorContext } from "./traveltrustTheaterCorridorBinding";

describe("traveltrustTheaterCorridorBinding", () => {
  it("maps asia + match to guide default tab", () => {
    const ctx = resolveTraveltrustTheaterCorridorContext("cn", "any", "match");
    expect(ctx.corridorId).toBe("asia");
    expect(ctx.defaultRoleId).toBe("guide");
    expect(ctx.narrativeSublineKey).toBe("traveltrust_theater_corridor_asia_step_match");
  });

  it("maps mena + escrow to region_steward", () => {
    const ctx = resolveTraveltrustTheaterCorridorContext("ae", "any", "escrow");
    expect(ctx.corridorId).toBe("mena");
    expect(ctx.defaultRoleId).toBe("region_steward");
  });
});
