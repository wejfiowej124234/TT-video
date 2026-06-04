import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const componentsAdmin = join(fe, "components", "admin");
const appAdmin = join(fe, "app", "admin");

/** ① 第十六批 UX · 六角色快选置顶 / 详情·队列 canvas / 举报页 open 去重。 */
describe("admin batch16 UX L5 (①)", () => {
  const pickOrder = readFileSync(join(__dir, "adminConsoleRole70PickOrder.ts"), "utf8");
  const preview = readFileSync(
    join(appAdmin, "permissions", "AdminConsoleRoleShellPreview.tsx"),
    "utf8",
  );
  const perms = readFileSync(join(appAdmin, "permissions", "AdminPermissionsPageMain.tsx"), "utf8");
  const detailChrome = readFileSync(join(componentsAdmin, "AdminDetailPageChrome.tsx"), "utf8");
  const queueChrome = readFileSync(join(componentsAdmin, "AdminQueueListPageChrome.tsx"), "utf8");
  const reportsInbox = readFileSync(
    join(appAdmin, "community", "reports", "AdminCommunityReportsInboxStrip.tsx"),
    "utf8",
  );

  it("defines console role pick order SSOT", () => {
    expect(pickOrder).toContain("orderConsoleRoles70WithCurrentFirst");
  });

  it("shell preview quick roles use pick order + current marker", () => {
    expect(preview).toContain("orderConsoleRoles70WithCurrentFirst");
    expect(preview).toContain("data-tt-admin-shell-preview-quick-role-current");
    expect(preview).toContain("rolePickOrder");
  });

  it("permissions matrix sorts roles with current first baseline", () => {
    expect(perms).toContain("orderConsoleRoles70WithCurrentFirst");
    expect(perms).toContain("roleOrder.indexOf(roleId)");
  });

  it("detail and queue chrome wrap body in console canvas", () => {
    expect(detailChrome).toContain("ADMIN_LIST_PAGE_BODY_CANVAS_CLASS");
    expect(detailChrome).toContain("data-tt-admin-detail-page-body-canvas");
    expect(queueChrome).toContain("ADMIN_LIST_PAGE_BODY_CANVAS_CLASS");
    expect(queueChrome).toContain("data-tt-admin-queue-list-body-canvas");
  });

  it("community reports inbox drops duplicate open count on open filter", () => {
    expect(reportsInbox).toContain("data-tt-admin-reports-inbox-open-filter");
    expect(reportsInbox).toContain("admin_reports_inbox_open_filter");
    expect(reportsInbox).toContain("data-tt-admin-reports-inbox-open-only");
    expect(reportsInbox).not.toContain("ADMIN_CONSOLE_INBOX_STRIP_CLASS");
  });
});
