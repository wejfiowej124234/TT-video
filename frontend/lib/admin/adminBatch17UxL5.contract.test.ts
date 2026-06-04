import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const componentsAdmin = join(fe, "components", "admin");
const appAdmin = join(fe, "app", "admin");

/** ① 第十七批 UX · 审批/举报 inbox 去重 / 空态 widget / 财务 partial nav / 权限矩阵卡。 */
describe("admin batch17 UX L5 (①)", () => {
  const approvalsInbox = readFileSync(
    join(appAdmin, "approvals", "AdminApprovalsInboxStrip.tsx"),
    "utf8",
  );
  const emptyState = readFileSync(join(componentsAdmin, "AdminListPageEmptyState.tsx"), "utf8");
  const finNav = readFileSync(join(componentsAdmin, "AdminFinanceWorkflowCompactNav.tsx"), "utf8");
  const perms = readFileSync(join(appAdmin, "permissions", "AdminPermissionsPageMain.tsx"), "utf8");

  it("approvals inbox drops duplicate pending count on pending filter", () => {
    expect(approvalsInbox).toContain("data-tt-admin-approvals-inbox-pending-filter");
    expect(approvalsInbox).toContain("admin_approvals_inbox_pending_filter");
    expect(approvalsInbox).toContain("ADMIN_HOME_WIDGET_CARD_CLASS");
    expect(approvalsInbox).not.toContain("ADMIN_CONSOLE_INBOX_STRIP_CLASS");
  });

  it("list empty state uses home widget card token", () => {
    expect(emptyState).toContain("ADMIN_HOME_WIDGET_CARD_CLASS");
    expect(emptyState).toContain("data-tt-admin-list-empty-widget");
  });

  it("finance partial compact nav uses widget card + merged honesty line", () => {
    expect(finNav).toContain("ADMIN_HOME_WIDGET_CARD_CLASS");
    expect(finNav).toContain("admin_fin_workflow_partial_honesty");
    expect(finNav).toContain("admin_fin_workflow_compact_nav_hint");
    expect(finNav).not.toContain("ADMIN_NOTICE_INFO_CLASS");
  });

  it("permissions matrix wrapped in widget card with current row marker", () => {
    expect(perms).toContain("data-tt-admin-permissions-matrix-card");
    expect(perms).toContain("ADMIN_HOME_WIDGET_CARD_CLASS");
    expect(perms).toContain("data-tt-admin-role70-current");
  });
});
