import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminApprovalDetailPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminApprovalDetailTimeline.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminApprovalDetailWorkflowPanel.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminApprovalDetailPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminApprovalDetailPageModel.ts"), "utf8"),
    readFileSync(join(__dir, "../adminApprovalWorkflowModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin approval detail page", () => {
  const src = readModuleSources();

  it("keeps approval-by-id route + approve/reject + timeline + DOM anchor", () => {
    expect(src).toContain("routes.admin.approvalById");
    expect(src).toContain("routes.admin.approvalApprove");
    expect(src).toContain("routes.admin.approvalReject");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminDetailPageChrome");
    expect(src).toContain('"AdminApprovalDetailPage"');
    expect(src).toContain('data-tt-admin-approval-timeline="1"');
    expect(src).toContain('data-tt-admin-approval-workflow="1"');
    expect(src).toContain("writeRequestHeaders");
    expect(src).toContain("AdminListFetchError");
  });
});
