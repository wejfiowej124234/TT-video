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
    const hubIdx = pageMain.indexOf("<AdminFinanceSuiteHubDepthSection");
    const supplementIdx = pageMain.indexOf("<AdminFinanceSuiteSupplementStrip");
    expect(hubIdx).toBeGreaterThan(-1);
    expect(supplementIdx).toBeGreaterThan(hubIdx);
    expect(pageMain.indexOf("AdminFinancePspPhase2DepthNotice")).toBeLessThan(
      pageMain.indexOf("data-tt-admin-fin-suite-module-grid"),
    );
    expect(pageMain).not.toContain("headerAside={<AdminInboxQueueBackLinks />}");
    expect(pageMain).not.toContain("data-tt-admin-fin-suite-footer-nav");
    expect(
      readFileSync(
        join(__dir, "..", "..", "..", "components", "admin", "AdminFinanceSuiteHubDepthSection.tsx"),
        "utf8",
      ),
    ).toContain("data-tt-admin-fin-suite-hub-depth");
    expect(pspNotice).toContain("data-tt-admin-fin-psp-phase2-notice");
    expect(pspNotice).toContain("data-tt-admin-fin-phase-honesty-fold");
    expect(pageMain).toContain("data-tt-admin-fin-suite-module-grid");
    expect(pageMain).toContain("lg:grid-cols-4");
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
    const supplement = readFileSync(
      join(__dir, "..", "..", "..", "components", "admin", "AdminFinanceSuiteSupplementStrip.tsx"),
      "utf8",
    );
    const model = readFileSync(join(__dir, "adminFinanceSuitePageModel.ts"), "utf8");
    expect(supplement).toContain("data-tt-admin-fin-suite-supplement-fold");
    expect(supplement).toContain('data-tt-admin-fin-suite-supplement-default-open="0"');
    expect(supplement).toContain("xl:grid-cols-3");
    expect(model.match(/id: "indexer"/g)?.length).toBe(1);
    expect(model).toContain('id: "trust-growth"');
    expect(model).toContain('id: "alert-incidents"');
    expect(badge).toContain("admin_fin_suite_status_");
    expect(badge).toContain("data-tt-admin-fin-suite-status-badge");
  });

  it("defines finance suite status token classes", () => {
    expect(adminUi).toContain("ADMIN_FIN_SUITE_STATUS_ACTIVE_CLASS");
    expect(adminUi).toContain("ADMIN_FIN_SUITE_STATUS_PARTIAL_CLASS");
    expect(adminUi).toContain("ADMIN_FIN_DEPTH_PANEL_CLASS");
  });
});
