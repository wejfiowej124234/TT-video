import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TT_Z, ttZClass, ttZStyle } from "./traveltrustZ";

const DECIMAL_Z_INDEX_CLASS = /z-\[\d+\.\d+\]/g;
const RAW_PAGE_STACK_Z = /z-\[(8|9|10|12|13|20|24|25)\]/g;

describe("traveltrustZ", () => {
  it("exposes integer page stack layers", () => {
    expect(TT_Z.GLOBE_UNDERLAY).toBe(8);
    expect(TT_Z.CANVAS).toBe(9);
    expect(TT_Z.HERO_SKY).toBe(10);
    expect(TT_Z.HERO_COPY).toBe(12);
    expect(TT_Z.HERO_SKY_WASH).toBe(13);
    expect(TT_Z.HERO_SKY_WASH).toBeGreaterThan(TT_Z.HERO_COPY);
    expect(TT_Z.CONTENT).toBe(20);
    expect(TT_Z.GRAIN).toBe(24);
    expect(TT_Z.NAV).toBe(25);
    expect(TT_Z.LANDING_CHROME).toBe(280);
    expect(TT_Z.LANDING_CHROME).toBeGreaterThan(TT_Z.NAV);
  });

  it("ttZClass / ttZStyle use the same integer", () => {
    expect(ttZClass(TT_Z.HERO_SKY)).toBe("z-[10]");
    expect(ttZClass(TT_Z.HERO_SKY_WASH)).toBe("z-[13]");
    expect(ttZStyle(TT_Z.CANVAS)).toEqual({ zIndex: 9 });
  });

  it("ttZClass never emits decimal z-index", () => {
    for (const z of Object.values(TT_Z)) {
      expect(ttZClass(z)).not.toMatch(DECIMAL_Z_INDEX_CLASS);
      expect(Number.isInteger(z)).toBe(true);
    }
  });
});

describe("traveltrust page stack · no raw z-[8|9|10|20|24|25]", () => {
  const relPaths = [
    "lib/traveltrustCinematicNonGlobeL5.ts",
    "lib/marketingUi.ts",
    "lib/traveltrustLandingNavStyles.ts",
    "components/traveltrust/cinematic/TravelTrustHeroFixedInkMask.tsx",
    "components/traveltrust/cinematic/TravelTrustCinematicHero.tsx",
    "components/traveltrust/cinematic/TravelTrustCinematicShell.tsx",
    "components/traveltrust/cinematic/TravelTrustBelowFoldSections.tsx",
    "components/traveltrust/TravelTrustPageBriefStatus.tsx",
    "app/traveltrust/TravelTrustNetworkPageMain.tsx",
    "app/traveltrust/layout.tsx",
  ];

  for (const rel of relPaths) {
    it(`${rel} uses TT_Z (no literal page-stack z-[n])`, () => {
      const src = readFileSync(join(__dirname, "..", rel), "utf8");
      expect(src).toContain("traveltrustZ");
      expect(src.match(RAW_PAGE_STACK_Z)).toBeNull();
      expect(src.match(DECIMAL_Z_INDEX_CLASS)).toBeNull();
    });
  }
});
