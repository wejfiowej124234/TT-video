import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminApprovalsPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminApprovalsPermissionHints.tsx"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "components/admin/AdminListPageChrome.tsx"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "components/admin/AdminSubpageBreadcrumb.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminApprovalsInboxStrip.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminApprovalsQuickFilters.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminApprovalsBatchBar.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminApprovalsFiltersCard.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminApprovalsAppliedFiltersSection.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminApprovalsMetaNote.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminApprovalsTableSection.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminApprovalsPage.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "lib/admin/useAdminStandardListFetch.ts"), "utf8"),
    readFileSync(join(__dir, "adminApprovalsPageModel.ts"), "utf8"),
    readFileSync(join(__dir, "adminApprovalWorkflowModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin approvals page", () => {
  const src = readModuleSources();

  it("keeps approvals list + approve routes + admin fetch + DOM anchor", () => {
    expect(src).toContain("routes.admin.approvals");
    expect(src).toContain("routes.admin.approvalApprove");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("useAdminStandardListFetch");
    expect(src).toContain('data-tt-admin-list-page="1"');
    expect(src).toContain("AdminListPageEmptyState");
    expect(src).toContain('"AdminApprovalsPage.load"');
    expect(src).toContain("admin-approvals-filter-form");
    expect(src).toContain('data-tt-admin-approvals-inbox="1"');
    expect(src).toContain("data-tt-admin-approvals-inbox-pending-filter");
    expect(src).toContain('data-tt-admin-approvals-batch="1"');
    expect(src).toContain("getIdempotencyKey");
    expect(src).toContain("exportPendingCsv");
    expect(src).toContain("downloadAdminCsv");
    expect(src).toContain("admin_approvals_export_csv");
    expect(src).toContain("data-tt-admin-approvals-ops-guide");
    expect(src).toContain("admin_approvals_ops_denied_title");
    expect(src).toContain("ADMIN_EMPTY_NEXT_APPROVALS_FILTERED_EMPTY");
    expect(src).toContain('data-tt-admin-approvals-inbox-empty');
    expect(src).toContain("APPROVALS_LIST_RELATED_FOLD_LINKS");
    expect(src).not.toContain("headerAside={<AdminOpsQueueBackLinks />}");
    expect(src).toContain("adminPathShowsInboxBreadcrumb");
  });
});
