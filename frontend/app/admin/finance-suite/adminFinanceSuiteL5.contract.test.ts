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
    /** HU-273 · hub depth removed · module grid folded as secondary catalog */
    expect(pageMain).not.toContain("AdminFinanceSuiteHubDepthSection");
    expect(pageMain).toContain('data-tt-admin-fin-suite-module-catalog="1"');
    expect(pageMain.indexOf("AdminFinancePspPhase2DepthNotice")).toBeLessThan(
      pageMain.indexOf("data-tt-admin-fin-suite-module-grid"),
    );
    expect(pageMain).not.toContain("headerAside={<AdminInboxQueueBackLinks />}");
    expect(pageMain).not.toContain("data-tt-admin-fin-suite-footer-nav");
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
    // Batch-13 FP-C · FN2/FN5/FN6 · Batch-14 HU-571 merged secondary nav
    expect(pageMain).toContain('data-tt-admin-fin-suite-primary-nav="workflow"');
    expect(pageMain).toContain('data-tt-admin-fin-suite-nav-tiles-fold="1"');
    expect(pageMain).toContain('data-tt-admin-fin-suite-secondary-nav="merged"');
    expect(pageMain).toContain('data-tt-admin-fin-suite-treasury-fold="1"');
    expect(pageMain.indexOf('data-tt-admin-fin-suite-primary-nav="workflow"')).toBeLessThan(
      pageMain.indexOf('data-tt-admin-fin-suite-nav-tiles-fold="1"'),
    );
    expect(pageMain).not.toContain('data-tt-admin-fin-suite-secondary-nav="module-catalog"');
    expect(pageMain).not.toContain('data-tt-admin-fin-suite-secondary-nav="tiles"');
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
    expect(model).not.toContain('id: "indexer"');
    expect(model).not.toContain('id: "reconcile-reports"');
    expect(model).not.toContain('id: "observability"');
    expect(model).not.toContain('id: "trust-growth"');
    expect(model).not.toContain('id: "alert-incidents"');
    expect(model).toContain('id: "drift"');
    expect(model).toContain('id: "region-vault"');
    expect(model).toContain('id: "vacancy-ledger-ops"');
    expect(badge).toContain("adminTruthBadgeLabelKey");
    expect(badge).toContain("data-tt-admin-fin-suite-status-badge");
    expect(badge).toContain("data-tt-admin-truth-badge");
  });

  /** V65-PROD-003-B3-R032 · operator matrix 可用|部分|目标|暂未开放 · TARGET 不进主开 CTA */
  it("blocks TARGET modules from primary open CTAs (R032)", () => {
    expect(pageMain).toContain("admin_fin_suite_target_hint");
    expect(pageMain).toContain("admin_fin_suite_target_not_open");
    expect(pageMain).toContain('data-tt-admin-fin-suite-target={isTarget ? "1" : undefined}');
    expect(pageMain).toContain('isTarget ? "target" : hasPerm ? "not-open" : "no-perm"');
    expect(pageMain).toContain("!isTarget");
    expect(pageMain).toContain('(m.status === "active" || m.status === "partial")');
    expect(badge).toContain("targetSnapshotClaim");
    expect(badge).toContain('t("admin_fin_module_target_snapshot_claim")');
    const supplement = readFileSync(
      join(__dir, "..", "..", "..", "components", "admin", "AdminFinanceSuiteSupplementStrip.tsx"),
      "utf8",
    );
    expect(supplement).toContain('data-tt-admin-fin-suite-supplement-blocked="target"');
    expect(supplement).toContain("admin_fin_suite_target_not_open");
    const model = readFileSync(join(__dir, "adminFinanceSuitePageModel.ts"), "utf8");
    expect(model).toContain("targetSnapshotClaim: true");
    const zh = readFileSync(join(__dir, "..", "..", "..", "locales", "zh.ts"), "utf8");
    const en = readFileSync(join(__dir, "..", "..", "..", "locales", "en.ts"), "utf8");
    for (const src of [zh, en]) {
      expect(src).toContain("admin_fin_suite_status_active:");
      expect(src).toContain("admin_fin_suite_status_partial:");
      expect(src).toContain("admin_fin_suite_status_placeholder:");
      expect(src).toContain("admin_fin_suite_target_hint:");
      expect(src).toContain("admin_fin_suite_target_not_open:");
      expect(src).toContain("admin_truth_badge_REAL:");
      expect(src).toContain("admin_truth_badge_PARTIAL:");
      expect(src).toContain("admin_truth_badge_TOOL:");
    }
    expect(zh).toMatch(/admin_fin_suite_status_active:\s*"可用"/);
    expect(zh).toMatch(/admin_fin_suite_status_partial:\s*"部分可用"/);
    expect(zh).toMatch(/admin_fin_suite_status_placeholder:\s*"暂未开放"/);
    expect(zh).toMatch(/admin_fin_module_target_snapshot_claim:\s*"目标"/);
  });

  it("defines finance suite status token classes", () => {
    expect(adminUi).toContain("ADMIN_FIN_SUITE_STATUS_ACTIVE_CLASS");
    expect(adminUi).toContain("ADMIN_FIN_SUITE_STATUS_PARTIAL_CLASS");
    expect(adminUi).toContain("ADMIN_FIN_DEPTH_PANEL_CLASS");
  });
});
