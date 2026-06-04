import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const componentsAdmin = join(fe, "components", "admin");
const appAdmin = join(fe, "app", "admin");

/** ① 第七批 UX · 举报向导校验 / 收件箱 a11y / 财务 partial 工作流导航。 */
describe("admin batch7 UX L5 (①)", () => {
  it("reports wizard step validation module", () => {
    const validation = readFileSync(
      join(__dir, "adminReportsModerationWizardValidation.ts"),
      "utf8",
    );
    const wizard = readFileSync(
      join(appAdmin, "community", "reports", "AdminCommunityReportsModerationWizard.tsx"),
      "utf8",
    );
    expect(validation).toContain("validateAdminReportsWizardStep2");
    expect(wizard).toContain("data-tt-admin-reports-wizard-step-errors");
    expect(wizard).toContain("aria-invalid");
  });

  it("unified inbox detail panel escape + aria-controls", () => {
    const hook = readFileSync(join(__dir, "useAdminUnifiedInboxDetailPanel.ts"), "utf8");
    const inbox = readFileSync(
      join(appAdmin, "inbox", "AdminUnifiedInboxPageMain.tsx"),
      "utf8",
    );
    const detail = readFileSync(join(componentsAdmin, "AdminUnifiedInboxTaskDetail.tsx"), "utf8");
    expect(hook).toContain("Escape");
    expect(inbox).toContain("useAdminUnifiedInboxDetailPanel");
    expect(inbox).toContain("aria-controls");
    expect(inbox).toContain("data-tt-admin-unified-inbox-detail-escape");
    expect(detail).toContain('role="region"');
  });

  it("finance partial pages compact workflow nav", () => {
    const model = readFileSync(join(__dir, "adminFinanceWorkflowModel.ts"), "utf8");
    const notice = readFileSync(join(componentsAdmin, "AdminFinanceSuiteDepthNotice.tsx"), "utf8");
    const compact = readFileSync(
      join(componentsAdmin, "AdminFinanceWorkflowCompactNav.tsx"),
      "utf8",
    );
    expect(model).toContain("ADMIN_FIN_SUITE_MODULE_TO_WORKFLOW_STEP");
    expect(notice).toContain("AdminFinanceWorkflowCompactNav");
    expect(compact).toContain("data-tt-admin-fin-workflow-compact-nav");
    expect(compact).toContain("aria-current");
  });
});
