import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const componentsAdmin = join(__dir, "..", "..", "components", "admin");

/** CFG-01：Flags/Policies/Tenant scopes 发布页审批链叙事。 */
describe("admin config publish approval notice L5 (①)", () => {
  const notice = readFileSync(join(componentsAdmin, "AdminConfigPublishApprovalNotice.tsx"), "utf8");

  it("links publish surfaces to approvals inbox", () => {
    expect(notice).toContain("AdminNoticeBanner");
    expect(notice).toContain("ADMIN_INBOX_QUEUE_HREFS.approvals");
    expect(notice).toContain("admin_config_publish_approval_notice");
    expect(notice).toContain("data-testid=\"admin-config-publish-approval-notice\"");
  });

  it("flags/policies/tenant scopes pages mount the notice", () => {
    for (const rel of [
      "flags/AdminFlagsPageMain.tsx",
      "policies/AdminPoliciesPageMain.tsx",
      "tenants/scopes/AdminTenantScopesPageMain.tsx",
      "secrets/metadata/AdminSecretsMetadataPageMain.tsx",
      "config/AdminConfigHubPageMain.tsx",
    ]) {
      const src = readFileSync(join(__dir, "..", "..", "app", "admin", rel), "utf8");
      expect(src).toContain("AdminConfigPublishApprovalNotice");
    }
  });
});
