/**
 * 五主路由 · Site Theme V1 统一闸（① 本地）
 * 真源：现行 `app/*` + `modules/traveltrust-home` + `lib/marketingUi.ts`
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

const FIVE_MAIN_MARKETING_PATHS = [
  "app/(home)/page.tsx",
  "components/landing/LandingHeroForm.tsx",
  "modules/traveltrust-home/presentation/TravelTrustHomeMainColumn.tsx",
  "app/market/page.tsx",
  "app/market/MarketPageClient.tsx",
  "components/market/MarketContent.tsx",
  "app/did-rank/DidRankPageInner.tsx",
  "components/community/CommunityRouteShellInner.tsx",
  "lib/marketingUi.ts",
  "components/traveltrust/cinematic/traveltrustHeroUi.ts",
] as const;

describe("fiveMainRoutesThemeUnification (Site Theme V1 · ①)", () => {
  it("does not keep legacy lib/traveltrustHeroUi.ts duplicate", () => {
    expect(existsSync(join(root, "lib/traveltrustHeroUi.ts"))).toBe(false);
  });

  it("marketingUi exports no bg-cta-gradient in token bodies", () => {
    const ui = read("lib/marketingUi.ts");
    const exportBodies = ui.split(/^export const /m).slice(1);
    for (const block of exportBodies) {
      expect(block).not.toContain("bg-cta-gradient");
    }
  });

  it("TT_MARKETING_BTN_PRIMARY_TRUST aliases warm Action family", () => {
    const ui = read("lib/marketingUi.ts");
    expect(ui).toContain("export const TT_MARKETING_BTN_PRIMARY_TRUST = TT_MARKETING_BTN_PRIMARY_WARM");
  });

  it("traveltrust hero ui re-exports warm hero primary, not legacy trust gradient", () => {
    const heroUi = read("components/traveltrust/cinematic/traveltrustHeroUi.ts");
    expect(heroUi).toContain("TT_MARKETING_BTN_PRIMARY_WARM_HERO as TT_HERO_BTN_PRIMARY");
    expect(heroUi).not.toContain("TT_MARKETING_BTN_PRIMARY_TRUST as TT_HERO_BTN_PRIMARY");
  });

  it("five main route marketing paths avoid bg-cta-gradient", () => {
    for (const rel of FIVE_MAIN_MARKETING_PATHS) {
      expect(read(rel)).not.toContain("bg-cta-gradient");
    }
  });

  it("MarketContent api error retry uses warm market pill", () => {
    const src = read("components/market/MarketContent.tsx");
    expect(src).toContain("TT_MARKETING_BTN_MARKET_PRIMARY_PILL");
    expect(src).not.toMatch(/apiError[\s\S]{0,800}btn-console/);
  });
});
