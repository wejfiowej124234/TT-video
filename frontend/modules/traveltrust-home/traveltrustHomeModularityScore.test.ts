import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { TRAVELTRUST_HOME_LAYOUT_LOCK_L5 } from "@/lib/traveltrustHomeLayoutLockL5";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const mod = dirname(fileURLToPath(import.meta.url));
const cinematic = join(root, "components/traveltrust/cinematic");
const l5 = join(root, "lib/traveltrust/l5");

/** 16 维企业模块化满分门禁（每维 1 分 · 全绿 = 16/16） */
const DIMENSIONS = [
  {
    id: "entry-bridge",
    label: "入口闸与 cinematic 依赖反转",
    score: () => {
      const bridge = readFileSync(join(root, "lib/traveltrust/home/index.ts"), "utf8");
      expect(bridge).toContain("HomeEntryBridgeProvider");
      const hero = readFileSync(join(cinematic, "TravelTrustCinematicHero.tsx"), "utf8");
      expect(hero).not.toContain("@/modules/traveltrust-home");
      expect(existsSync(join(root, "lib/traveltrust/home/cinematic-bridge/index.ts"))).toBe(true);
      expect(existsSync(join(mod, "cinematic-bridge"))).toBe(false);
      const heroSection = readFileSync(join(mod, "sections/TravelTrustHomeHeroSection.tsx"), "utf8");
      expect(heroSection).toContain("@/lib/traveltrust/home/cinematic-bridge");
      expect(heroSection).not.toContain("../cinematic-bridge");
      const composer = readFileSync(join(mod, "presentation/TravelTrustNetworkPageComposer.tsx"), "utf8");
      expect(composer).not.toContain("@/components/traveltrust/cinematic");
    },
  },
  {
    id: "route-thin",
    label: "app 路由薄层 → Composer",
    score: () => {
      const main = readFileSync(join(root, "app/traveltrust/TravelTrustNetworkPageMain.tsx"), "utf8");
      expect(main).toContain("TravelTrustNetworkPageComposer");
      expect(main.split("\n").length).toBeLessThan(12);
    },
  },
  {
    id: "section-boundaries",
    label: "Hero / WebGL / BelowFold 三节边界",
    score: () => {
      const mainColumn = readFileSync(join(mod, "presentation/TravelTrustHomeMainColumn.tsx"), "utf8");
      const backdrop = readFileSync(join(mod, "presentation/TravelTrustHomeUnified3DBackdrop.tsx"), "utf8");
      expect(mainColumn).toContain("TravelTrustHomeHeroSection");
      expect(mainColumn).toContain("TravelTrustHomeBelowFoldSection");
      expect(mainColumn).toContain('data-tt-traveltrust-home-composer="1"');
      expect(backdrop).toContain("TravelTrustHomeWebGLLayer");
    },
  },
  {
    id: "l5-domains",
    label: "L5 按域拆分 + 门面",
    score: () => {
      const lock = TRAVELTRUST_HOME_LAYOUT_LOCK_L5.modularity.l5Domains;
      for (const domain of lock) {
        expect(existsSync(join(l5, `${domain}.ts`)), domain).toBe(true);
      }
      const facade = readFileSync(join(l5, "index.ts"), "utf8");
      expect(facade).toContain('export * from "./resolvers"');
      expect(facade).toContain('export * from "./hero-canvas"');
    },
  },
  {
    id: "page-scene",
    label: "PageCinematicScene 编排 + page-scene 子模块",
    score: () => {
      const scene = readFileSync(join(cinematic, "TravelTrustPageCinematicScene.tsx"), "utf8");
      expect(scene).toContain("./page-scene");
      expect(scene.split("function ").length).toBeLessThan(4);
      expect(existsSync(join(cinematic, "page-scene/PageHeroGlobeRig.tsx"))).toBe(true);
      expect(existsSync(join(cinematic, "page-scene/PageHeroGlobeWarmShell.tsx"))).toBe(true);
    },
  },
  {
    id: "l5-resolvers",
    label: "resolver / hero-canvas 独立域",
    score: () => {
      expect(readFileSync(join(l5, "resolvers.ts"), "utf8")).toContain("resolveNonGlobeCanvasCyanMul");
      expect(readFileSync(join(l5, "hero-canvas.ts"), "utf8")).toContain("buildWarmPageCinematicCanvasOverlayLayers");
      const monolith = readFileSync(join(root, "lib/traveltrustCinematicNonGlobeL5.ts"), "utf8");
      expect(monolith).toContain('export * from "./traveltrust/l5/resolvers"');
      expect(monolith).toContain('export * from "./traveltrust/l5/hero-canvas"');
    },
  },
  {
    id: "section-registry",
    label: "节顺序与 layout lock 一致",
    score: () => {
      const registry = readFileSync(join(mod, "sections/registry.ts"), "utf8");
      expect(registry).toContain("TRAVELTRUST_HOME_SECTION_ORDER");
      expect(registry).toContain("TRAVELTRUST_HOME_SECTION_CHUNK_LOADERS");
      expect(registry).toContain("TRAVELTRUST_HOME_LAYOUT_LOCK_L5");
      for (const id of TRAVELTRUST_HOME_LAYOUT_LOCK_L5.sectionOrder) {
        if (id === "hero") continue;
        expect(registry).toContain(`${id}:`);
      }
      expect(registry).toContain("TRAVELTRUST_HOME_CRITICAL_CHUNK_LOADERS");
    },
  },
  {
    id: "per-section-wrappers",
    label: "Below-fold 每节独立 dynamic 边界",
    score: () => {
      const lock = TRAVELTRUST_HOME_LAYOUT_LOCK_L5.modularity.sectionWrappers;
      for (const name of lock) {
        expect(existsSync(join(mod, "sections", `${name}.tsx`)), name).toBe(true);
      }
      const below = readFileSync(join(mod, "sections/TravelTrustHomeBelowFoldSection.tsx"), "utf8");
      expect(below).toContain("TravelTrustHomeRolesSection");
      expect(below).toContain("TravelTrustHomeEconomyClusterSection");
      expect(below).not.toContain("TravelTrustBelowFoldSections");
    },
  },
  {
    id: "layout-lock-v3",
    label: "布局锁 v3-modular 元数据",
    score: () => {
      expect(TRAVELTRUST_HOME_LAYOUT_LOCK_L5.lockId).toBe(
        "TT-TRAVELTRUST-HOME-LAYOUT-LOCK-2026-08-v16-economy-breathing",
      );
      expect(TRAVELTRUST_HOME_LAYOUT_LOCK_L5.modularity.cinematicBridgeImport).toBe(
        "@/lib/traveltrust/home/cinematic-bridge",
      );
      expect(TRAVELTRUST_HOME_LAYOUT_LOCK_L5.modularity.cinematicMustNotImportHomeModule).toBe(true);
      expect(TRAVELTRUST_HOME_LAYOUT_LOCK_L5.modularity.pageScenePath).toContain("page-scene");
    },
  },
  {
    id: "monolith-facade",
    label: "L5 单体文件为门面（<30 行）",
    score: () => {
      const lines = readFileSync(join(root, "lib/traveltrustCinematicNonGlobeL5.ts"), "utf8").split("\n").length;
      expect(lines).toBeLessThan(30);
      const domains = [
        "meta.ts",
        "rhythm.ts",
        "sections-layout.ts",
        "atmosphere.ts",
        "hero-ui.ts",
        "theater.ts",
        "landing-chrome.ts",
        "start.ts",
        "economy.ts",
        "footer.ts",
        "shell-legacy.ts",
        "resolvers.ts",
        "hero-canvas.ts",
        "anchors.ts",
      ];
      const domainLines = domains.reduce((n, f) => n + readFileSync(join(l5, f), "utf8").split("\n").length, 0);
      expect(domainLines).toBeGreaterThan(1200);
    },
  },
  {
    id: "globe-entrance",
    label: "地球每次进入 entrance 动画",
    score: () => {
      const rig = readFileSync(join(cinematic, "page-scene/PageHeroGlobeRig.tsx"), "utf8");
      expect(rig).toContain("resolveHeroGlobeEntranceScaleMul");
      expect(rig).toContain("mountAtMs");
      expect(rig).toContain("TRAVELTRUST_HERO_GLOBE_ENTRANCE_DURATION_SEC");
    },
  },
  {
    id: "below-fold-shell-ssot",
    label: "Below-fold 外壳 SSOT（module + cinematic 共用）",
    score: () => {
      const shell = join(root, "lib/traveltrust/home/BelowFoldSectionsShell.tsx");
      expect(existsSync(shell)).toBe(true);
      const moduleBelow = readFileSync(join(mod, "sections/TravelTrustHomeBelowFoldSection.tsx"), "utf8");
      const cinematicBelow = readFileSync(
        join(cinematic, "TravelTrustBelowFoldSections.tsx"),
        "utf8",
      );
      expect(moduleBelow).toContain("TravelTrustHomeBelowFoldShell");
      expect(cinematicBelow).toContain("TravelTrustHomeBelowFoldShell");
    },
  },
  {
    id: "visual-qa-code-evidence",
    label: "目视 QA 清单 ↔ 代码锚点全覆盖",
    score: () => {
      expect(existsSync(join(root, "lib/traveltrust/home/visualQaEvidence.ts"))).toBe(true);
      const checklist = readFileSync(join(root, "lib/traveltrust/home/visualQaChecklist.ts"), "utf8");
      expect(checklist).toContain("globe-entrance");
      expect(checklist).toContain("grouped-footer");
    },
  },
  {
    id: "section-marker-ssot",
    label: "节边界 DOM 标记与 layout lock 一致",
    score: () => {
      const markers = readFileSync(join(root, "lib/traveltrust/home/sectionMarkers.ts"), "utf8");
      expect(markers).toContain("TRAVELTRUST_HOME_SECTION_IDS");
      for (const id of TRAVELTRUST_HOME_LAYOUT_LOCK_L5.sectionOrder) {
        if (id === "hero") continue;
        const sectionFile = join(mod, "sections", `TravelTrustHome${id.charAt(0).toUpperCase()}${id.slice(1)}Section.tsx`);
        const altNames: Record<string, string> = {
          roles: "TravelTrustHomeRolesSection.tsx",
          liquidity: "TravelTrustHomeLiquiditySection.tsx",
          unlock: "TravelTrustHomeUnlockSection.tsx",
          trust: "TravelTrustHomeTrustSection.tsx",
          settlement: "TravelTrustHomeSettlementSection.tsx",
          faq: "TravelTrustHomeFaqSection.tsx",
          start: "TravelTrustHomeStartCloseSection.tsx",
        };
        const file = join(mod, "sections", altNames[id] ?? sectionFile);
        const src = readFileSync(file, "utf8");
        expect(
          src.includes(`data-tt-traveltrust-home-section="${id}"`) ||
            src.includes("TravelTrustHomeSectionSlot"),
        ).toBe(true);
      }
    },
  },
  {
    id: "below-fold-narrative-ssot",
    label: "Below-fold 叙事节拍 SSOT + 对拍",
    score: () => {
      expect(existsSync(join(root, "lib/traveltrust/home/belowFoldNarrativeBeats.ts"))).toBe(true);
      expect(
        readFileSync(join(root, "lib/traveltrust/home/belowFoldNarrativeBeats.ts"), "utf8"),
      ).toContain("TRAVELTRUST_HOME_BELOW_FOLD_NARRATIVE_BEATS");
    },
  },
  {
    id: "section-ui-slot",
    label: "节 UI 槽位（sections/ui · P3 起步）",
    score: () => {
      const slot = join(mod, "sections/ui/TravelTrustHomeSectionSlot.tsx");
      expect(existsSync(slot)).toBe(true);
      for (const id of ["roles", "liquidity", "unlock", "trust", "settlement", "faq"] as const) {
        const names: Record<string, string> = {
          roles: "TravelTrustHomeRolesSection.tsx",
          liquidity: "TravelTrustHomeLiquiditySection.tsx",
          unlock: "TravelTrustHomeUnlockSection.tsx",
          trust: "TravelTrustHomeTrustSection.tsx",
          settlement: "TravelTrustHomeSettlementSection.tsx",
          faq: "TravelTrustHomeFaqSection.tsx",
        };
        expect(readFileSync(join(mod, "sections", names[id]), "utf8")).toContain(
          "TravelTrustHomeSectionSlot",
        );
      }
    },
  },
] as const;

describe("traveltrust-home modularity score (16/16)", () => {
  const scores: Record<string, boolean> = {};

  for (const dim of DIMENSIONS) {
    it(`[${dim.id}] ${dim.label}`, () => {
      dim.score();
      scores[dim.id] = true;
    });
  }

  it("aggregate score is 16/16", () => {
    const passed = DIMENSIONS.filter((d) => scores[d.id]).length;
    expect(passed).toBe(16);
  });
});
