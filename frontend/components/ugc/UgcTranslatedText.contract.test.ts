import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("UgcTranslatedText", () => {
  it("supports cache_first and on_demand without calling Admin catalog translation", () => {
    const src = readFileSync(join(ROOT, "components/ugc/UgcTranslatedText.tsx"), "utf8");
    expect(src).toContain('policy: UgcTranslatePolicy');
    expect(src).toContain("cache_first");
    expect(src).toContain("on_demand");
    expect(src).toContain("postUgcTranslate");
    expect(src).toContain("getUgcTranslationCache");
    expect(src).toContain("getUgcTranslationStatus");
    expect(src).toContain("enabled !== true");
    expect(src).toContain("showAction && Boolean(source.trim()) && !showTranslated");
    expect(src).toContain("showAction");
    expect(src).toContain("actionSurface");
    expect(src).toContain("text-ref-sun/90");
    expect(src).not.toContain("postAdminContentTranslation");
  });

  it("wires cache_first on market listing/guide/order details (UUID path)", () => {
    const files = [
      "components/market/MerchantShowcaseDetailView.tsx",
      "components/market/MerchantShowcaseDetailBody.tsx",
      "components/market/AcquisitionListingDetailView.tsx",
      "components/market/AcquisitionListingDetailBody.tsx",
      "components/market/MarketSubsiteListingDetailDrawer.tsx",
      "components/market/GuideDetailDrawer.tsx",
      "components/market/GuideDetailDrawerDetailPanel.tsx",
      "components/market/OrderDetailDrawer.tsx",
    ];
    for (const rel of files) {
      const src = readFileSync(join(ROOT, rel), "utf8");
      expect(src, rel).toContain("UgcTranslatedText");
      expect(src, rel).toContain('policy="cache_first"');
    }
  });
});
