import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

/** FIN-02 · ① 模块状态标签（非 ② 页内深度）。 */
describe("admin finance suite L5 (①)", () => {
  const pageMain = readFileSync(join(__dir, "AdminFinanceSuitePageMain.tsx"), "utf8");
  const badge = readFileSync(join(__dir, "AdminFinanceSuiteModuleStatusBadge.tsx"), "utf8");
  const adminUi = readFileSync(join(__dir, "..", "..", "..", "lib", "adminUi.ts"), "utf8");

  it("exposes phase-01 finance workflow strip with honest partial links", () => {
    const workflow = readFileSync(
      join(__dir, "..", "..", "..", "components", "admin", "AdminFinanceWorkflowStrip.tsx"),
      "utf8",
    );
    const pspNotice = readFileSync(
      join(__dir, "..", "..", "..", "components", "admin", "AdminFinancePspPhase2DepthNotice.tsx"),
      "utf8",
    );
    expect(pageMain).toContain("AdminFinanceWorkflowStrip");
    expect(pageMain).toContain("AdminFinanceSuiteSupplementStrip");
    expect(pageMain).toContain("AdminFinancePspPhase2DepthNotice");
    expect(pageMain).toContain("AdminFinanceSuiteHubDepthSection");
    expect(
      readFileSync(
        join(__dir, "..", "..", "..", "components", "admin", "AdminFinanceSuiteHubDepthSection.tsx"),
        "utf8",
      ),
    ).toContain("data-tt-admin-fin-suite-hub-depth");
    expect(pspNotice).toContain("data-tt-admin-fin-psp-phase2-notice");
    const workflowModel = readFileSync(
      join(__dir, "..", "..", "..", "lib", "admin", "adminFinanceWorkflowModel.ts"),
      "utf8",
    );
    expect(workflow).toContain("data-tt-admin-fin-workflow");
    expect(workflow).toContain("useAdminFinanceWorkflowSnapshots");
    expect(workflowModel).toContain("adminFinancePartialDepthHref");
    const partialHref = readFileSync(
      join(__dir, "..", "..", "..", "lib", "admin", "adminFinancePartialDepthHref.ts"),
      "utf8",
    );
    expect(partialHref).toContain('fin_suite_depth: "partial"');
    expect(workflowModel).toContain("admin_fin_workflow_audit");
    expect(workflow).toContain("data-tt-admin-fin-workflow-step");
  });

  it("uses localized module status badges not raw status strings", () => {
    expect(pageMain).toContain("AdminFinanceSuiteModuleStatusBadge");
    expect(pageMain).toContain("admin_fin_suite_partial_hint");
    expect(pageMain).toContain("admin_fin_suite_open_partial");
    expect(pageMain).toContain("adminFinancePartialDepthHref");
    expect(pageMain).toContain("AdminPermissionDeniedBanner");
    expect(readFileSync(join(__dir, "adminFinanceSuitePageModel.ts"), "utf8")).toContain('status: "partial"');
    expect(readFileSync(join(__dir, "adminFinanceSuitePageModel.ts"), "utf8")).toContain('"fee-router"');
    expect(readFileSync(join(__dir, "adminFinanceSuitePageModel.ts"), "utf8")).toContain('"audit"');
    expect(badge).toContain("admin_fin_suite_status_");
    expect(badge).toContain("data-tt-admin-fin-suite-status-badge");
  });

  it("defines finance suite status token classes", () => {
    expect(adminUi).toContain("ADMIN_FIN_SUITE_STATUS_ACTIVE_CLASS");
    expect(adminUi).toContain("ADMIN_FIN_SUITE_STATUS_PARTIAL_CLASS");
    expect(adminUi).toContain("ADMIN_FIN_DEPTH_PANEL_CLASS");
  });
});
