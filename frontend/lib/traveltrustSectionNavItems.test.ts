import { describe, expect, it } from "vitest";
import {
  TRAVELTRUST_HERO_COMPACT_SECTIONS,
  TRAVELTRUST_SECTION_NAV_ITEMS,
  traveltrustSectionLabelKey,
} from "./traveltrustSectionNavItems";

describe("traveltrustSectionNavItems", () => {
  it("exposes hero compact high-intent anchors including liquidity", () => {
    expect(TRAVELTRUST_HERO_COMPACT_SECTIONS.has("roles")).toBe(true);
    expect(TRAVELTRUST_HERO_COMPACT_SECTIONS.has("liquidity")).toBe(true);
    expect(TRAVELTRUST_HERO_COMPACT_SECTIONS.has("trust")).toBe(true);
    expect(TRAVELTRUST_HERO_COMPACT_SECTIONS.has("start")).toBe(true);
    expect(TRAVELTRUST_HERO_COMPACT_SECTIONS.has("stats")).toBe(false);
  });

  it("maps section ids to label keys", () => {
    expect(traveltrustSectionLabelKey("trust")).toBe("traveltrust_nav_trust");
    expect(traveltrustSectionLabelKey("hero")).toBe("traveltrust_nav_pulse");
  });

  it("keeps nine in-page nav entries", () => {
    expect(TRAVELTRUST_SECTION_NAV_ITEMS).toHaveLength(9);
  });
});
