import { describe, expect, it } from "vitest";
import { TT_HERO_THEATER_SCROLL_HANDOFF_L5 } from "./traveltrustHeroTheaterScrollHandoff";

describe("traveltrustHeroTheaterScrollHandoff", () => {
  it("exports conservative hero↔theater wheel bands", () => {
    expect(TT_HERO_THEATER_SCROLL_HANDOFF_L5.cooldownMs).toBeGreaterThanOrEqual(600);
    expect(TT_HERO_THEATER_SCROLL_HANDOFF_L5.heroExitBandMinVh).toBeLessThan(0.35);
    expect(TT_HERO_THEATER_SCROLL_HANDOFF_L5.heroExitBandMaxVh).toBeGreaterThan(0.9);
  });
});
