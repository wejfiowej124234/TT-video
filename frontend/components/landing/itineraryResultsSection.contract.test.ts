import { readFileSync } from "node:fs";

import { join } from "node:path";

import { describe, expect, it } from "vitest";



const results = join(__dirname, "ItineraryResultsSection.tsx");



describe("ItineraryResultsSection L5 polish", () => {

  it("uses results scrim, warm heading, and glass preview slots (not dashed wireframe)", () => {

    const src = readFileSync(results, "utf8");

    expect(src).toContain("TT_MARKETING_HOME_RESULTS_PANEL");

    expect(src).toContain("TT_MARKETING_HOME_RESULTS_HEADING");

    expect(src).toContain("TT_MARKETING_HOME_PREVIEW_SLOT_CARD");

    expect(src).toContain("TT_MARKETING_HOME_PREVIEW_SLOT_FOOTER");

    expect(src).not.toContain("border-dashed");

    expect(src).toContain("useLandingAmbientUrl");

    expect(src).not.toContain("landingAmbientImageUrl");

    expect(src).toContain("landing_results_section_lead");

    expect(src).toContain("landing_trust_preview");

    expect(src).not.toContain("landing_rating");

    expect(src).toContain("unlockedOrderIds");

    expect(src).not.toContain("UNLOCK_PRICE_USD");

    expect(src).toContain("landing_quote_mid_label");
    expect(src).toContain('data-tt-home-itinerary-honesty="phase1-mock-ai-not-production"');
    expect(src).toContain("landing_results_count_note");
    expect(src).toContain("landing_results_unlock_note");

  });

});

