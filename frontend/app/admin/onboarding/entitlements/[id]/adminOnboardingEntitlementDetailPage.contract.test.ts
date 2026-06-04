import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminOnboardingEntitlementDetailPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminOnboardingEntitlementDetailPage.ts"), "utf8"),
  ].join("\n");
}

describe("admin onboarding entitlement detail page", () => {
  const src = readModuleSources();

  it("keeps entitlement by id route + admin fetch + DOM anchor", () => {
    expect(src).toContain("routes.admin.entitlementById");
    expect(src).toContain("routes.admin.entitlementRevoke");
    expect(src).toContain('"AdminOnboardingEntitlementDetail"');
    expect(src).toContain('"data-tt-admin-onboarding-entitlement-detail": "1"');
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain("AdminPermissionDeniedBanner");
  });
});
