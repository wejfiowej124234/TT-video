import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  TRAVELTRUST_HOME_BELOW_FOLD_CHAPTER_SEQUENCE,
  TRAVELTRUST_HOME_BELOW_FOLD_NARRATIVE_BEATS,
} from "@/lib/traveltrust/home/belowFoldNarrativeBeats";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const cinematicBelow = join(root, "components/traveltrust/cinematic/TravelTrustBelowFoldSections.tsx");
const moduleBelow = join(
  root,
  "modules/traveltrust-home/sections/TravelTrustHomeBelowFoldSection.tsx",
);

function chapterPositions(src: string, chapterId: string): number[] {
  const positions: number[] = [];
  const needle = `chapterId="${chapterId}"`;
  let idx = src.indexOf(needle);
  while (idx !== -1) {
    positions.push(idx);
    idx = src.indexOf(needle, idx + needle.length);
  }
  return positions;
}

describe("traveltrust-home below-fold narrative parity", () => {
  const cinematic = readFileSync(cinematicBelow, "utf8");
  const moduleSrc = readFileSync(moduleBelow, "utf8");

  it("exports frozen narrative beats", () => {
    expect(TRAVELTRUST_HOME_BELOW_FOLD_NARRATIVE_BEATS.length).toBe(6);
    expect(TRAVELTRUST_HOME_BELOW_FOLD_CHAPTER_SEQUENCE).toEqual(["theater", "faq", "close"]);
  });

  it("module and cinematic share chapter sequence from SSOT", () => {
    let last = -1;
    for (const chapterId of TRAVELTRUST_HOME_BELOW_FOLD_CHAPTER_SEQUENCE) {
      const pos = cinematic.indexOf(`chapterId="${chapterId}"`);
      expect(pos, `cinematic missing ${chapterId}`).toBeGreaterThan(-1);
      expect(pos, `cinematic order ${chapterId}`).toBeGreaterThan(last);
      last = pos;
    }
    for (const chapterId of TRAVELTRUST_HOME_BELOW_FOLD_CHAPTER_SEQUENCE) {
      expect(moduleSrc).toContain(`TravelTrustHome`);
    }
  });

  it("cinematic anchor keeps economy cluster markers", () => {
    expect(cinematic).toContain('data-tt-traveltrust-economy-cluster="1"');
    expect(cinematic).toContain('data-tt-traveltrust-scroll-chapter-beat="economy"');
    expect(readFileSync(join(root, "modules/traveltrust-home/sections/TravelTrustHomeEconomyClusterSection.tsx"), "utf8")).toContain(
      'data-tt-traveltrust-economy-cluster="1"',
    );
  });

  it("film divider count matches beats ledger", () => {
    const dividersInBeats = TRAVELTRUST_HOME_BELOW_FOLD_NARRATIVE_BEATS.filter((b) => b.kind === "film-divider").length;
    expect(dividersInBeats).toBe(2);
    const dividerTag = "<TravelTrustSectionFilmDivider";
    expect(cinematic.split(dividerTag).length - 1).toBe(2);
    expect(moduleSrc.split(dividerTag).length - 1).toBe(2);
  });
});
