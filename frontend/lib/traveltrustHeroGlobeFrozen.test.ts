import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TRAVELTRUST_HERO_GLOBE_FROZEN_ID,
  TRAVELTRUST_HERO_GLOBE_FROZEN_LOCKED_AT,
  TRAVELTRUST_HERO_GLOBE_FROZEN_RELATIVE_PATHS,
  TRAVELTRUST_HERO_GLOBE_UNLOCK_PASS,
  TRAVELTRUST_HERO_GLOBE_UNLOCKED_AT,
} from "./traveltrustHeroGlobeFrozenManifest";

const REPO_ROOT = join(__dirname, "..", "..");
const FROZEN_MARK = TRAVELTRUST_HERO_GLOBE_FROZEN_ID;
const FROZEN_ALT = "@frozen TT-GLOBE-L5-FROZEN";

describe("traveltrustHeroGlobeFrozen manifest", () => {
  it("exports frozen sprint metadata", () => {
    expect(TRAVELTRUST_HERO_GLOBE_FROZEN_ID).toBe("TT-GLOBE-L5-FROZEN-2026-05");
    expect(TRAVELTRUST_HERO_GLOBE_FROZEN_LOCKED_AT).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(TRAVELTRUST_HERO_GLOBE_UNLOCK_PASS).toBe("TT-GLOBE-L5-UNLOCK-WARM-INK-2026-05");
    expect(TRAVELTRUST_HERO_GLOBE_UNLOCKED_AT).toBe("2026-05-20");
    expect(TRAVELTRUST_HERO_GLOBE_FROZEN_RELATIVE_PATHS.length).toBeGreaterThan(10);
  });

  it("frozen paths exist and carry frozen marker in source", () => {
    for (const rel of TRAVELTRUST_HERO_GLOBE_FROZEN_RELATIVE_PATHS) {
      const abs = join(REPO_ROOT, rel);
      expect(existsSync(abs), `missing frozen path: ${rel}`).toBe(true);
      const src = readFileSync(abs, "utf8");
      const marked = src.includes(FROZEN_MARK) || src.includes(FROZEN_ALT);
      expect(marked, `${rel} must reference ${FROZEN_MARK} or ${FROZEN_ALT}`).toBe(true);
    }
  });

  it("PageCinematicLighting keeps hero-only scene light suppression", () => {
    const src = readFileSync(
      join(REPO_ROOT, "frontend/components/traveltrust/cinematic/TravelTrustWeb3CinematicElements.tsx"),
      "utf8",
    );
    expect(src).toContain("heroAtTop");
    expect(src).toContain("heroCoolBrandLightMul");
  });

  it("Hero bloom disables on first screen", () => {
    const src = readFileSync(
      join(REPO_ROOT, "frontend/components/traveltrust/cinematic/TravelTrustCinematicBloom.tsx"),
      "utf8",
    );
    expect(src).toMatch(/heroFocus\s*>\s*0\.48/);
  });
});
