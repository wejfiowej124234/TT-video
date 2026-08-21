import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const modDir = dirname(fileURLToPath(import.meta.url));
const cinematicDir = join(root, "components/traveltrust/cinematic");
const bridgeDir = join(root, "lib/traveltrust/home/cinematic-bridge");
const BRIDGE_IMPORT = "@/lib/traveltrust/home/cinematic-bridge";

function listHomeModuleSources(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) {
      if (name === "cinematic-bridge") continue;
      listHomeModuleSources(abs, acc);
      continue;
    }
    if ((name.endsWith(".ts") || name.endsWith(".tsx")) && !name.includes(".test.")) acc.push(abs);
  }
  return acc;
}

function readCinematic(name: string): string {
  return readFileSync(join(cinematicDir, name), "utf8");
}

function listCinematicSources(): string[] {
  return readdirSync(cinematicDir).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));
}

describe("traveltrust-home architecture (enterprise boundaries)", () => {
  it("cinematic layer does not import modules/traveltrust-home", () => {
    const offenders: string[] = [];
    const scanDirs = [cinematicDir, join(cinematicDir, "page-scene")];
    for (const dir of scanDirs) {
      for (const file of readdirSync(dir).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))) {
        const src = readFileSync(join(dir, file), "utf8");
        if (src.includes("@/modules/traveltrust-home") || src.includes("modules/traveltrust-home")) {
          offenders.push(`${file}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("app route delegates orchestration to module composer", () => {
    const main = readFileSync(join(root, "app/traveltrust/TravelTrustNetworkPageMain.tsx"), "utf8");
    expect(main).toContain("TravelTrustNetworkPageComposer");
    expect(main).not.toContain("TravelTrustCinematicHero");
  });

  it("composer is thin orchestrator; chrome and body are split", () => {
    const modDir = dirname(fileURLToPath(import.meta.url));
    const composer = readFileSync(join(modDir, "presentation/TravelTrustNetworkPageComposer.tsx"), "utf8");
    const mainColumn = readFileSync(join(modDir, "presentation/TravelTrustHomeMainColumn.tsx"), "utf8");
    const body = readFileSync(join(modDir, "presentation/TravelTrustHomeBodyModule.tsx"), "utf8");
    expect(composer).toContain("useTraveltrustComposerPage");
    expect(composer).toContain("TravelTrustHomeMainColumn");
    expect(composer).toContain("TravelTrustHomeComposerShell");
    expect(composer).not.toMatch(/dynamic\s*\(/);
    expect(composer.split("\n").length).toBeLessThan(65);
    expect(mainColumn).toContain("TravelTrustLockedHomeChrome");
    expect(mainColumn).toContain("TravelTrustHomeBodyModule");
    expect(mainColumn).toContain('data-tt-traveltrust-home-composer="1"');
    expect(body).toContain("TravelTrustHomeHeroSection");
    expect(body).toContain("TravelTrustHomeBelowFoldSection");
    const backdrop = readFileSync(join(modDir, "presentation/TravelTrustHomeUnified3DBackdrop.tsx"), "utf8");
    expect(backdrop).toContain("TravelTrustHomeWebGLLayer");
    const dynamics = readFileSync(join(modDir, "presentation/TravelTrustHomeComposerDynamics.tsx"), "utf8");
    expect(dynamics).toContain("TravelTrustLandingChrome");
    const hook = readFileSync(join(modDir, "hooks/useTraveltrustComposerPage.ts"), "utf8");
    expect(hook).toContain("initTraveltrustCinematicQualityPrefs");
    expect(hook).toContain("prefetchRoleVideos");
  });

  it("L5 tokens are split under lib/traveltrust/l5", () => {
    const monolith = readFileSync(join(root, "lib/traveltrustCinematicNonGlobeL5.ts"), "utf8");
    expect(monolith).toContain('export * from "./traveltrust/l5/hero-ui"');
    expect(monolith.split("\n").length).toBeLessThan(30);
    expect(readFileSync(join(root, "lib/traveltrust/l5/rhythm.ts"), "utf8")).toContain(
      "TT_PAGE_VERTICAL_RHYTHM_L5",
    );
    const facade = readFileSync(join(root, "lib/traveltrust/l5/index.ts"), "utf8");
    expect(facade).toContain('export * from "./theater"');
    expect(facade).toContain('export * from "./economy"');
  });

  it("PageCinematicScene is orchestrator-only; globe rig lives in page-scene", () => {
    const scene = readFileSync(
      join(root, "components/traveltrust/cinematic/TravelTrustPageCinematicScene.tsx"),
      "utf8",
    );
    const rig = readFileSync(
      join(root, "components/traveltrust/cinematic/page-scene/PageHeroGlobeRig.tsx"),
      "utf8",
    );
    expect(scene).toContain("./page-scene");
    expect(scene).toContain("PageHeroGlobeRig");
    expect(scene.split("function ").length).toBeLessThan(4);
    expect(rig).toContain("resolveHeroGlobeEntranceScaleMul");
    expect(rig).toContain("mountAtMs");
  });

  it("L5 resolvers and hero-canvas are domain-split", () => {
    expect(readFileSync(join(root, "lib/traveltrust/l5/resolvers.ts"), "utf8")).toContain(
      "resolveNonGlobeEnvironmentVisible",
    );
    expect(readFileSync(join(root, "lib/traveltrust/l5/hero-canvas.ts"), "utf8")).toContain(
      "buildWarmPageCinematicCanvasOverlayLayers",
    );
    const facade = readFileSync(join(root, "lib/traveltrust/l5/index.ts"), "utf8");
    expect(facade).toContain('export * from "./resolvers"');
    expect(facade).toContain('export * from "./hero-canvas"');
  });

  it("cinematic layer imports L5 from lib/traveltrust/l5 not legacy facade path", () => {
    const offenders: string[] = [];
    const scanDirs = [cinematicDir, join(cinematicDir, "page-scene")];
    for (const dir of scanDirs) {
      for (const file of readdirSync(dir).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))) {
        const src = readFileSync(join(dir, file), "utf8");
        if (src.includes('from "@/lib/traveltrustCinematicNonGlobeL5"')) {
          offenders.push(file);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("home module imports cinematic only via lib cinematic-bridge", () => {
    const cinematicOffenders: string[] = [];
    const bridgeOffenders: string[] = [];
    for (const abs of listHomeModuleSources(modDir)) {
      const rel = abs.replace(modDir, "").replace(/\\/g, "/");
      const src = readFileSync(abs, "utf8");
      if (src.includes("@/components/traveltrust/cinematic")) {
        cinematicOffenders.push(rel);
      }
      if (src.includes("../cinematic-bridge") || src.includes('from "./cinematic-bridge"')) {
        bridgeOffenders.push(rel);
      }
      if (src.includes("cinematic-bridge") && !src.includes(BRIDGE_IMPORT)) {
        bridgeOffenders.push(`${rel} (non-canonical bridge import)`);
      }
    }
    expect(cinematicOffenders).toEqual([]);
    expect(bridgeOffenders).toEqual([]);
    expect(readdirSync(bridgeDir).length).toBeGreaterThan(3);
    expect(existsSync(join(modDir, "cinematic-bridge"))).toBe(false);
    const composer = readFileSync(
      join(modDir, "presentation/TravelTrustNetworkPageComposer.tsx"),
      "utf8",
    );
    expect(composer).not.toContain("cinematic-bridge");
    expect(existsSync(join(root, "lib/traveltrust/home/BelowFoldSectionsShell.tsx"))).toBe(true);
  });

  it("below-fold uses per-section module wrappers", () => {
    const below = readFileSync(
      join(root, "modules/traveltrust-home/sections/TravelTrustHomeBelowFoldSection.tsx"),
      "utf8",
    );
    expect(below).toContain("TravelTrustHomeRolesSection");
    expect(below).toContain("TravelTrustHomeEconomyClusterSection");
    expect(below).not.toContain("import(\"@/components/traveltrust/cinematic/TravelTrustBelowFoldSections\")");
    const registry = readFileSync(join(root, "modules/traveltrust-home/sections/registry.ts"), "utf8");
    expect(registry).toContain("TRAVELTRUST_HOME_SECTION_CHUNK_LOADERS");
  });
});
