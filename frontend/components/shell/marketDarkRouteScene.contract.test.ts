import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const shellDir = join(import.meta.dirname);

function readShell(rel: string) {
  return readFileSync(join(shellDir, rel), "utf8");
}

function readMarket(rel: string) {
  return readFileSync(join(shellDir, "../market", rel), "utf8");
}

function readDidRank(rel: string) {
  return readFileSync(join(shellDir, "../did-rank", rel), "utf8");
}

function readCommunity(rel: string) {
  return readFileSync(join(shellDir, "../community", rel), "utf8");
}

describe("marketDark route scene decor (contract)", () => {
  it("MarketDarkRouteSceneDecor reads TT_MARKETING_DARK_ROUTE_SCENE tiers", () => {
    const src = readShell("MarketDarkRouteSceneDecor.tsx");
    expect(src).toContain("TT_MARKETING_DARK_ROUTE_SCENE");
    expect(src).toContain("TT_MARKETING_DARK_ROUTE_SCRIM_CYAN");
    expect(src).toContain("bg-market-dark-warm-veil");
    expect(src).not.toMatch(/bg-scifi-gradient-static/);
    expect(src).not.toMatch(/via-ref-cyan/);
  });

  it("market / did-rank / community shells use shared scene decor", () => {
    expect(readMarket("MarketAmbientBackdrop.tsx")).toContain("tier={sceneTier}");
    expect(readDidRank("DidRankRouteAmbientDecor.tsx")).toContain("tier={sceneTier}");
    expect(readCommunity("CommunityAmbientBackdrop.tsx")).toContain("tier={sceneTier}");
  });

  it("TT_MARKETING_DARK_ROUTE_SCENE.market tier is warm-forward (223-C)", () => {
    const src = readFileSync(join(shellDir, "../../lib/marketingUi.ts"), "utf8");
    expect(src).toMatch(/market:\s*\{[\s\S]*?podium:\s*"opacity-\[0\.16\]"/);
    expect(src).toMatch(/market:[\s\S]*?rgba\(252,164,124,0\.12\)/);
    expect(src).not.toMatch(/market:[\s\S]*?via-ref-cyan/);
  });

  it("defines marketPremium scene tier for premium dark base", () => {
    const src = readFileSync(join(shellDir, "../../lib/marketingUi.ts"), "utf8");
    expect(src).toContain("marketPremium:");
    expect(readMarket("MarketAmbientBackdrop.tsx")).toContain("resolveMarketDarkRouteSceneTier");
  });

  it("TT_MARKETING_DARK_ROUTE_SCENE.didRank tier is weakened for rank focus (224-D · D5)", () => {
    const src = readFileSync(join(shellDir, "../../lib/marketingUi.ts"), "utf8");
    expect(src).toMatch(/didRank:\s*\{[\s\S]*?podium:\s*"opacity-\[0\.19\]"/);
    expect(src).toMatch(/didRank:[\s\S]*?warmVeil:\s*"opacity-\[0\.24\]"/);
  });

  it("GuideCard glass book CTA uses warm market primary token", () => {
    const src = readMarket("GuideCard.tsx");
    expect(src).toContain("? `${touchTargetLink44Classes} ${TT_MARKETING_BTN_MARKET_PRIMARY}`");
  });
});
