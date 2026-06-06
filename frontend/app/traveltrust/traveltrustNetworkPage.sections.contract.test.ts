import { readFileSync } from "node:fs";

import { dirname, join } from "node:path";

import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { TRAVELTRUST_V6_SECTIONS } from "@/lib/traveltrustPageBrief";



const __dir = dirname(fileURLToPath(import.meta.url));

const cinematicDir = join(__dir, "../../components/traveltrust/cinematic");

const composerLandingNavPath = join(
  __dir,
  "../../modules/traveltrust-home/presentation/TravelTrustHomeLandingNavSlot.tsx",
);

const composerMainColumnPath = join(
  __dir,
  "../../modules/traveltrust-home/presentation/TravelTrustHomeMainColumn.tsx",
);



const REQUIRED_SECTION_IDS = [...TRAVELTRUST_V6_SECTIONS, "hero", "fee-router"] as const;



function readCinematicSources(): string {

  const files = [

    "TravelTrustCinematicHero.tsx",

    "TravelTrustPulseTicker.tsx",

    "TravelTrustIdentityTheater.tsx",

    "TravelTrustStablecoinGateway.tsx",

    "TravelTrustTrustFactsStrip.tsx",

    "TravelTrustSettlementStrip.tsx",

    "TravelTrustFaqStrip.tsx",

    "TravelTrustStartSection.tsx",

  ];

  return files

    .map((f) => readFileSync(join(cinematicDir, f), "utf8"))

    .join("\n");

}



describe("traveltrust network page sections (contract)", () => {

  const src = readCinematicSources();



  for (const id of REQUIRED_SECTION_IDS) {

    it(`exposes section anchor #${id}`, () => {

      expect(src).toContain(`id="${id}"`);

    });

  }



  it("does not mount removed stats / explain strips", () => {

    expect(src).not.toContain('id="stats"');

    expect(src).not.toContain('id="explain"');

    expect(src).not.toContain("TravelTrustIllustrativeStats");

    expect(src).not.toContain("TravelTrustQuickExplain");

  });



  it("exposes skip link to hero", () => {

    const mainColumnSrc = readFileSync(composerMainColumnPath, "utf8");

    const composerSrc = readFileSync(
      join(__dir, "../../modules/traveltrust-home/presentation/TravelTrustNetworkPageComposer.tsx"),
      "utf8",
    );

    expect(composerSrc).toContain("traveltrust_skip_to_hero");

    expect(mainColumnSrc).toContain('href="#hero"');

    expect(mainColumnSrc).toContain("skipToHeroLabel");

  });



  it("keeps sticky in-page nav outside hero (scroll persistence)", () => {

    const navSlotSrc = readFileSync(composerLandingNavPath, "utf8");

    const heroSrc = readFileSync(join(cinematicDir, "TravelTrustCinematicHero.tsx"), "utf8");

    expect(navSlotSrc).toContain('data-tt-traveltrust-landing-nav-slot="fixed"');

    expect(navSlotSrc).toContain("TravelTrustLandingChrome");

    expect(heroSrc).not.toContain("TravelTrustLandingNav");

    expect(heroSrc).not.toContain("TravelTrustLandingChrome");

  });

});


