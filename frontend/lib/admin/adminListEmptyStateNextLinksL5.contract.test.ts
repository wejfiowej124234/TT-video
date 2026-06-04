import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ADMIN_EMPTY_NEXT_AUDIT_HUB, ADMIN_EMPTY_NEXT_PLATFORM_HUB, ADMIN_EMPTY_NEXT_PROVIDER_QUEUE_EMPTY, ADMIN_EMPTY_NEXT_STEWARD_QUEUE_EMPTY, ADMIN_EMPTY_NEXT_APPROVALS_FILTERED_EMPTY, ADMIN_EMPTY_NEXT_COMMUNITY_REPORTS_EMPTY, ADMIN_EMPTY_NEXT_ONBOARDING_LIST_EMPTY, ADMIN_EMPTY_NEXT_ORDERS_FILTERED_EMPTY, ADMIN_EMPTY_NEXT_DISPUTES_FILTERED_EMPTY, ADMIN_EMPTY_NEXT_USERS_FILTERED_EMPTY, ADMIN_EMPTY_NEXT_GUIDES_EMPTY, ADMIN_EMPTY_NEXT_REVIEWS_EMPTY, ADMIN_EMPTY_NEXT_FLAGS_EMPTY, ADMIN_EMPTY_NEXT_COMMUNITY_PENALTIES_EMPTY } from "./adminListEmptyStateNextLinks";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

describe("admin list empty state next links L5 (①)", () => {
  it("platform hub points to config + permissions", () => {
    expect(ADMIN_EMPTY_NEXT_PLATFORM_HUB).toHaveLength(2);
    expect(ADMIN_EMPTY_NEXT_PLATFORM_HUB.map((l) => l.href)).toEqual([
      "/admin/config",
      "/admin/permissions",
    ]);
  });

  it("flags uses dedicated SSOT; secrets metadata wires platform hub", () => {
    const flags = readFileSync(join(fe, "app/admin/flags/AdminFlagsListSection.tsx"), "utf8");
    expect(flags).toContain("ADMIN_EMPTY_NEXT_FLAGS_EMPTY");
    const secrets = readFileSync(
      join(fe, "app/admin/secrets/metadata/AdminSecretsMetadataTableSection.tsx"),
      "utf8",
    );
    expect(secrets).toContain("ADMIN_EMPTY_NEXT_PLATFORM_HUB");
  });

  it("audit list wires ADMIN_EMPTY_NEXT_AUDIT_HUB", () => {
    const audit = readFileSync(join(fe, "app/admin/audit/AdminAuditTableSection.tsx"), "utf8");
    expect(audit).toContain("ADMIN_EMPTY_NEXT_AUDIT_HUB");
    expect(ADMIN_EMPTY_NEXT_AUDIT_HUB[0]?.href).toBe("/admin/audit/operations");
  });

  it("onboarding queue empty states use ADMIN_EMPTY_NEXT_* SSOT", () => {
    expect(ADMIN_EMPTY_NEXT_PROVIDER_QUEUE_EMPTY.map((l) => l.href)).toContain(
      "/admin/steward-applications?status=stake_pending",
    );
    expect(ADMIN_EMPTY_NEXT_STEWARD_QUEUE_EMPTY.map((l) => l.href)).toContain(
      "/admin/provider-applications?status=submitted",
    );
    expect(ADMIN_EMPTY_NEXT_APPROVALS_FILTERED_EMPTY).toHaveLength(3);
    expect(ADMIN_EMPTY_NEXT_COMMUNITY_REPORTS_EMPTY).toHaveLength(3);
    expect(ADMIN_EMPTY_NEXT_ONBOARDING_LIST_EMPTY).toHaveLength(3);
    expect(ADMIN_EMPTY_NEXT_ORDERS_FILTERED_EMPTY).toHaveLength(3);
    expect(ADMIN_EMPTY_NEXT_DISPUTES_FILTERED_EMPTY).toHaveLength(3);
    expect(ADMIN_EMPTY_NEXT_USERS_FILTERED_EMPTY).toHaveLength(3);
    expect(ADMIN_EMPTY_NEXT_GUIDES_EMPTY).toHaveLength(3);
    expect(ADMIN_EMPTY_NEXT_REVIEWS_EMPTY).toHaveLength(3);
    expect(ADMIN_EMPTY_NEXT_FLAGS_EMPTY).toHaveLength(3);
    expect(ADMIN_EMPTY_NEXT_COMMUNITY_PENALTIES_EMPTY).toHaveLength(3);
    for (const rel of [
      "app/admin/provider-applications/AdminProviderApplicationsPageMain.tsx",
      "app/admin/steward-applications/AdminStewardApplicationsPageMain.tsx",
      "app/admin/inbox/AdminUnifiedInboxPageMain.tsx",
      "app/admin/approvals/AdminApprovalsTableSection.tsx",
      "app/admin/community/reports/AdminCommunityReportsPageInner.tsx",
      "components/admin/AdminOnboardingListPage.tsx",
      "app/admin/orders/AdminOrdersPageMain.tsx",
      "app/admin/disputes/AdminDisputesPageMain.tsx",
      "app/admin/users/AdminUsersDataSection.tsx",
      "app/admin/guides/AdminGuidesPageMain.tsx",
      "app/admin/reviews/AdminReviewsTableSection.tsx",
      "app/admin/flags/AdminFlagsListSection.tsx",
      "app/admin/community/penalties/AdminCommunityPenaltiesListSection.tsx",
      "app/admin/community/appeals/AdminCommunityAppealsPageMain.tsx",
    ]) {
      const src = readFileSync(join(fe, rel), "utf8");
      expect(src, rel).toMatch(/ADMIN_EMPTY_NEXT_/);
    }
  });
});
