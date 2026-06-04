import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const componentsAdmin = join(__dir, "..", "..", "components", "admin");

describe("admin finance partial depth L5 (①)", () => {
  const checklist = readFileSync(join(componentsAdmin, "AdminFinanceSuitePartialChecklist.tsx"), "utf8");
  const financeMain = readFileSync(
    join(__dir, "..", "..", "app", "admin", "finance", "AdminFinancePageMain.tsx"),
    "utf8",
  );
  const disputesMain = readFileSync(
    join(__dir, "..", "..", "app", "admin", "disputes", "AdminDisputesPageMain.tsx"),
    "utf8",
  );

  it("partial depth href SSOT and module fallback workspace", () => {
    const hrefLib = readFileSync(join(__dir, "adminFinancePartialDepthHref.ts"), "utf8");
    const workspace = readFileSync(join(componentsAdmin, "AdminFinanceModuleDepthWorkspace.tsx"), "utf8");
    expect(hrefLib).toContain("adminFinancePartialDepthHref");
    expect(workspace).toContain("AdminFinanceDepthModuleFallback");
    expect(workspace).toContain("data-tt-admin-fin-depth-workspace");
  });

  it("mounts partial checklist on finance and disputes when fin_suite_depth=partial", () => {
    expect(checklist).toContain("data-tt-admin-fin-suite-partial-checklist");
    expect(checklist).toContain("admin_fin_partial_check_common_03");
    expect(financeMain).toContain("AdminFinanceSuitePartialChecklist");
    expect(disputesMain).toContain("AdminFinanceSuitePartialChecklist");
    expect(financeMain).toContain("AdminFinanceModuleDepthWorkspace");
    expect(disputesMain).toContain("AdminFinanceModuleDepthWorkspace");
  });

  it("mounts reconciliation depth workspace on finance-reconciliation page", () => {
    const reconMain = readFileSync(
      join(__dir, "..", "..", "app", "admin", "finance-reconciliation", "AdminFinanceReconciliationPageMain.tsx"),
      "utf8",
    );
    expect(reconMain).toContain("AdminFinanceModuleDepthWorkspace");
    expect(reconMain).toContain("AdminPermissionDeniedBanner");
    expect(reconMain).toContain("AdminFinanceSuiteDepthNotice");
  });

  it("mounts cross-check depth workspace on cross-check page", () => {
    const crossMain = readFileSync(
      join(__dir, "..", "..", "app", "admin", "cross-check", "AdminCrossCheckPageMain.tsx"),
      "utf8",
    );
    expect(crossMain).toContain("AdminFinanceModuleDepthWorkspace");
    expect(crossMain).toContain("AdminPermissionDeniedBanner");
  });

  it("mounts fee-router depth workspace on fee-router page", () => {
    const feeMain = readFileSync(
      join(__dir, "..", "..", "app", "admin", "fee-router", "AdminFeeRouterPageMain.tsx"),
      "utf8",
    );
    expect(feeMain).toContain("AdminFinanceModuleDepthWorkspace");
    expect(feeMain).toContain("AdminPermissionDeniedBanner");
    expect(feeMain).toContain("FINANCE_READ");
  });

  it("mounts audit depth workspace on audit page", () => {
    const auditMain = readFileSync(
      join(__dir, "..", "..", "app", "admin", "audit", "AdminAuditPageMain.tsx"),
      "utf8",
    );
    expect(auditMain).toContain("AdminFinanceModuleDepthWorkspace");
    expect(auditMain).toContain("AdminPermissionDeniedBanner");
    expect(auditMain).toContain("AdminFinanceSuiteDepthNotice");
  });

  it("mounts drift depth workspace on drift-summary page", () => {
    const driftMain = readFileSync(
      join(__dir, "..", "..", "app", "admin", "drift-summary", "AdminDriftSummaryPageMain.tsx"),
      "utf8",
    );
    expect(driftMain).toContain("AdminFinanceModuleDepthWorkspace");
    expect(driftMain).toContain("drift={{");
  });

  it("mounts region-vault depth workspace on region-vault page", () => {
    const vaultMain = readFileSync(
      join(__dir, "..", "..", "app", "admin", "region-vault", "AdminRegionVaultPageMain.tsx"),
      "utf8",
    );
    expect(vaultMain).toContain("AdminFinanceModuleDepthWorkspace");
    expect(vaultMain).toContain("regionVault={{");
    expect(vaultMain).toContain("FINANCE_READ");
  });
});
