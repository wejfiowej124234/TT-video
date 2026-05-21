import { describe, expect, it } from "vitest";
import { resolveTraveltrustCanvasPower } from "./traveltrustCinematicPower";

describe("resolveTraveltrustCanvasPower", () => {
  const base = {
    tabVisible: true,
    heroInView: true,
    rolesInView: false,
    scrollOpacity: 1,
    heroT: 0.2,
    pageT: 0.1,
  };

  it("runs when hero is in view on early page scroll", () => {
    expect(resolveTraveltrustCanvasPower(base).active).toBe(true);
  });

  it("idles when tab is hidden", () => {
    expect(resolveTraveltrustCanvasPower({ ...base, tabVisible: false }).reason).toBe("tab-hidden");
  });

  it("idles deep in page without roles section", () => {
    expect(
      resolveTraveltrustCanvasPower({ ...base, heroInView: false, pageT: 0.95 }).reason,
    ).toBe("offscreen");
  });

  it("can run in roles section while hero scrolled away", () => {
    expect(
      resolveTraveltrustCanvasPower({
        ...base,
        heroInView: false,
        rolesInView: true,
        heroT: 0.95,
        pageT: 0.5,
      }).active,
    ).toBe(true);
  });

  it("can run softly in trust band when trust section is in view", () => {
    expect(
      resolveTraveltrustCanvasPower({
        ...base,
        heroInView: false,
        rolesInView: false,
        trustInView: true,
        heroT: 1,
        pageT: 0.52,
      }).active,
    ).toBe(true);
  });

  it("still idles at page end without trust in view", () => {
    const result = resolveTraveltrustCanvasPower({
      ...base,
      heroInView: false,
      rolesInView: false,
      trustInView: false,
      heroT: 1,
      pageT: 0.95,
    });
    expect(result.active).toBe(false);
    expect(["offscreen", "past-narrative"]).toContain(result.reason);
  });
});
