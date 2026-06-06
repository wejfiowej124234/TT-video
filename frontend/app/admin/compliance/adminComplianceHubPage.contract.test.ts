import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminComplianceHubPageMain.tsx"), "utf8"),
  ].join("\n");
}

describe("admin compliance hub page", () => {
  const src = readModuleSources();

  it("keeps DSAR hub links + permission banner + DOM anchor", () => {
    expect(src).toContain("admin_compliance_hub");
    expect(src).toContain("/admin/compliance/requests");
    expect(src).toContain("AdminPermissionDeniedBanner");
    expect(src).toContain("ADMIN_PERM.READ");
    expect(src).toContain("useAdminCanWrite");
    expect(src).toContain('"data-tt-admin-compliance-hub": "1"');
    expect(src).toContain("AdminPlatformHubRelatedNav");
    expect(src).toContain("COMPLIANCE_HUB_RELATED_FOLD_LINKS");
    expect(src).not.toContain("headerAside={<AdminInboxQueueBackLinks />}");
  });
});
