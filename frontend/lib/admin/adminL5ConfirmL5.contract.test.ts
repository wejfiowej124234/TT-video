import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const FE = join(__dir, "..", "..");

const DANGEROUS_WRITE_HOOKS = [
  "app/admin/trust-growth/useAdminTrustGrowthPage.ts",
  "app/admin/onboarding/entitlements/[id]/useAdminOnboardingEntitlementDetailPage.ts",
  "app/admin/approvals/useAdminApprovalsPage.ts",
  "app/admin/approvals/[id]/useAdminApprovalDetailPage.ts",
  "app/admin/community/penalties/useAdminCommunityPenaltiesPage.ts",
  "app/admin/community/appeals/review/useAdminCommunityAppealReviewPage.ts",
  "app/admin/compliance/requests/[requestId]/update/useAdminComplianceRequestUpdatePage.ts",
  "app/admin/scheduler/jobs/useAdminSchedulerJobsPage.ts",
  "app/admin/users/useAdminUsersPage.ts",
  "app/admin/community/abuse-policy/useAdminCommunityAbusePolicyPage.ts",
  "app/admin/community/comments/visibility/useAdminCommunityCommentVisibilityPage.ts",
  "app/admin/community/reports/useAdminCommunityReportsPage.ts",
  "app/admin/flags/useAdminFlagsPage.ts",
  "app/admin/policies/useAdminPoliciesPage.ts",
  "app/admin/tenants/scopes/useAdminTenantScopesPage.ts",
  "app/admin/content/poi-images/batches/[id]/useAdminContentPoiImageBatchPage.ts",
];

const DANGEROUS_WRITE_COMPONENTS = [
  "components/admin/AdminAcquisitionPublishSuspendCard.tsx",
  "components/admin/AdminAcquisitionPublishSuspendModal.tsx",
  "app/admin/permissions/AdminPermissionsTotpPanel.tsx",
  "app/admin/permissions/AdminPermissions2faPolicyPanel.tsx",
];

describe("admin L5 confirm (① · dangerous writes)", () => {
  it("mounts AdminL5ConfirmProvider in capabilities shell", () => {
    const shell = readFileSync(join(FE, "components/admin/AdminCapabilitiesShell.tsx"), "utf8");
    expect(shell).toContain("AdminL5ConfirmProvider");
    expect(readFileSync(join(FE, "components/admin/AdminL5ConfirmDialog.tsx"), "utf8")).toContain(
      "data-tt-admin-l5-confirm",
    );
  });

  it("forbids window.confirm on dangerous write surfaces", () => {
    for (const rel of [...DANGEROUS_WRITE_HOOKS, ...DANGEROUS_WRITE_COMPONENTS]) {
      const src = readFileSync(join(FE, rel), "utf8");
      expect(src, rel).not.toMatch(/window\.confirm\s*\(/);
    }
  });

  it("wires useAdminL5ConfirmRequest on dangerous write surfaces", () => {
    for (const rel of [...DANGEROUS_WRITE_HOOKS, ...DANGEROUS_WRITE_COMPONENTS]) {
      const src = readFileSync(join(FE, rel), "utf8");
      expect(src, rel).toContain("useAdminL5ConfirmRequest");
    }
    expect(readFileSync(join(__dir, "useAdminL5ConfirmState.ts"), "utf8")).toContain(
      "invalidateAdminCachesAfterWrite",
    );
  });
});
