import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TT_BELOW_FOLD_SCROLL_PLATE_L5,
  TT_NETWORK_FOOTER_L5,
  TT_PAGE_SECTION_FLOW_L5,
  TT_PAGE_VERTICAL_RHYTHM_L5,
  TT_SECTION_FILM_DIVIDER_HANDOFF_L5,
  TT_START_SECTION_L5,
  TT_STABLECOIN_GATEWAY_L5,
  TT_SECTION_CONTENT_L5,
  TT_THEATER_SECTION_L5,
  TT_TTG_UNLOCK_L5,
} from "@/lib/traveltrust/l5";
import { TRAVELTRUST_HOME_LAYOUT_LOCK_L5 } from "./traveltrustHomeLayoutLockL5";
import { TT_SPACING_DEBUG_GAP_TARGETS_PX } from "./traveltrustSpacingDebug";
import { TT_PAGE_SPACING_AUDIT_L5 } from "./traveltrustPageSpacingAuditL5";
import { runTraveltrustVerticalRhythmTokenAudit } from "./traveltrustPageSpacingAuditL5";

const REPO = join(__dirname, "..");
const CINEMATIC = join(REPO, "components/traveltrust/cinematic");
const APP = join(REPO, "app/traveltrust");

function readCinematic(name: string): string {
  const abs = join(CINEMATIC, name);
  expect(existsSync(abs), `missing ${name}`).toBe(true);
  return readFileSync(abs, "utf8");
}

describe("traveltrustHomeLayoutLockL5", () => {
  const lock = TRAVELTRUST_HOME_LAYOUT_LOCK_L5;

  it("exports frozen lock metadata", () => {
    expect(lock.lockId).toBe("TT-TRAVELTRUST-HOME-LAYOUT-LOCK-2026-08-v18-screenshot-body");
    expect(lock.label).toBe("traveltrust-home-screenshot-body-v18-local");
    expect(lock.sectionOrder).toEqual([
      "hero",
      "trust",
      "settlement",
      "unlock",
      "liquidity",
      "roles",
      "start",
    ]);
    expect(lock.archivedSectionIds).toEqual(["faq"]);
    expect(lock.liquiditySplit.stack).toContain("flex-col");
    expect(lock.liquiditySplit.stack).toContain("pt-10");
    expect(lock.liquiditySplit.stack).toContain("gap-8");
    expect(lock.liquiditySplit.wrap).toContain("lg:grid-cols-2");
    expect(lock.modularity.composerShellPath).toContain("TravelTrustHomeComposerShell");
    expect(lock.modularity.composerMainColumnPath).toContain("TravelTrustHomeMainColumn");
    expect(lock.modularity.homeBodyModulePath).toContain("TravelTrustHomeBodyModule");
    expect(lock.modularity.lockedChromePath).toContain("TravelTrustLockedHomeChrome");
    expect(lock.modularity.homeModuleRegistryPath).toBe("registry/traveltrust-home-module-registry.v1.yaml");
    expect(lock.modularity.homeModuleRegistryId).toBe("TRAVELTRUST_HOME_MODULAR_RELEASE_V1");
    expect(lock.modularity.lockedChromeFiles).toContain("frontend/components/Header.tsx");
    expect(lock.modularity.composerLifecycleHookPath).toContain("useTraveltrustComposerPage");
    expect(lock.modularity.cinematicBridgePath).toContain("lib/traveltrust/home/cinematic-bridge");
    expect(lock.modularity.cinematicBridgeImport).toBe("@/lib/traveltrust/home/cinematic-bridge");
    expect(lock.modularity.belowFoldShellPath).toContain("BelowFoldSectionsShell");
    expect(lock.modularity.visualQaEvidencePath).toContain("visualQaEvidence");
    expect(lock.modularity.belowFoldNarrativeBeatsPath).toContain("belowFoldNarrativeBeats");
    expect(lock.modularity.visualQaManifestPath).toContain("visualQaManifest");
    expect(lock.modularity.sectionUiSlotPath).toContain("TravelTrustHomeSectionSlot");
    expect(lock.modularity.sectionWrappers).toContain("TravelTrustHomeRolesSection");
    expect(lock.modularity.l5Domains).toContain("resolvers");
    expect(lock.modularity.composerDynamicsPath).toContain("TravelTrustHomeComposerDynamics");
    expect(lock.scrollSnapEnabled).toBe(false);
    expect(lock.filmDividerCount).toBe(2);
    expect(lock.belowFold.faqStartDivider).toBe(false);
  });

  it("keeps TT_PAGE_VERTICAL_RHYTHM_L5 aligned with lock snapshot", () => {
    const r = lock.rhythm;
    expect(TT_PAGE_VERTICAL_RHYTHM_L5.sectionClusterFirst).toBe(r.sectionClusterFirst);
    expect(TT_PAGE_VERTICAL_RHYTHM_L5.sectionClusterMid).toBe(r.sectionClusterMid);
    expect(TT_PAGE_VERTICAL_RHYTHM_L5.sectionClusterUnlock).toBe(r.sectionClusterUnlock);
    expect(TT_PAGE_VERTICAL_RHYTHM_L5.sectionClusterLast).toBe(r.sectionClusterLast);
    expect(TT_TTG_UNLOCK_L5.listClass).toContain("gap-5");
    expect(TT_TTG_UNLOCK_L5.listClass).toContain("sm:gap-6");
    expect(TT_PAGE_VERTICAL_RHYTHM_L5.sectionAfterMajorBreak).toBe(r.sectionAfterMajorBreak);
    expect(TT_PAGE_VERTICAL_RHYTHM_L5.sectionBottomTheater).toBe(r.sectionBottomTheater);
    expect(TT_PAGE_VERTICAL_RHYTHM_L5.sectionTopStart).toBe(r.sectionTopStart);
    expect(TT_PAGE_VERTICAL_RHYTHM_L5.complianceShell).toBe(r.complianceShell);
  });

  it("keeps start and liquidity CTA spacing locked", () => {
    expect(TT_START_SECTION_L5.ctaStackClass).toBe(lock.startCta.stack);
    expect(TT_STABLECOIN_GATEWAY_L5.ctaStackClass).toBe(lock.liquidityCta.stack);
    expect(TT_START_SECTION_L5.ctaStackClass).toContain("gap-x-8");
    expect(TT_START_SECTION_L5.ctaStackClass).toContain("flex-nowrap");
  });

  it("keeps theater intro without decorative rule line token", () => {
    expect(TT_THEATER_SECTION_L5.introHeadlineBlockClass).toBe(lock.theaterIntro.headlineBlock);
    const theater = readCinematic("TravelTrustIdentityTheater.tsx");
    expect(theater).not.toContain("introKickerRuleClass");
    expect(theater).not.toContain("data-tt-traveltrust-theater-intro-rule");
  });

  it("keeps trust card grid gap locked", () => {
    const grid = TT_SECTION_CONTENT_L5.cardGridClass;
    expect(grid).toContain("gap-5");
    expect(grid).toContain("sm:gap-6");
  });

  it("locks below-fold narrative structure", () => {
    const below = readFileSync(
      join(REPO, "modules/traveltrust-home/sections/TravelTrustHomeBelowFoldSection.tsx"),
      "utf8",
    );
    const economy = readFileSync(
      join(REPO, "modules/traveltrust-home/sections/TravelTrustHomeEconomyClusterSection.tsx"),
      "utf8",
    );
    expect(below).toContain("TravelTrustHomeRolesSection");
    expect(below).toContain("TravelTrustHomeEconomyClusterSection");
    expect(below.indexOf("<TravelTrustHomeEconomyClusterSection")).toBeLessThan(
      below.indexOf("<TravelTrustHomeRolesSection"),
    );
    expect(below).toContain("TravelTrustHomeStartCloseSection");
    expect(below).not.toContain("TravelTrustHomeFaqSection");
    expect(below.indexOf("<TravelTrustHomeRolesSection")).toBeLessThan(
      below.indexOf("<TravelTrustHomeStartCloseSection"),
    );
    const trustIdx = economy.indexOf("<TravelTrustHomeTrustSection");
    const settlementIdx = economy.indexOf("<TravelTrustHomeSettlementSection");
    const unlockIdx = economy.indexOf("<TravelTrustHomeUnlockSection");
    const liquidityIdx = economy.indexOf("<TravelTrustHomeLiquiditySection");
    expect(trustIdx).toBeGreaterThan(-1);
    expect(trustIdx).toBeLessThan(settlementIdx);
    expect(settlementIdx).toBeLessThan(unlockIdx);
    expect(unlockIdx).toBeLessThan(liquidityIdx);
    const roles = readFileSync(
      join(REPO, "modules/traveltrust-home/sections/TravelTrustHomeRolesSection.tsx"),
      "utf8",
    );
    const faq = readFileSync(
      join(REPO, "modules/traveltrust-home/sections/TravelTrustHomeFaqSection.tsx"),
      "utf8",
    );
    const startClose = readFileSync(
      join(REPO, "modules/traveltrust-home/sections/TravelTrustHomeStartCloseSection.tsx"),
      "utf8",
    );
    expect(roles).toContain('chapterId="theater"');
    expect(faq).toContain('chapterId="faq"');
    expect(startClose).toContain('chapterId="close"');
    expect(below).not.toContain('chapterId="liquidity"');
    const dividers = below.match(/<TravelTrustSectionFilmDivider/g) ?? [];
    expect(dividers.length).toBe(lock.filmDividerCount);
    const rolesIdx = below.indexOf("<TravelTrustHomeRolesSection");
    const lastFilmDivider = below.lastIndexOf("<TravelTrustSectionFilmDivider");
    expect(lastFilmDivider).toBeGreaterThan(-1);
    expect(lastFilmDivider).toBeGreaterThan(rolesIdx);
    expect(below.indexOf("<TravelTrustSectionFilmDivider", lastFilmDivider + 1)).toBe(-1);
  });

  it("does not mount scroll-snap on network page main", () => {
    const main = readFileSync(join(APP, "TravelTrustNetworkPageMain.tsx"), "utf8");
    expect(main).not.toMatch(/TravelTrustPageScrollSnap/);
    const boot = readCinematic("TravelTrustPageScrollBoot.tsx");
    expect(boot).toContain("scroll-snap 已关闭");
  });

  it("keeps spacing debug targets aligned with L5 audit", () => {
    expect(TT_SPACING_DEBUG_GAP_TARGETS_PX["hero→trust"]).toBe(
      TT_PAGE_SPACING_AUDIT_L5.sectionGapTargetsPx["hero→trust"].ideal,
    );
    expect(TT_SPACING_DEBUG_GAP_TARGETS_PX["faq→start"]).toBe(
      TT_PAGE_SPACING_AUDIT_L5.sectionGapTargetsPx["faq→start"].ideal,
    );
  });

  it("passes vertical rhythm token audit", () => {
    expect(runTraveltrustVerticalRhythmTokenAudit().ok).toBe(true);
  });

  it("keeps grouped footer without top border line or ambience band", () => {
    const footer = readCinematic("TravelTrustNetworkFooter.tsx");
    expect(footer).toContain('grouped ? "hidden"');
    expect(footer).toContain("!grouped");
    expect(TT_START_SECTION_L5.sectionClass).not.toContain("border-t border-ref-sun");
  });

  it("keeps seamless close-chapter handoff (compliance → grouped footer)", () => {
    const compliance = readCinematic("TravelTrustPageComplianceBlock.tsx");
    expect(compliance).not.toContain("page-compliance-border-pulse");
    expect(compliance).not.toContain("via-ref-sun/55");
    expect(lock.seams.complianceTopBorder).toBe(false);
    expect(lock.seams.groupedFooterAmbience).toBe(false);
  });

  it("uses margin-only film dividers and unified below-fold atmosphere", () => {
    const s = lock.seams;
    expect(TT_SECTION_FILM_DIVIDER_HANDOFF_L5.wrapperClass).toBe(s.filmDividerWrapper);
    expect(TT_SECTION_FILM_DIVIDER_HANDOFF_L5.wrapperClass).not.toContain("via-[#0c0a09]");
    expect(TT_BELOW_FOLD_SCROLL_PLATE_L5.backdropClass).toBe(s.scrollPlateBackdrop);
    expect(TT_PAGE_SECTION_FLOW_L5.economyClusterAtmosphereClass).toBe(s.economyClusterAtmosphere);
    expect(lock.seams.filmDividerUsesMarginOnly).toBe(true);
    const belowFold = readCinematic("TravelTrustBelowFoldAtmosphere.tsx");
    expect(belowFold).toContain(s.belowFoldAtmosphereMarker);
    expect(belowFold).not.toContain("key={active}");
    const below = readCinematic("TravelTrustBelowFoldSections.tsx");
    expect(below).toContain(s.economyClusterAtmosphereMarker);
    const trust = readCinematic("TravelTrustTrustFactsStrip.tsx");
    expect(trust).not.toContain("trust-atmosphere-l5");
    expect(TT_NETWORK_FOOTER_L5.shellGroupedClass).toContain(s.footerGroupedShellPrefix);
  });
});
