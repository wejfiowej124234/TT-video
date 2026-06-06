import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminCommunityReportsPageInner.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminCommunityReportsModerationWizard.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminCommunityReportsPage.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "..", "lib/admin/useAdminStandardListFetch.ts"), "utf8"),
    readFileSync(join(__dir, "AdminCommunityReportsInboxStrip.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminCommunityReportsFilterCard.tsx"), "utf8"),
  ].join("\n");
}

describe("admin community reports page", () => {
  const src = readSources();

  it("keeps wizard + list fetch + DOM anchors", () => {
    expect(src).toContain('data-tt-admin-reports-wizard="1"');
    expect(src).toContain("data-tt-admin-reports-wizard-step-indicator");
    expect(src).toContain("data-tt-admin-reports-wizard-step-errors");
    expect(src).toContain("adminReportsModerationWizardValidation");
    expect(src).toContain("validateAdminReportsModerationSubmit");
    expect(src).toContain("AdminDialogFocusPanel");
    expect(src).toContain("AdminDialogScrim");
    expect(src).toContain("AdminCommunityReportsPage");
    expect(src).toContain("useAdminStandardListFetch");
    expect(src).toContain("modWizardStep");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain("AdminListPageEmptyState");
    expect(src).toContain("AdminPermissionDeniedBanner");
    expect(src).toContain("COMMUNITY_READ");
    expect(src).toContain("AdminCommunityReportsFilterCard");
    expect(src).toContain("data-tt-admin-reports-filter-grid");
    expect(src).toContain("data-tt-admin-reports-inbox-open-filter");
    expect(src).toContain("ADMIN_EMPTY_NEXT_COMMUNITY_REPORTS_EMPTY");
    expect(src).toContain('data-tt-admin-reports-inbox-empty');
    expect(src).toContain("AdminCommunityRelatedLinks");
    expect(src).not.toContain("AdminCommunityListHeaderAside");
    expect(src).not.toContain("AdminCommunityReportsHeaderLinks");
  });
});
