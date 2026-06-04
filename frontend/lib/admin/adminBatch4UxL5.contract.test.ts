import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const componentsAdmin = join(fe, "components", "admin");

/** ① 第四批 UX · FIN-02 深度 / IA-06 运营 Shell 预览 / 枢纽修复。 */
describe("admin batch4 UX L5 (①)", () => {
  it("finance partial depth href SSOT + hub depth uses model supplement modules", () => {
    const hrefLib = readFileSync(join(__dir, "adminFinancePartialDepthHref.ts"), "utf8");
    const model = readFileSync(
      join(fe, "app", "admin", "finance-suite", "adminFinanceSuitePageModel.ts"),
      "utf8",
    );
    const hub = readFileSync(join(componentsAdmin, "AdminFinanceSuiteHubDepthSection.tsx"), "utf8");
    expect(hrefLib).toContain("fin_suite_depth");
    expect(hrefLib).toContain("fin_suite_module");
    expect(model).toContain("FINANCE_SUITE_SUPPLEMENT_MODULES");
    expect(hub).toContain("adminFinancePartialDepthHref");
    expect(hub).toContain("FINANCE_SUITE_SUPPLEMENT_MODULES");
    expect(hub).toContain("useAdminCapabilities");
  });

  it("depth panels expose honesty footer and module fallback", () => {
    const footer = readFileSync(join(componentsAdmin, "AdminFinanceDepthHonestyFooter.tsx"), "utf8");
    const fallback = readFileSync(join(componentsAdmin, "AdminFinanceDepthModuleFallback.tsx"), "utf8");
    const workspace = readFileSync(join(componentsAdmin, "AdminFinanceModuleDepthWorkspace.tsx"), "utf8");
    const settlement = readFileSync(join(componentsAdmin, "AdminFinanceSettlementDepthPanel.tsx"), "utf8");
    expect(footer).toContain("data-tt-admin-fin-depth-honesty-footer");
    expect(fallback).toContain("data-tt-admin-fin-depth-module-fallback");
    expect(workspace).toContain("AdminFinanceDepthModuleFallback");
    expect(settlement).toContain("AdminFinanceDepthActionLinks");
    expect(settlement).toContain("adminFinancePartialDepthHref");
  });

  it("shell perspective switcher available to operators with honesty attrs", () => {
    const bar = readFileSync(join(componentsAdmin, "AdminShellBar.tsx"), "utf8");
    const switcher = readFileSync(join(componentsAdmin, "AdminShellBarRolePerspectiveSwitcher.tsx"), "utf8");
    expect(bar).toContain("showRolePerspectiveSwitcher");
    expect(bar).toContain("data-tt-admin-shell-role-perspective-operator");
    expect(switcher).toContain("admin_shell_role_perspective_switcher_visible");
  });

  it("home shell preview banner and ops guide preview CTA", () => {
    const banner = readFileSync(join(componentsAdmin, "AdminHomeShellPreviewBanner.tsx"), "utf8");
    const home = readFileSync(join(componentsAdmin, "AdminHomeClient.tsx"), "utf8");
    const maintainer = readFileSync(join(componentsAdmin, "AdminHomeMaintainerFold.tsx"), "utf8");
    const guide = readFileSync(join(componentsAdmin, "AdminHomeOpsRoleGuide.tsx"), "utf8");
    expect(banner).toContain("data-tt-admin-home-shell-preview-banner");
    expect(home).toContain("ADMIN_HOME_CANVAS_CLASS");
    expect(home).not.toContain("AdminHomePinnedShortcuts");
    expect(home).not.toContain('variant="inline"');
    expect(maintainer).toContain("AdminHomeOpsRoleGuide");
    expect(guide).toContain("data-tt-admin-home-ops-shell-preview");
  });
});
