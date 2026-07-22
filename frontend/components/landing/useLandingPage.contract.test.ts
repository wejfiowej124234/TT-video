import { readFileSync } from "node:fs";

import { join } from "node:path";

import { describe, expect, it } from "vitest";



const hook = join(__dirname, "useLandingPage.ts");

const mock = join(__dirname, "../../../crates/api/src/chain_off/itineraries.rs");



describe("useLandingPage product honesty (①)", () => {

  it("creates one itinerary order and one preview slot", () => {

    const src = readFileSync(hook, "utf8");

    expect(src).toContain("postItineraryCreate(body)");

    expect(src).not.toMatch(/for\s*\([^)]*\)\s*\{[^}]*postItineraryCreate/s);

    expect(src).toContain("setResultOrderIds([orderIdRaw])");

  });



  it("preview unlock loads order once and unlocks whole order by id", () => {

    const src = readFileSync(hook, "utf8");

    expect(src).toContain("getOrder(orderId)");

    expect(src).toContain("unlockedOrderIds");

    expect(src).toContain("new Set(prev).add(orderId)");

    expect(src).toContain("landingItinerarySession");

    expect(src).toContain("subscribeLandingItineraryStorage");

    expect(src).toContain("hydrateLandingUnlockedOrderDetails");

    expect(src).toContain("readLandingFavoriteOrderIds");

    expect(src).toContain("writeLandingFavoriteOrderIds");

    expect(src).toContain("buildLandingToMarketHref");

    expect(src).toContain("marketHref");

    expect(src).toContain("unlockError");
    expect(src).toContain("pullMarketTravelBookmarksIntoLocal");
    expect(src).toContain("pushMarketOrderBookmarkToggle");
    expect(src).toContain("prevSubmittingRef");
    expect(src).toContain("scrollRestoration");
    expect(src).toContain("isLandingAiItineraryFormReady");
    expect(src).toContain("parseLandingAiBudget");
    expect(src).toContain("aiGenerateCommitted");
    expect(src).toContain("showLiveAiResults");
    expect(src).toContain("previewLocked");
  });

});



describe("generate_itinerary_mock days SSOT (L-001/L-011)", () => {

  it("caps cities branch and fallback rows with body.days (1..30)", () => {

    const src = readFileSync(mock, "utf8");

    expect(src).toContain(".take(body.days.max(1).min(30) as usize)");

    expect(src).toContain("let days = body.days.max(1).min(30)");

  });

});

