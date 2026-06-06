import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const repoRoot = join(__dir, "..", "..", "..");

/** ① 第五十七批 UX · 筛选字色 · 表行操作层级 · 财务深嵌卡 · 顶栏收件箱 dedupe。 */
describe("admin batch57 UX L5 (①)", () => {
  it("run-admin-l5-green includes batch57 contract", () => {
    const green = readFileSync(join(repoRoot, "scripts/dev/run-admin-l5-green.sh"), "utf8");
    expect(green).toContain("lib/admin/adminBatch57UxL5.contract.test.ts");
  });

  it("filter card typography uses slate on dark warm card", () => {
    const adminUi = readFileSync(join(fe, "lib/adminUi.ts"), "utf8");
    expect(adminUi).toMatch(/ADMIN_FILTER_TITLE_CLASS[\s\S]*text-slate-100/);
    expect(adminUi).toMatch(/ADMIN_FILTER_FIELD_LABEL_CLASS[\s\S]*text-slate-200/);
    expect(adminUi).toMatch(/ADMIN_FILTER_HINT_CLASS[\s\S]*text-slate-400/);
  });

  it("table row actions use horizontal layout + link-style secondary", () => {
    const adminUi = readFileSync(join(fe, "lib/adminUi.ts"), "utf8");
    expect(adminUi).toContain("ADMIN_TABLE_ROW_ACTIONS_CLASS");
    expect(adminUi).toMatch(/ADMIN_TABLE_SECONDARY_ACTION_BTN_CLASS[\s\S]*hover:underline/);
    expect(adminUi).not.toMatch(/ADMIN_TABLE_SECONDARY_ACTION_BTN_CLASS[\s\S]*bg-bg-console/);
    const orders = readFileSync(join(fe, "app/admin/orders/AdminOrdersPageMain.tsx"), "utf8");
    expect(orders).toContain("ADMIN_TABLE_ROW_ACTIONS_CLASS");
    const reviews = readFileSync(join(fe, "app/admin/reviews/AdminReviewsTableSection.tsx"), "utf8");
    expect(reviews).toContain("ADMIN_TABLE_ROW_ACTIONS_CLASS");
  });

  it("finance workflow + supplement use dark nested step cards not cream", () => {
    const adminUi = readFileSync(join(fe, "lib/adminUi.ts"), "utf8");
    expect(adminUi).toMatch(/ADMIN_FIN_WORKFLOW_STEP_CARD_CLASS[\s\S]*ADMIN_HUB_NESTED_KPI_CARD_CLASS/);
    expect(adminUi).toContain("ADMIN_FIN_PHASE_HONESTY_FOLD_CLASS");
    const workflow = readFileSync(join(fe, "components/admin/AdminFinanceWorkflowStrip.tsx"), "utf8");
    expect(workflow).toContain("text-slate-100");
    const psp = readFileSync(join(fe, "components/admin/AdminFinancePspPhase2DepthNotice.tsx"), "utf8");
    expect(psp).toContain("ADMIN_FIN_PHASE_HONESTY_FOLD_CLASS");
    expect(psp).not.toContain("bg-amber-50");
    const supplement = readFileSync(join(fe, "components/admin/AdminFinanceSuiteSupplementStrip.tsx"), "utf8");
    expect(supplement).toContain("ADMIN_FIN_WORKFLOW_STEP_CARD_CLASS");
  });

  it("inbox back links default off; ops header drops inbox dup", () => {
    const back = readFileSync(join(fe, "components/admin/AdminInboxQueueBackLinks.tsx"), "utf8");
    expect(back).toMatch(/showInbox\s*=\s*false/);
    expect(back).toContain("if (!showInbox && !showWorkspace)");
    const ops = readFileSync(join(fe, "components/admin/AdminOpsQueueBackLinks.tsx"), "utf8");
    expect(ops).not.toContain("AdminInboxQueueBackLinks");
    expect(ops).toContain("data-tt-admin-back-observability-hub");
    const finBack = readFileSync(join(fe, "components/admin/AdminFinanceSuiteBackLinks.tsx"), "utf8");
    expect(finBack).not.toContain("AdminInboxQueueBackLinks");
  });
});
