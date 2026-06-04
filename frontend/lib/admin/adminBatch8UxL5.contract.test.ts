import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const componentsAdmin = join(fe, "components", "admin");
const appAdmin = join(fe, "app", "admin");

/** ① 第八批 UX · 提交全量校验 / 收件箱还焦 / 财务 compact 快照+下一步。 */
describe("admin batch8 UX L5 (①)", () => {
  it("reports PATCH submit uses full validation guard", () => {
    const validation = readFileSync(
      join(__dir, "adminReportsModerationWizardValidation.ts"),
      "utf8",
    );
    const hook = readFileSync(
      join(appAdmin, "community", "reports", "useAdminCommunityReportsPage.ts"),
      "utf8",
    );
    expect(validation).toContain("validateAdminReportsModerationSubmit");
    expect(hook).toContain("validateAdminReportsModerationSubmit");
    expect(hook).toContain("admin_reports_wizard_submit_blocked");
  });

  it("unified inbox escape returns focus to toggle", () => {
    const hook = readFileSync(join(__dir, "useAdminUnifiedInboxDetailPanel.ts"), "utf8");
    const inbox = readFileSync(
      join(appAdmin, "inbox", "AdminUnifiedInboxPageMain.tsx"),
      "utf8",
    );
    expect(hook).toContain("toggleRef");
    expect(hook).toContain("toggleRef.current?.focus");
    expect(inbox).toContain("detailToggleRef");
    expect(inbox).toContain("data-tt-admin-unified-inbox-detail-focus-return");
  });

  it("finance compact nav snapshots + next step + hub link", () => {
    const next = readFileSync(join(__dir, "adminFinanceWorkflowNextStep.ts"), "utf8");
    const compact = readFileSync(
      join(componentsAdmin, "AdminFinanceWorkflowCompactNav.tsx"),
      "utf8",
    );
    expect(next).toContain("adminFinanceWorkflowNextStep");
    expect(compact).toContain("useAdminFinanceWorkflowSnapshots");
    expect(compact).toContain("data-tt-admin-fin-workflow-compact-snapshot");
    expect(compact).toContain("data-tt-admin-fin-workflow-compact-next");
    expect(compact).toContain("data-tt-admin-fin-workflow-compact-hub");
  });
});
