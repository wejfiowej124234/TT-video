import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import facetRegistry from "../registry/market-guide-facet.v1.json";
import {
  MARKET_GUIDE_FACET_REGISTRY_VERSION,
  MARKET_UI_LANGUAGE_MATCH_TOKENS,
  MARKET_UI_SERVICE_MATCH_SLUGS,
  marketGuideServiceTokensMatch,
  normalizeGuideLanguageForWrite,
  normalizeGuideServiceTypeForWrite,
} from "./marketGuideFilterQuery";

describe("market-guide-facet registry parity", () => {
  it("TS registry version matches JSON", () => {
    expect(MARKET_GUIDE_FACET_REGISTRY_VERSION).toBe(facetRegistry.version);
  });

  it("TS language map matches registry/market-guide-facet.v1.json", () => {
    for (const [ui, row] of Object.entries(facetRegistry.languages)) {
      expect(MARKET_UI_LANGUAGE_MATCH_TOKENS[ui]).toEqual(row.match);
      expect(normalizeGuideLanguageForWrite(ui)).toBe(row.canonical);
    }
  });

  it("TS service map matches registry and playmate excludes culture", () => {
    for (const [ui, row] of Object.entries(facetRegistry.services)) {
      expect(MARKET_UI_SERVICE_MATCH_SLUGS[ui]).toEqual(row.match);
      expect(normalizeGuideServiceTypeForWrite(ui)).toBe(row.canonical);
    }
    expect(marketGuideServiceTokensMatch("culture", "陪玩服务")).toBe(false);
    expect(marketGuideServiceTokensMatch("culture", "向导服务")).toBe(true);
  });

  it("Rust market_guide_filter.rs references registry path", () => {
    const rust = readFileSync(
      join(__dirname, "../../crates/api/src/chain_off/market_guide_filter.rs"),
      "utf8",
    );
    expect(rust).toContain("market-guide-facet.v1.json");
  });
});
