import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const componentsAdmin = join(fe, "components", "admin");

/** ① 第十八批 UX · onboarding 列表 L5 / finance depth SSOT / 补充区 widget。 */
describe("admin batch18 UX L5 (①)", () => {
  const adminUi = readFileSync(join(fe, "lib", "adminUi.ts"), "utf8");
  const onboarding = readFileSync(join(componentsAdmin, "AdminOnboardingListPage.tsx"), "utf8");
  const workspace = readFileSync(join(componentsAdmin, "AdminFinanceModuleDepthWorkspace.tsx"), "utf8");
  const supplement = readFileSync(join(componentsAdmin, "AdminFinanceSuiteSupplementStrip.tsx"), "utf8");
  const settlement = readFileSync(join(componentsAdmin, "AdminFinanceSettlementDepthPanel.tsx"), "utf8");

  it("defines finance depth panel token SSOT", () => {
    expect(adminUi).toContain("ADMIN_FIN_DEPTH_PANEL_CLASS");
    expect(adminUi).toMatch(/ADMIN_FIN_DEPTH_PANEL_CLASS[\s\S]*ADMIN_WARM_L5_FRAME_CLASS/);
  });

  it("onboarding list uses warm L5 header + body canvas + table tokens", () => {
    expect(onboarding).toContain("AdminWarmL5Surface");
    expect(onboarding).toContain("ADMIN_LIST_PAGE_BODY_CANVAS_CLASS");
    expect(onboarding).toContain("data-tt-admin-onboarding-list-body-canvas");
    expect(onboarding).toContain("ADMIN_TABLE_SECTION_CLASS");
    expect(onboarding).toContain("ADMIN_TABLE_THEAD_CLASS");
    expect(onboarding).toContain("ADMIN_EMPTY_NEXT_ONBOARDING_LIST_EMPTY");
  });

  it("finance depth workspace wraps module panels", () => {
    expect(workspace).toContain("data-tt-admin-fin-depth-workspace");
    expect(workspace).toContain("data-tt-admin-fin-depth-module");
  });

  it("depth panels and supplement strip use warm L5 surfaces", () => {
    expect(settlement).toContain("AdminWarmL5Surface");
    expect(settlement).toContain("data-tt-admin-fin-depth-panel");
    expect(supplement).toContain("ADMIN_WARM_L5_FRAME_CLASS");
    expect(supplement).not.toContain("border-dashed");
    expect(supplement).toContain("data-tt-admin-fin-suite-supplement-fold");
    expect(supplement).toContain("admin_fin_suite_supplement_fold_summary");
  });
});
