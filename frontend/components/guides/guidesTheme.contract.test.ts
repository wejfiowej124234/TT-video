import { readFileSync } from "node:fs";

import { join } from "node:path";

import { describe, expect, it } from "vitest";



import { TT_MARKETING_MARKET_L5_LIST_CARD_FRAME } from "@/lib/marketingUi";



const CONSTANTS = join(

  process.cwd(),

  "app",

  "guides",

  "[id]",

  "guideDetailPageConstants.ts",

);



describe("guides atmosphere theme (bridge · TT-PH1-216 · ①)", () => {

  it("guide tokens align with market L5 card frame", () => {

    expect(TT_MARKETING_MARKET_L5_LIST_CARD_FRAME).toContain("from-white/50");

    expect(TT_MARKETING_MARKET_L5_LIST_CARD_FRAME).not.toContain("cyan");

  });



  it("guideDetailPageConstants re-exports market L5 surfaces", () => {

    const src = readFileSync(CONSTANTS, "utf8");

    expect(src).toContain("TT_MARKETING_MARKET_L5_LIST_CARD_FRAME");

    expect(src).toContain("TT_MARKETING_MARKET_DARK_PATH");

    expect(src).not.toMatch(/border-cyan-500\/30/);

  });



  it("guides route sources use market backdrop and warm links (L5 market parity)", () => {

    const loaded = readFileSync(

      join(process.cwd(), "app", "guides", "[id]", "GuideDetailPageLoaded.tsx"),

      "utf8",

    );

    const page = readFileSync(

      join(process.cwd(), "app", "guides", "[id]", "page.tsx"),

      "utf8",

    );

    expect(loaded).toContain("MarketAmbientBackdrop");

    expect(loaded).not.toContain("MarketPageAmbientLayers");

    expect(loaded).toContain("GUIDE_DETAIL_BREADCRUMB_LINK_CLASS");

    expect(loaded).toContain("GUIDE_DETAIL_L5_CLOSURE_PROBE");

    expect(loaded).not.toMatch(/text-cyan-/);

    expect(page).toContain("GuideDetailPageMain");

    expect(page).not.toContain("guideDetail_credentials");

  });

});


