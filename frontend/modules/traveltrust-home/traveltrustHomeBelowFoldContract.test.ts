import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  TRAVELTRUST_HOME_BELOW_FOLD_FILM_DIVIDER_COUNT,
  TRAVELTRUST_HOME_BELOW_FOLD_FILM_DIVIDER_JSX_TAG,
  TRAVELTRUST_HOME_BELOW_FOLD_SHELL_MARKERS,
} from "@/lib/traveltrust/home/belowFoldContract";
import { TRAVELTRUST_HOME_BELOW_FOLD_CHAPTER_SEQUENCE } from "@/lib/traveltrust/home/belowFoldNarrativeBeats";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const mod = dirname(fileURLToPath(import.meta.url));
const cinematicBelowFold = join(root, "components/traveltrust/cinematic/TravelTrustBelowFoldSections.tsx");

function countOccurrences(src: string, needle: string): number {
  return src.split(needle).length - 1;
}

describe("traveltrust-home below-fold contract (module vs cinematic anchor)", () => {
  const moduleOrchestrator = readFileSync(join(mod, "sections/TravelTrustHomeBelowFoldSection.tsx"), "utf8");
  const cinematicAnchor = readFileSync(cinematicBelowFold, "utf8");

  it("uses shared below-fold shell SSOT in module and cinematic anchor", () => {
    const shell = readFileSync(join(root, "lib/traveltrust/home/BelowFoldSectionsShell.tsx"), "utf8");
    expect(moduleOrchestrator).toContain("TravelTrustHomeBelowFoldShell");
    expect(cinematicAnchor).toContain("TravelTrustHomeBelowFoldShell");
    for (const marker of TRAVELTRUST_HOME_BELOW_FOLD_SHELL_MARKERS) {
      expect(shell).toContain(marker);
    }
    expect(moduleOrchestrator).toContain("moduleOrchestrator");
    expect(shell).toContain("data-tt-traveltrust-home-below-fold-orchestrator");
    expect(cinematicAnchor).not.toContain("moduleOrchestrator");
  });

  it("matches layout lock film divider count and economy cluster", () => {
    expect(countOccurrences(moduleOrchestrator, TRAVELTRUST_HOME_BELOW_FOLD_FILM_DIVIDER_JSX_TAG)).toBe(
      TRAVELTRUST_HOME_BELOW_FOLD_FILM_DIVIDER_COUNT,
    );
    expect(countOccurrences(cinematicAnchor, TRAVELTRUST_HOME_BELOW_FOLD_FILM_DIVIDER_JSX_TAG)).toBe(
      TRAVELTRUST_HOME_BELOW_FOLD_FILM_DIVIDER_COUNT,
    );
    const economyCluster = readFileSync(join(mod, "sections/TravelTrustHomeEconomyClusterSection.tsx"), "utf8");
    expect(economyCluster).toContain('data-tt-traveltrust-economy-cluster="1"');
    expect(cinematicAnchor).toContain('data-tt-traveltrust-economy-cluster="1"');
    expect(economyCluster).toContain('data-tt-traveltrust-economy-cluster-atmosphere-l5="1"');
    expect(cinematicAnchor).toContain('data-tt-traveltrust-economy-cluster-atmosphere-l5="1"');
  });

  it("aligns snap chapter beats with contract table", () => {
    for (const chapterId of TRAVELTRUST_HOME_BELOW_FOLD_CHAPTER_SEQUENCE) {
      expect(cinematicAnchor).toContain(`chapterId="${chapterId}"`);
    }
    const roles = readFileSync(join(mod, "sections/TravelTrustHomeRolesSection.tsx"), "utf8");
    const faq = readFileSync(join(mod, "sections/TravelTrustHomeFaqSection.tsx"), "utf8");
    const close = readFileSync(join(mod, "sections/TravelTrustHomeStartCloseSection.tsx"), "utf8");
    expect(roles).toContain('chapterId="theater"');
    expect(faq).toContain('chapterId="faq"');
    expect(close).toContain('chapterId="close"');
    expect(close).toContain("<TravelTrustNetworkFooter grouped");
    expect(cinematicAnchor).toContain("<TravelTrustNetworkFooter grouped");
  });
});
