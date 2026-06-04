import { readFileSync } from "node:fs";

import { dirname, join } from "node:path";

import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";



const __dir = dirname(fileURLToPath(import.meta.url));



describe("admin unified inbox L5 (①)", () => {

  const src = [

    readFileSync(join(__dir, "AdminUnifiedInboxPageMain.tsx"), "utf8"),

    readFileSync(join(__dir, "page.tsx"), "utf8"),

    readFileSync(join(__dir, "..", "..", "..", "lib", "admin", "adminUnifiedInboxTasks.ts"), "utf8"),

  ].join("\n");



  it("wires real inbox hooks and task list markers", () => {

    expect(src).toContain("data-tt-admin-unified-inbox");

    expect(src).toContain("useAdminHomeInbox");

    expect(src).toContain('"reports"');

    expect(src).toContain("buildAdminUnifiedInboxTasks");

    expect(src).toContain("ADMIN_INBOX_QUEUE_HREFS");

    expect(src).toContain("adminHomeInboxPendingTotal");

    expect(src).toContain("adminHomeKpiMetricDisplay");

    expect(src).not.toContain("admin_unified_inbox_total");
    expect(src).not.toContain("data-tt-admin-unified-inbox-total");

    expect(src).toContain("data-tt-admin-unified-inbox-perm-denied");

    expect(src).not.toContain("useAdminHomeKpi");

    expect(src).toContain("data-tt-admin-unified-inbox-scope-honesty");

    expect(src).toContain("admin_unified_inbox_all_clear");

    expect(src).toContain("AdminListPageEmptyState");
    expect(src).toContain("ADMIN_EMPTY_NEXT_UNIFIED_INBOX_CLEAR");
    expect(src).toContain("AdminUnifiedInboxTaskDetail");
    expect(src).toContain("data-tt-admin-unified-inbox-task-detail-toggle");
    expect(src).toContain("useAdminUnifiedInboxDetailPanel");
    expect(src).toContain("aria-controls");
    expect(src).toContain("detailToggleRef");
    expect(src).toContain("data-tt-admin-unified-inbox-detail-focus-return");

  });

});


