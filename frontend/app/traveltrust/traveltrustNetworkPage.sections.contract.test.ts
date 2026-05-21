import { readFileSync } from "node:fs";

import { dirname, join } from "node:path";

import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { TRAVELTRUST_V6_SECTIONS } from "@/lib/traveltrustPageBrief";



const __dir = dirname(fileURLToPath(import.meta.url));

const cinematicDir = join(__dir, "../../components/traveltrust/cinematic");



const REQUIRED_SECTION_IDS = [...TRAVELTRUST_V6_SECTIONS, "hero", "fee-router"] as const;



function readCinematicSources(): string {

  const files = [

    "TravelTrustNetworkPageMain.tsx",

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

    .map((f) => {

      const path = f.includes("Network") ? join(__dir, f) : join(cinematicDir, f);

      return readFileSync(path, "utf8");

    })

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

    expect(src).toContain("traveltrust_skip_to_hero");

    expect(src).toContain('href="#hero"');

  });



  it("keeps sticky in-page nav outside hero (scroll persistence)", () => {

    const mainSrc = readFileSync(join(__dir, "TravelTrustNetworkPageMain.tsx"), "utf8");

    const heroSrc = readFileSync(join(cinematicDir, "TravelTrustCinematicHero.tsx"), "utf8");

    expect(mainSrc).toContain('data-tt-traveltrust-landing-nav-slot="sticky"');

    expect(mainSrc).toContain("TravelTrustLandingChrome");

    expect(heroSrc).not.toContain("TravelTrustLandingNav");

    expect(heroSrc).not.toContain("TravelTrustLandingChrome");

  });

});


