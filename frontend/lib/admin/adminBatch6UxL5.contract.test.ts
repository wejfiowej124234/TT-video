import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const componentsAdmin = join(fe, "components", "admin");
const appAdmin = join(fe, "app", "admin");

/** ① 第六批 UX · FIN 工作流快照 / 统一收件箱详情 / 举报向导步进条。 */
describe("admin batch6 UX L5 (①)", () => {
  it("finance workflow model + live snapshots", () => {
    const model = readFileSync(join(__dir, "adminFinanceWorkflowModel.ts"), "utf8");
    const hook = readFileSync(join(__dir, "useAdminFinanceWorkflowSnapshots.ts"), "utf8");
    const strip = readFileSync(join(componentsAdmin, "AdminFinanceWorkflowStrip.tsx"), "utf8");
    expect(model).toContain("ADMIN_FINANCE_WORKFLOW_STEPS");
    expect(model).toContain("adminFinancePartialDepthHref");
    expect(hook).toContain("routes.admin.financeSummary");
    expect(hook).toContain("routes.admin.disputes");
    expect(strip).toContain("data-tt-admin-fin-workflow-snapshot");
    expect(strip).toContain("data-tt-admin-fin-workflow-retry");
  });

  it("unified inbox inline task detail toggle", () => {
    const inbox = readFileSync(
      join(appAdmin, "inbox", "AdminUnifiedInboxPageMain.tsx"),
      "utf8",
    );
    const detail = readFileSync(join(componentsAdmin, "AdminUnifiedInboxTaskDetail.tsx"), "utf8");
    expect(inbox).toContain("AdminUnifiedInboxTaskDetail");
    expect(inbox).toContain("data-tt-admin-unified-inbox-task-detail-toggle");
    expect(detail).toContain("data-tt-admin-unified-inbox-task-detail");
  });

  it("community reports wizard step indicator", () => {
    const wizard = readFileSync(
      join(appAdmin, "community", "reports", "AdminCommunityReportsModerationWizard.tsx"),
      "utf8",
    );
    expect(wizard).toContain("data-tt-admin-reports-wizard-step-indicator");
    expect(wizard).toContain("ADMIN_STEP_MARKER_CLASS");
    expect(wizard).toContain("aria-current");
  });
});
