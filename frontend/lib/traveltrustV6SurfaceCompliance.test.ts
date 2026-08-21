import { describe, expect, it } from "vitest";
import zh from "@/locales/zh";
import {
  TRAVELTRUST_V6_ZH_BANNED_FRAGMENTS,
  TRAVELTRUST_V6_ZH_SPEC_BANNED_FRAGMENTS,
  TRAVELTRUST_V6_SURFACE_KEYS,
} from "./traveltrustV6SurfaceCompliance";

describe("traveltrust v6 zh surface compliance", () => {
  it("avoids banned English fragments on hero-facing keys", () => {
    for (const key of TRAVELTRUST_V6_SURFACE_KEYS) {
      const value = zh[key].toLowerCase();
      for (const banned of TRAVELTRUST_V6_ZH_BANNED_FRAGMENTS) {
        expect(value, `${key} contains "${banned}"`).not.toContain(banned);
      }
    }
  });

  it("avoids internal spec numbers on user-visible surface keys", () => {
    for (const key of TRAVELTRUST_V6_SURFACE_KEYS) {
      const value = zh[key];
      for (const banned of TRAVELTRUST_V6_ZH_SPEC_BANNED_FRAGMENTS) {
        expect(value, `${key} contains "${banned}"`).not.toContain(banned);
      }
    }
  });
});
