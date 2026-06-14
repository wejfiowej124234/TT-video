import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const feRoot = join(__dirname, "../..");
const repoRoot = join(__dirname, "../../..");

function readFe(rel: string) {
  return readFileSync(join(feRoot, rel), "utf8");
}

function readRepo(rel: string) {
  return readFileSync(join(repoRoot, rel), "utf8");
}

describe("L5 Product Excellence contract (162)", () => {
  it("user journey SSOT + PES RUJR", () => {
    expect(readFe("lib/pesJourneyReviewModel.ts")).toContain("PES_PERSONA_JOURNEYS");
    expect(readFe("e2e/pes-real-user-journey-review.spec.ts")).toContain("pesJourneyReviewModel");
    expect(readRepo("evidence/l5_product_excellence/journey_manifest.v1.json")).toContain('"traveler"');
    expect(readRepo("evidence/l5_product_excellence/journey_manifest.v1.json")).toContain('"admin"');
  });

  it("information architecture nav SSOT", () => {
    expect(readFe("lib/admin/adminShellSidebarModel.ts")).toContain("ADMIN_SHELL_SIDEBAR_GROUPS");
    expect(readFe("lib/me/meSettingsNavModel.ts")).toContain("MeSettingsNavSection");
    expect(readRepo("frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md")).toContain(
      "冻结",
    );
  });

  it("design system L5 tokens + state panels", () => {
    expect(readFe("lib/adminUi.ts")).toContain("ADMIN_SHELL_NAV_IDLE_CLASS");
    expect(readFe("components/admin/ops/OpsPlaneFetchStates.tsx")).toContain("OpsPlaneFetchStates");
    expect(readFe("components/me/MeSettingsL5FlowPage.tsx")).toContain("MeSettingsL5FlowPage");
  });

  it("conversion layer + auth return", () => {
    expect(readFe("components/product-enhancement/ConversionFunnelDashboard.tsx")).toContain(
      "data-tt-pes-funnel-dashboard",
    );
    expect(readFe("lib/usePesAnalytics.ts")).toContain("usePesTouchpointImpression");
    expect(readFe("lib/pesAuthReturnFlow.ts")).toContain("buildPesAuthHref");
    expect(readFe("lib/admin/adminShellMoreNavLinks.ts")).toContain("/admin/conversion-analytics");
  });

  it("mobile + accessibility markers", () => {
    expect(readFe("lib/admin/useAdminShellSidebarVisible.ts")).toContain("ADMIN_SHELL_SIDEBAR_LAYOUT_MEDIA");
    expect(readFe("lib/admin/adminBatch31UxL5.contract.test.ts")).toContain("data-tt-admin-shell-mobile-nav-fold");
    expect(readFe("lib/admin/adminTableA11y.contract.test.ts")).toContain('scope="col"');
    expect(readFe("components/consumer/ConsumerSurfaceStatePanel.tsx")).toContain("aria-label");
  });

  it("product excellence harness scripts", () => {
    for (const rel of [
      "scripts/dev/generate-l5-product-excellence-audit-matrix.py",
      "scripts/check-l5-product-excellence-execution.sh",
      "scripts/dev/l5-pe-user-journey-audit.sh",
      "scripts/dev/l5-pe-information-architecture-audit.sh",
      "scripts/dev/l5-pe-design-system-audit.sh",
      "scripts/dev/l5-pe-conversion-audit.sh",
      "scripts/dev/l5-pe-mobile-responsive-audit.sh",
      "scripts/dev/l5-pe-accessibility-audit.sh",
    ]) {
      expect(readRepo(rel).length).toBeGreaterThan(20);
    }
  });
});
