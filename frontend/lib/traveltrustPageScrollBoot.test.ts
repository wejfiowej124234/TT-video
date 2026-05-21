import { describe, expect, it, vi } from "vitest";
import {
  shouldPinTraveltrustHeroOnLoad,
  shouldPinTraveltrustHeroNow,
  userHasScrolledPastTraveltrustHero,
} from "./traveltrustPageScrollBoot";

describe("traveltrustPageScrollBoot", () => {
  it("pins hero when hash empty or #hero", () => {
    const prev = window.location.hash;
    window.location.hash = "";
    expect(shouldPinTraveltrustHeroOnLoad()).toBe(true);
    window.location.hash = "#hero";
    expect(shouldPinTraveltrustHeroOnLoad()).toBe(true);
    window.location.hash = "#start";
    expect(shouldPinTraveltrustHeroOnLoad()).toBe(false);
    window.location.hash = "#guide";
    expect(shouldPinTraveltrustHeroOnLoad()).toBe(false);
    window.location.hash = "#merchant";
    expect(shouldPinTraveltrustHeroOnLoad()).toBe(false);
    window.location.hash = prev;
  });

  it("shouldPinTraveltrustHeroNow is false after user scrolls down", () => {
    vi.spyOn(window, "scrollY", "get").mockReturnValue(120);
    expect(userHasScrolledPastTraveltrustHero()).toBe(true);
    expect(shouldPinTraveltrustHeroNow()).toBe(false);
    vi.restoreAllMocks();
  });
});
