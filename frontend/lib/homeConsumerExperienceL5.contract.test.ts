import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const feRoot = join(__dirname, "..");
const homePage = join(feRoot, "app/(home)/page.tsx");
const valueSection = join(feRoot, "components/landing/HomeConsumerValueSection.tsx");
const resultsSection = join(feRoot, "components/landing/ItineraryResultsSection.tsx");

function read(rel: string) {
  return readFileSync(join(feRoot, rel), "utf8");
}

describe("Home consumer experience L5 audit", () => {
  it("home uses single value section instead of duplicate role bars", () => {
    const page = readFileSync(homePage, "utf8");
    const hero = readFileSync(join(feRoot, "components/landing/LandingHeroForm.tsx"), "utf8");
    expect(hero).toContain("HomeConsumerValueSection");
    expect(hero).toContain("showConsumerValue");
    expect(page).not.toContain("HomeConsumerValueSection");
    expect(page).not.toContain("PersistentRoleEntryBar");
    expect(page).not.toContain("RoleEntryQuickGrid");
  });

  it("value section exposes consumer preview cards and compact secondary roles", () => {
    const src = readFileSync(valueSection, "utf8");
    expect(src).toContain('data-tt-home-consumer-value="1"');
    expect(src).toContain("data-tt-home-consumer-value-cards");
    expect(src).toContain("data-tt-home-consumer-secondary-roles");
    expect(src).not.toContain("EscrowTrustMicro");
    expect(src).not.toContain("pes2_escrow");
  });

  it("itinerary results hide empty state and defer escrow trust chrome", () => {
    const src = readFileSync(resultsSection, "utf8");
    expect(src).toContain("return null");
    expect(src).not.toContain("RoleEntryQuickGrid");
    expect(src).not.toContain("EscrowTrustMicro");
    expect(src).not.toContain("TouchpointConversionStrip");
    expect(src).not.toContain('renderPreviewSlotCards("empty")');
    expect(src).toContain("home_consumer_funds_protected");
    expect(src).not.toContain("market_hero_pill_escrow");
  });

  it("locales use consumer copy without escrow-first empty state", () => {
    expect(read("locales/zh.ts")).toContain("home_consumer_value_title");
    expect(read("locales/en.ts")).toContain("home_consumer_value_title");
    expect(read("locales/zh.ts")).not.toMatch(
      /landing_results_section_lead:.*填写上方表单并生成后/,
    );
  });

  it("official highlights remain consumer-isolated from PES chrome", () => {
    const page = readFileSync(homePage, "utf8");
    expect(page).toContain("ColdStartHomeHeroHighlights");
    expect(read("components/coldStartCampaign/ColdStartHomeHeroHighlights.tsx")).toContain(
      "resolveConsumerHomeHeroHighlights",
    );
  });

  const FIRST_SCREEN_LOCALE_KEYS = [
    "landing_hero_kicker",
    "landing_hero_kicker_task",
    "landing_hero_title",
    "landing_hero_subtitle",
    "landing_hero_action_note",
    "landing_hero_itinerary_disclaimer",
    "landing_aux_companion",
    "landing_aux_join",
    "landing_aux_why_us",
    "landing_cta_create",
    "landing_cta_guides",
    "landing_btn_generate",
    "landing_results_count_note",
    "landing_results_unlock_note",
    "landing_btn_unlock",
    "landing_per_unlock",
    "unlock_title",
    "unlock_desc",
    "unlock_payment_note",
    "home_consumer_value_title",
    "home_consumer_value_lead",
    "home_consumer_value_plan_body",
    "home_consumer_value_guides_body",
    "home_consumer_value_community_body",
  ] as const;

  const BANNED_FIRST_SCREEN_COPY =
    /梦想之旅|协议支持|\bP0\b|\bL5\b|\bEscrow\b|\bWeb3\b|链上托管|testnet|\bmock\b|Phase ①|① 本地|① 无需/i;

  function extractLocaleValues(src: string, key: string): string {
    const re = new RegExp(`${key}:\\s*"([^"]*)"`, "m");
    const single = src.match(re);
    if (single?.[1]) return single[1];
    const multi = src.match(new RegExp(`${key}:\\s*\\n\\s*"([^"]*)"`, "m"));
    return multi?.[1] ?? "";
  }

  it("first-screen locale copy avoids dev/marketing jargon", () => {
    for (const localeFile of ["locales/zh.ts", "locales/en.ts"] as const) {
      const src = read(localeFile);
      for (const key of FIRST_SCREEN_LOCALE_KEYS) {
        const value = extractLocaleValues(src, key);
        expect(value.length, `${localeFile} missing ${key}`).toBeGreaterThan(0);
        expect(value, `${localeFile}:${key}`).not.toMatch(BANNED_FIRST_SCREEN_COPY);
      }
    }
  });
});
