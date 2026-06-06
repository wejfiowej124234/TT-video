import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const repoRoot = join(__dir, "..", "..", "..");

/** ① 第五十二批 UX · 可观测子域相关折叠 + 评价/向导详情 related fold。 */
describe("admin batch52 UX L5 (①)", () => {
  it("run-admin-l5-green includes batch52 contract", () => {
    const green = readFileSync(join(repoRoot, "scripts/dev/run-admin-l5-green.sh"), "utf8");
    expect(green).toContain("lib/admin/adminBatch52UxL5.contract.test.ts");
  });

  it("observability peer fold SSOT shared by hub nav and subpages", () => {
    const model = readFileSync(join(fe, "lib/admin/adminObservabilityRelatedFoldLinks.ts"), "utf8");
    const hubNav = readFileSync(join(fe, "components/admin/AdminObservabilityHubRelatedNav.tsx"), "utf8");
    expect(model).toContain("observabilityPeerRelatedFoldLinks");
    expect(hubNav).toContain("OBSERVABILITY_PEER_RELATED_FOLD_LINKS");
    for (const rel of [
      "app/admin/schema/AdminSchemaPageMain.tsx",
      "app/admin/trust-growth/AdminTrustGrowthPageMain.tsx",
      "app/admin/alerts/incidents/AdminAlertIncidentsHubPageMain.tsx",
    ]) {
      const src = readFileSync(join(fe, rel), "utf8");
      expect(src, rel).toContain("AdminOpsDetailRelatedFold");
      expect(src, rel).toContain("observabilityPeerRelatedFoldLinks");
    }
  });

  it("trust growth refresh moves from header to body", () => {
    const main = readFileSync(join(fe, "app/admin/trust-growth/AdminTrustGrowthPageMain.tsx"), "utf8");
    expect(main).toContain('data-tt-admin-trust-growth-refresh="1"');
    const headerMatch = main.match(/headerAside=\{([\s\S]*?)\}\s*\r?\n\s*>/);
    expect(headerMatch?.[1] ?? "").not.toContain("admin_trust_growth_refresh");
  });

  it("review and guide detail pages add related fold", () => {
    const review = readFileSync(join(fe, "app/admin/reviews/[id]/AdminReviewDetailPageMain.tsx"), "utf8");
    const guide = readFileSync(join(fe, "app/admin/guides/[id]/AdminGuideDetailPageMain.tsx"), "utf8");
    expect(review).toContain("REVIEW_DETAIL_RELATED_FOLD_LINKS");
    expect(guide).toContain("GUIDE_DETAIL_RELATED_FOLD_LINKS");
  });
});
