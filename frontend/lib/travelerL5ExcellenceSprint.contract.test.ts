import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TRAVELER_L5_BANNED_CONSUMER_COPY,
  TRAVELER_L5_JOURNEY_LOCALE_KEYS,
  TRAVELER_L5_JOURNEY_STEPS,
  TRAVELER_L5_SPRINT_ID,
} from "./travelerL5ExcellenceSprintModel";

const feRoot = join(__dirname, "..");

function read(rel: string) {
  return readFileSync(join(feRoot, rel), "utf8");
}

function extractLocaleValue(src: string, key: string): string {
  const re = new RegExp(`${key}:\\s*"([^"]*)"`, "m");
  const single = src.match(re);
  if (single?.[1]) return single[1];
  const multi = src.match(new RegExp(`${key}:\\s*\\n\\s*"([^"]*)"`, "m"));
  return multi?.[1] ?? "";
}

describe("Traveler L5 Excellence Sprint contract", () => {
  it("registers sprint id and seven journey steps", () => {
    expect(TRAVELER_L5_SPRINT_ID).toContain("traveler-l5");
    expect(TRAVELER_L5_JOURNEY_STEPS.map((s) => s.id)).toEqual([
      "home",
      "preview",
      "escrow_draft",
      "market_guide",
      "guide_detail",
      "pay",
      "orders",
    ]);
    for (const step of TRAVELER_L5_JOURNEY_STEPS) {
      expect(step.getKeys.length, step.id).toBeGreaterThan(0);
      expect(step.trustKeys.length, step.id).toBeGreaterThan(0);
      expect(step.nextKeys.length, step.id).toBeGreaterThan(0);
    }
  });

  it("journey locale keys avoid consumer-banned jargon (zh + en)", () => {
    for (const localeFile of ["locales/zh.ts", "locales/en.ts"] as const) {
      const src = read(localeFile);
      for (const key of TRAVELER_L5_JOURNEY_LOCALE_KEYS) {
        const value = extractLocaleValue(src, key);
        expect(value.length, `${localeFile} missing ${key}`).toBeGreaterThan(0);
        expect(value, `${localeFile}:${key}`).not.toMatch(TRAVELER_L5_BANNED_CONSUMER_COPY);
      }
    }
  });

  it("preview section uses traveler currency label not DID rank badge", () => {
    const results = read("components/landing/ItineraryResultsSection.tsx");
    expect(results).toContain('t("traveler_quote_currency")');
    expect(results).not.toContain('t("didRank_badge_stablecoins")');
    expect(results).toContain("landing_results_next_step");
    expect(results).toContain('data-tt-traveler-l5-journey="preview"');
  });

  it("audit registry documents three personas and closure table", () => {
    const audit = read(
      "evidence/GO_local_web3_itinerary_l5/TRAVELER-L5-EXCELLENCE-SPRINT-AUDIT.md",
    );
    expect(audit).toContain("first_visit");
    expect(audit).toContain("first_order");
    expect(audit).toContain("first_pay");
    expect(audit).toContain("5s");
    expect(audit).toContain("30s");
    expect(audit).toContain("3min");
  });
});
