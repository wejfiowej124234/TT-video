import { describe, expect, it } from "vitest";
import en from "@/locales/en";
import {
  TRAVELTRUST_V6_EN_BANNED_FRAGMENTS,
  TRAVELTRUST_V6_EN_CJK_RE,
  TRAVELTRUST_V6_SURFACE_KEYS,
  TRAVELTRUST_V6_ZH_SPEC_BANNED_FRAGMENTS,
} from "@/lib/traveltrustV6SurfaceCompliance";

describe("traveltrust v6 en surface copy (TT-PH1-156)", () => {
  it("hero title is a single localized string", () => {
    expect(en.traveltrust_hero_title).toBe("TravelTrust Web3 Network");
    expect(en.traveltrust_title_suffix).toBe("Network");
  });

  it("avoids Chinese fragments on en surface keys", () => {
    for (const key of TRAVELTRUST_V6_SURFACE_KEYS) {
      const value = en[key];
      for (const banned of TRAVELTRUST_V6_EN_BANNED_FRAGMENTS) {
        expect(value, `${key} contains "${banned}"`).not.toContain(banned);
      }
      if (key !== "traveltrust_hero_title") {
        expect(value, `${key} contains CJK`).not.toMatch(TRAVELTRUST_V6_EN_CJK_RE);
      }
    }
  });

  it("avoids internal spec numbers on en user-visible surface", () => {
    for (const key of TRAVELTRUST_V6_SURFACE_KEYS) {
      const value = en[key];
      for (const banned of TRAVELTRUST_V6_ZH_SPEC_BANNED_FRAGMENTS) {
        expect(value, `${key} contains "${banned}"`).not.toContain(banned);
      }
    }
  });

});
