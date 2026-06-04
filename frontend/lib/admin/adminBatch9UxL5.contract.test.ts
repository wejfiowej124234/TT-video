import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const componentsAdmin = join(fe, "components", "admin");
const appAdmin = join(fe, "app", "admin");

/** ① 第九批 UX · Phase② 预备命令 SSOT / 复制 / 财务旁路 / 向导重置。 */
describe("admin batch9 UX L5 (①)", () => {
  it("phase2 local prep commands SSOT + backlog copy", () => {
    const ssot = readFileSync(join(__dir, "adminPhase2LocalPrepCommands.ts"), "utf8");
    const panel = readFileSync(join(componentsAdmin, "AdminPhase2RemainingBacklogPanel.tsx"), "utf8");
    expect(ssot).toContain("ADMIN_PHASE2_LOCAL_PREP_COMMANDS");
    expect(panel).toContain("adminPhase2LocalPrepCommand");
    expect(panel).toContain("AdminClipboardCopyButton");
    expect(
      readFileSync(join(componentsAdmin, "AdminClipboardCopyButton.tsx"), "utf8"),
    ).toContain("data-tt-admin-clipboard-copy");
  });

  it("permissions page phase2 runbook strip for all operators", () => {
    const strip = readFileSync(
      join(componentsAdmin, "AdminPermissionsPhase2RunbookStrip.tsx"),
      "utf8",
    );
    const page = readFileSync(
      join(appAdmin, "permissions", "AdminPermissionsPageMain.tsx"),
      "utf8",
    );
    expect(strip).toContain("data-tt-admin-phase2-runbook-strip");
    expect(page).toContain("AdminPermissionsPhase2RunbookStrip");
  });

  it("finance compact nav supplement partial modules", () => {
    const model = readFileSync(join(__dir, "adminFinanceWorkflowModel.ts"), "utf8");
    const compact = readFileSync(
      join(componentsAdmin, "AdminFinanceWorkflowCompactNav.tsx"),
      "utf8",
    );
    expect(model).toContain("ADMIN_FINANCE_SUPPLEMENT_PARTIAL_MODULES");
    expect(compact).toContain("data-tt-admin-fin-workflow-compact-supplement");
    expect(compact).toContain("ADMIN_FINANCE_SUPPLEMENT_PARTIAL_MODULES");
    expect(compact).toContain("data-tt-admin-fin-workflow-compact-supplement-step");
  });

  it("reports wizard resets step on close", () => {
    const hook = readFileSync(
      join(appAdmin, "community", "reports", "useAdminCommunityReportsPage.ts"),
      "utf8",
    );
    expect(hook).toContain("setModWizardStep(1)");
  });
});
