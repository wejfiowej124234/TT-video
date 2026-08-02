import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const homePage = join(__dirname, "page.tsx");
const heroForm = join(__dirname, "../../components/landing/LandingHeroForm.tsx");

/** `/` 首页 SSOT：`app/(home)/page.tsx` + `components/landing/*`（非 archive/ui-v1、非未接线 v2 拆分件） */
describe("home `/` SSOT (marketing closure)", () => {
  it("uses per-country Ken Burns ambient backdrop + vignette + dot grid on page shell", () => {
    const src = readFileSync(homePage, "utf8");
    const decor = readFileSync(join(__dirname, "../../components/landing/LandingHomeDecorLayers.tsx"), "utf8");
    expect(src).toContain("LandingHomeAmbientBackdrop");
    expect(src).toContain("LandingHomeDecorLayers");
    expect(src).toContain("TT_MARKETING_HOME_SECTION_BRIDGE");
    expect(src).toContain("country={data.country}");
    expect(src).not.toContain("landingAmbientImageUrl");
    expect(decor).toContain("bg-experience-landing-vignette");
    expect(decor).toContain("TT_MARKETING_HOME_AMBIENT_GLOW");
    expect(decor).toContain("TT_MARKETING_HOME_DOT_GRID");
    expect(src).toContain("LandingHeroForm");
    expect(src).toContain("showConsumerValue");
    expect(src).toContain("ColdStartHomeHeroHighlights");
    expect(src).toContain("HomeCmsAnnouncementStrip");
    expect(src).not.toContain("PersistentRoleEntryBar");
    expect(src).toContain("ItineraryResultsSection");
    expect(src).toContain("UnlockModal");
    expect(src).toContain("LandingFooter");
    expect(src).not.toContain("data-tt-home-page");
    expect(src).not.toContain("data-tt-ui-generation");
    expect(src).not.toContain("HomeLandingLayoutV2");
    expect(src).not.toContain("isHomeLayoutV2Enabled");
    expect(src).not.toContain("data-tt-home-layout");
  });

  it("exposes stable hero section + form id and warm Action submit FAB (§1.7 · TT-PH1-229)", () => {
    const hero = readFileSync(heroForm, "utf8");
    expect(hero).toContain('id="form"');
    expect(hero).toContain('id="landing-hero-form"');
    expect(hero).toContain("LandingHeroAuxLinks");
    expect(hero).toContain("LandingHeroNavTabs");
    expect(hero).toContain("HomeConsumerValueSection");
    expect(hero).toContain("landing_hero_action_note");
    expect(hero).not.toContain("landing_hero_escrow_note");
    expect(hero).toContain("LandingHeroCityField");
    expect(hero).toContain("TT_MARKETING_HOME_SUBMIT_FAB");
    expect(hero).toContain("ttMarketingHomeFilterPillClasses");
    expect(hero).toContain('ttMarketingHomeFilterPillClasses(selected, "country")');
    expect(hero).toContain("TT_MARKETING_HOME_PREFERENCES_DETAILS");
    expect(hero).toContain("whitespace-nowrap");
    expect(hero).not.toContain("max-w-[5.5rem]");
    expect(hero).toContain("TT_MARKETING_HOME_HERO_KICKER");
    expect(hero).toContain("TT_MARKETING_HOME_HERO_TITLE");
    expect(hero).toContain("<fieldset");
    expect(hero).toContain("TT_MARKETING_HOME_HERO_CARD_FRAME");
    expect(hero).not.toContain("bg-cta-gradient");
    expect(hero).not.toContain("bg-cyan-500/80");
    expect(hero).not.toContain("from-ref-teal via-ref-cyan");
    expect(hero).not.toContain("LandingHeroFormHeroIntro");
    expect(hero).not.toContain("data-tt-ui-generation");
  });

  it("backdrop resolves country image via catalog ambient hook (W1)", () => {
    const backdrop = join(__dirname, "../../components/landing/LandingHomeAmbientBackdrop.tsx");
    const src = readFileSync(backdrop, "utf8");
    expect(src).toContain("useLandingAmbientResolution");
    expect(src).toContain("displaySrc");
    expect(src).toContain("preloadAmbientImage");
    expect(src).toContain("tt-home-ambient-ken-burns");
    expect(src).toContain('data-tt-home-ambient-src');
    expect(src).toContain('data-tt-home-ambient-ts-url');
    expect(src).toContain('data-tt-home-ambient-runtime-url');
    expect(src).toContain('data-tt-home-ambient-motion');
    expect(src).toContain('data-tt-home-ambient-phase="A"');
    expect(src).not.toContain("landingHomeAmbientVideo");
  });

  it("aux links use warm-bordered hero aux token (not plain white-outline pills)", () => {
    const aux = join(__dirname, "../../components/landing/LandingHeroAuxLinks.tsx");
    const src = readFileSync(aux, "utf8");
    expect(src).toContain("TT_MARKETING_HOME_HERO_AUX_LINK");
    expect(src).not.toContain("TT_MARKETING_TRUST_BADGE_HOME");
  });

  it("hero nav tabs separate active warm glass from inactive warm-border ghost", () => {
    const tabsPath = join(__dirname, "../../components/landing/LandingHeroNavTabs.tsx");
    const tabs = readFileSync(tabsPath, "utf8");
    const hero = readFileSync(heroForm, "utf8");
    const ui = readFileSync(join(__dirname, "../../lib/marketingUi.ts"), "utf8");
    expect(tabs).toContain("TT_MARKETING_HOME_HERO_NAV_TAB_ACTIVE");
    expect(ui).toContain("TT_MARKETING_HOME_HERO_NAV_TAB_ACTIVE");
    expect(ui).toContain("!text-ref-sun");
    expect(ui).toContain("TT_MARKETING_HOME_HERO_NAV_TAB_ACTIVE");
    expect(ui).toContain("TT_MARKETING_HOME_HERO_PILL_GHOST");
    expect(ui).toContain("TT_MARKETING_HOME_HERO_NAV_TAB_INACTIVE = TT_MARKETING_HOME_HERO_AUX_LINK");
    expect(hero).toContain("TT_MARKETING_HOME_HERO_ACTIONS_STACK");
    expect(hero).not.toContain("TT_MARKETING_HOME_HERO_ACTIONS_ZONE");
  });

  it("results section exposes section lead copy token", () => {
    const results = join(__dirname, "../../components/landing/ItineraryResultsSection.tsx");
    const src = readFileSync(results, "utf8");
    expect(src).toContain("landing_results_section_lead");
    expect(src).toContain("TT_MARKETING_HOME_RESULTS_LEAD");
  });

  it("links to TravelTrust network from hero nav tabs", () => {
    const tabs = join(__dirname, "../../components/landing/LandingHeroNavTabs.tsx");
    const src = readFileSync(tabs, "utf8");
    expect(src).toContain('href="/traveltrust"');
    expect(src).toContain("marketHref");
    expect(src).not.toMatch(/href="\/market"/);
    expect(src).toContain("TT_MARKETING_BTN_NETWORK_LINK_HOME");
    expect(src).toContain("TT_MARKETING_HOME_HERO_NAV_TAB_ACTIVE");
    expect(src).not.toContain("bg-white/25");
    expect(src).toContain("prefetch");
  });

  it("passes hero form context into market deep link (① data chain)", () => {
    const page = readFileSync(homePage, "utf8");
    const hero = readFileSync(heroForm, "utf8");
    expect(page).toContain("marketHref={data.marketHref}");
    expect(hero).toContain("marketHref?: string");
    expect(hero).toContain("<LandingHeroNavTabs marketHref={marketHref} />");
  });

  it("footer uses home footer tokens and not travel-600 cross-nav blue", () => {
    const footer = join(__dirname, "../../components/landing/LandingFooter.tsx");
    const src = readFileSync(footer, "utf8");
    expect(src).toContain("TT_MARKETING_HOME_FOOTER");
    expect(src).toContain("TT_MARKETING_HOME_FOOTER_CROSS_LINK");
    expect(src).toContain("hideFeeRouterLinks");
    expect(src).not.toContain("text-travel-600");
    expect(src).not.toContain("PRODUCT_CROSS_NAV_DEFAULT_LINK");
  });

  it("home page shell uses marketingUi ambient tokens (224-D · D6)", () => {
    const page = readFileSync(homePage, "utf8");
    const decor = readFileSync(join(__dirname, "../../components/landing/LandingHomeDecorLayers.tsx"), "utf8");
    expect(page).toContain("LandingHomeDecorLayers");
    expect(decor).toContain("TT_MARKETING_HOME_AMBIENT_GLOW");
    expect(decor).toContain("TT_MARKETING_HOME_DOT_GRID");
    expect(page).toContain("TT_MARKETING_HOME_FOOTER_TOP_FADE");
    expect(page).not.toMatch(/rgba\(35,\s*206,\s*217/);
    const hero = readFileSync(heroForm, "utf8");
    expect(hero).toContain("data-tt-home-first-task");
    expect(page).toContain('data-tt-home-favorites-mode="localstorage-f020-sync-v1"');
  });
});
