import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const componentsAdmin = join(__dir, "..", "..", "components", "admin");
const repoRoot = join(__dir, "..", "..", "..");

/** 六项剩余 backlog · ① L5 代码级实现（②/③ 机读 GO 另闸）。 */
describe("admin remaining six L5 implementation (①)", () => {
  it("IA-06: DB-effective shell role drives nav groups", () => {
    const hook = readFileSync(join(__dir, "useAdminEffectiveShellRole.ts"), "utf8");
    const nav = readFileSync(join(componentsAdmin, "AdminShellNavGroup.tsx"), "utf8");
    const strip = readFileSync(join(componentsAdmin, "AdminConsoleRoleEffectiveStrip.tsx"), "utf8");
    expect(hook).toContain("shellFilterRole");
    expect(nav).toContain("useAdminEffectiveShellRole");
    expect(nav).toContain("data-tt-admin-shell-nav-filter-role");
    expect(strip).toContain("data-tt-admin-console-role-apply-db-shell");
  });

  it("ONB-04: webhook stripe echo extraction", () => {
    const lib = readFileSync(join(__dir, "adminOnboardingWebhookStripeEcho.ts"), "utf8");
    const notice = readFileSync(join(componentsAdmin, "AdminOnboardingStripePhase2Notice.tsx"), "utf8");
    expect(lib).toContain("extractWebhookStripeEcho");
    expect(notice).toContain("data-tt-admin-onboarding-webhook-stripe-echo");
  });

  it("FIN-02: partial module depth workspace panels", () => {
    const ws = readFileSync(join(componentsAdmin, "AdminFinanceModuleDepthWorkspace.tsx"), "utf8");
    expect(ws).toContain("AdminFinanceSettlementDepthPanel");
    expect(ws).toContain("AdminFinanceRefundsDepthPanel");
    expect(ws).toContain("AdminFinanceReconciliationDepthPanel");
    expect(ws).toContain("AdminFinanceCrossCheckDepthPanel");
    expect(ws).toContain("AdminFinanceFeeRouterDepthPanel");
    expect(ws).toContain("AdminFinanceAuditDepthPanel");
    expect(ws).toContain("AdminFinanceDriftDepthPanel");
    expect(ws).toContain("AdminFinanceRegionVaultDepthPanel");
    const settlement = readFileSync(join(componentsAdmin, "AdminFinanceSettlementDepthPanel.tsx"), "utf8");
    const refunds = readFileSync(join(componentsAdmin, "AdminFinanceRefundsDepthPanel.tsx"), "utf8");
    const reconciliation = readFileSync(join(componentsAdmin, "AdminFinanceReconciliationDepthPanel.tsx"), "utf8");
    const crossCheck = readFileSync(join(componentsAdmin, "AdminFinanceCrossCheckDepthPanel.tsx"), "utf8");
    const feeRouter = readFileSync(join(componentsAdmin, "AdminFinanceFeeRouterDepthPanel.tsx"), "utf8");
    const audit = readFileSync(join(componentsAdmin, "AdminFinanceAuditDepthPanel.tsx"), "utf8");
    const drift = readFileSync(join(componentsAdmin, "AdminFinanceDriftDepthPanel.tsx"), "utf8");
    const vault = readFileSync(join(componentsAdmin, "AdminFinanceRegionVaultDepthPanel.tsx"), "utf8");
    expect(settlement).toContain("data-tt-admin-fin-settlement-depth");
    expect(refunds).toContain("data-tt-admin-fin-refunds-depth");
    expect(reconciliation).toContain("data-tt-admin-fin-reconciliation-depth");
    expect(crossCheck).toContain("data-tt-admin-fin-cross-check-depth");
    expect(feeRouter).toContain("data-tt-admin-fin-fee-router-depth");
    expect(audit).toContain("data-tt-admin-fin-audit-depth");
    expect(drift).toContain("data-tt-admin-fin-drift-depth");
    expect(vault).toContain("data-tt-admin-fin-region-vault-depth");
  });

  it("IA-06: shell bar mounts perspective switcher for operators", () => {
    const bar = readFileSync(join(componentsAdmin, "AdminShellBar.tsx"), "utf8");
    const switcher = readFileSync(
      join(componentsAdmin, "AdminShellBarRolePerspectiveSwitcher.tsx"),
      "utf8",
    );
    expect(bar).toContain("AdminShellBarRolePerspectiveSwitcher");
    expect(bar).toContain("showRolePerspectiveSwitcher");
    expect(bar).toContain("data-tt-admin-shell-role-perspective-operator");
    expect(switcher).toContain("data-tt-admin-shell-role-perspective-switcher");
    expect(switcher).toContain("roleId !== dbRole");
  });

  it("ONB-04: payment-events stripe echo strip", () => {
    const list = readFileSync(join(componentsAdmin, "AdminOnboardingListPage.tsx"), "utf8");
    expect(list).toContain("AdminOnboardingPaymentEventsStripeEchoStrip");
    expect(
      readFileSync(join(componentsAdmin, "AdminOnboardingPaymentEventsStripeEchoStrip.tsx"), "utf8"),
    ).toContain("data-tt-admin-onboarding-payment-stripe-echo-strip");
  });

  it("ONB-04: onboarding hub dual ledger strip", () => {
    const hub = readFileSync(
      join(repoRoot, "frontend/app/admin/onboarding/AdminOnboardingHubPageMain.tsx"),
      "utf8",
    );
    expect(hub).toContain("useAdminOnboardingPaymentEventsStripeEcho");
    expect(hub).toContain("paymentEventsTotal");
    const notice = readFileSync(join(componentsAdmin, "AdminOnboardingStripePhase2Notice.tsx"), "utf8");
    expect(notice).toContain("data-tt-admin-onboarding-hub-payment-ledger");
    expect(notice).toContain("data-tt-admin-onboarding-hub-ledger-cards");
  });

  it("CI-02: local skeleton runner script", () => {
    expect(
      readFileSync(join(repoRoot, "scripts/dev/run-admin-phase2-prep-skeleton-local.sh"), "utf8"),
    ).toContain("TT_ADMIN_PHASE2_PREP_SKELETON_LOCAL");
  });

  it("RBAC-05: shell bar perspective e2e covers CS matrix", () => {
    expect(
      readFileSync(join(repoRoot, "frontend/e2e/admin-adm-u01-shell-local-prep.spec.ts"), "utf8"),
    ).toContain("all roles");
  });

  it("IA-06: permissions quick role chips", () => {
    const preview = readFileSync(
      join(repoRoot, "frontend/app/admin/permissions/AdminConsoleRoleShellPreview.tsx"),
      "utf8",
    );
    expect(preview).toContain("data-tt-admin-shell-preview-quick-roles");
  });

  it("CI-02: phase2 closure prep panel on permissions page", () => {
    const pageMain = readFileSync(
      join(repoRoot, "frontend/app/admin/permissions/AdminPermissionsPageMain.tsx"),
      "utf8",
    );
    const panel = readFileSync(join(componentsAdmin, "AdminPhase2ClosurePrepPanel.tsx"), "utf8");
    const stagingRecord = readFileSync(
      join(componentsAdmin, "AdminPhase2StagingRecordPanel.tsx"),
      "utf8",
    );
    const backlogPanel = readFileSync(
      join(componentsAdmin, "AdminPhase2RemainingBacklogPanel.tsx"),
      "utf8",
    );
    expect(pageMain).toContain("AdminPhase2ClosurePrepPanel");
    expect(pageMain).toContain("AdminPhase2StagingRecordPanel");
    expect(pageMain).toContain("AdminPhase2RemainingBacklogPanel");
    expect(panel).toContain("data-tt-admin-phase2-closure-prep-panel");
    expect(stagingRecord).toContain("ADMIN_PHASE2_STAGING_ONLY_COMMANDS");
    expect(stagingRecord).toContain("data-tt-admin-phase2-staging-record-cmd");
    expect(backlogPanel).toContain("data-tt-admin-phase2-remaining-backlog");
  });

  it("ONB-04: dual ledger nav strip on list pages", () => {
    const list = readFileSync(join(componentsAdmin, "AdminOnboardingListPage.tsx"), "utf8");
    const nav = readFileSync(join(componentsAdmin, "AdminOnboardingDualLedgerNavStrip.tsx"), "utf8");
    expect(list).toContain("AdminOnboardingDualLedgerNavStrip");
    expect(nav).toContain("data-tt-admin-onboarding-dual-ledger-nav");
    expect(nav).toContain("data-tt-admin-onboarding-dual-ledger-inbox");
  });

  it("FIN-02: finance suite supplement strip", () => {
    const suite = readFileSync(
      join(repoRoot, "frontend/app/admin/finance-suite/AdminFinanceSuitePageMain.tsx"),
      "utf8",
    );
    expect(suite).toContain("AdminFinanceSuiteSupplementStrip");
    expect(suite).toContain("AdminFinanceSuiteHubDepthSection");
    expect(
      readFileSync(join(componentsAdmin, "AdminFinanceSuiteHubDepthSection.tsx"), "utf8"),
    ).toContain("data-tt-admin-fin-suite-hub-depth");
    expect(suite).toContain("AdminFinancePspPhase2DepthNotice");
    expect(
      readFileSync(join(componentsAdmin, "AdminFinanceSuiteSupplementStrip.tsx"), "utf8"),
    ).toContain("data-tt-admin-fin-suite-supplement");
    expect(
      readFileSync(join(componentsAdmin, "AdminFinancePspPhase2DepthNotice.tsx"), "utf8"),
    ).toContain("data-tt-admin-fin-psp-phase2-notice");
  });

  it("RBAC-06: ADM-U02 permissions UI prep e2e exists", () => {
    expect(
      readFileSync(join(repoRoot, "frontend/e2e/admin-adm-u02-permissions-ui-local.spec.ts"), "utf8"),
    ).toContain("ADM_U02_UI_PREP");
    expect(
      readFileSync(join(repoRoot, "scripts/dev/run-admin-adm-u02-local-prep.sh"), "utf8"),
    ).toContain("ADM_U02_UI_PREP");
  });

  it("CI-02: home phase2 notice links remaining backlog", () => {
    expect(
      readFileSync(join(componentsAdmin, "AdminHomePhase2PrepNotice.tsx"), "utf8"),
    ).toContain("data-tt-admin-home-phase2-backlog-link");
    expect(
      readFileSync(join(componentsAdmin, "AdminHomePhase2PrepNotice.tsx"), "utf8"),
    ).toContain("admin-phase2-remaining-backlog");
  });

  it("RBAC-06: 2FA panel staging prep badge", () => {
    expect(
      readFileSync(
        join(repoRoot, "frontend/app/admin/permissions/AdminPermissions2faPolicyPanel.tsx"),
        "utf8",
      ),
    ).toContain("data-tt-admin-2fa-staging-prep");
  });

  it("IA-06: shell bar links to permissions console perspective", () => {
    const bar = readFileSync(join(componentsAdmin, "AdminShellBar.tsx"), "utf8");
    expect(bar).toContain("data-tt-admin-shell-role-perspective-link");
    expect(bar).toContain("admin-console-role-effective");
  });

  it("RBAC-05: local Playwright prep specs exist", () => {
    const shellPrep = readFileSync(join(repoRoot, "frontend/e2e/admin-adm-u01-shell-local-prep.spec.ts"), "utf8");
    const dbRolePrep = readFileSync(
      join(repoRoot, "frontend/e2e/admin-adm-u01-db-role-shell-local.spec.ts"),
      "utf8",
    );
    expect(shellPrep).toContain("ADM_U01_LOCAL_PREP");
    expect(shellPrep).toContain("all roles");
    expect(dbRolePrep).toContain("ADM_U01_DB_ROLE_PREP");
    expect(dbRolePrep).toContain("all six console roles");
    expect(dbRolePrep).toContain("playwright-db-role-shell-matrix.json");
  });

  it("RBAC-06: production safety panel + API direct_allowed flag", () => {
    const panel = readFileSync(join(componentsAdmin, "AdminPermissionsProductionSafetyPanel.tsx"), "utf8");
    const rbac = readFileSync(join(repoRoot, "crates/api/src/routes/admin/admin_rbac.rs"), "utf8");
    expect(panel).toContain("data-tt-admin-production-safety-panel");
    expect(panel).toContain("data-tt-admin-production-safety-direct-allowed");
    expect(rbac).toContain("console_role_direct_allowed");
  });

  it("CI-02: phase2 closure skeleton generator exists", () => {
    expect(
      readFileSync(join(repoRoot, "scripts/dev/generate-phase2-admin-closure-skeleton.sh"), "utf8"),
    ).toContain("TT_ADMIN_PHASE2_CLOSURE_SKELETON");
    expect(
      readFileSync(join(repoRoot, "scripts/dev/generate-phase2-admin-closure-skeleton.sh"), "utf8"),
    ).toContain("phase2_checklist");
  });
});
