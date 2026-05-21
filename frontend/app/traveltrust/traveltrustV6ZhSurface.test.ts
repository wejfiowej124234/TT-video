import { describe, expect, it } from "vitest";
import zh from "@/locales/zh";
import {
  TRAVELTRUST_V6_ZH_BANNED_FRAGMENTS,
  TRAVELTRUST_V6_ZH_SPEC_BANNED_FRAGMENTS,
  TRAVELTRUST_V6_SURFACE_KEYS,
} from "@/lib/traveltrustV6SurfaceCompliance";

describe("traveltrust v6 zh surface copy (TT-PH1-156)", () => {
  it("hero title is a single localized string", () => {
    expect(zh.traveltrust_hero_title).toBe("TravelTrust 定制旅行");
  });

  it("avoids banned English fragments on hero-facing keys", () => {
    for (const key of TRAVELTRUST_V6_SURFACE_KEYS) {
      const value = zh[key].toLowerCase();
      for (const banned of TRAVELTRUST_V6_ZH_BANNED_FRAGMENTS) {
        expect(value, `${key} contains "${banned}"`).not.toContain(banned);
      }
    }
  });

  it("avoids internal spec numbers on user-visible surface", () => {
    for (const key of TRAVELTRUST_V6_SURFACE_KEYS) {
      const value = zh[key];
      for (const banned of TRAVELTRUST_V6_ZH_SPEC_BANNED_FRAGMENTS) {
        expect(value, `${key} contains "${banned}"`).not.toContain(banned);
      }
    }
  });
});
