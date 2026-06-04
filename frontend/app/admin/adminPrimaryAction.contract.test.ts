import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function walkTsx(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkTsx(p));
    else if (name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

/** VIS-07：筛选「应用」按钮应走 ADMIN_PRIMARY_ACTION_BTN_CLASS，避免散写 bg-travel-500 主按钮链。 */
const FILTER_MODULES = [
  "audit/AdminAuditFiltersBlock.tsx",
  "users/AdminUsersFiltersCard.tsx",
  "guides/AdminGuidesPageMain.tsx",
  "flags/AdminFlagsFilterCard.tsx",
  "policies/AdminPoliciesFilterCard.tsx",
  "community/penalties/AdminCommunityPenaltiesFilterCard.tsx",
  "compliance/requests/AdminComplianceRequestsFiltersBlock.tsx",
  "provider-applications/AdminProviderApplicationsPageMain.tsx",
  "steward-applications/AdminStewardApplicationsPageMain.tsx",
  "reviews/AdminReviewsFiltersCard.tsx",
];

const WRITE_PRIMARY_MODULES = [
  "permissions/AdminPermissionsPageMain.tsx",
  "permissions/AdminPermissionsTotpPanel.tsx",
  "onboarding/entitlements/[id]/AdminOnboardingEntitlementDetailPageMain.tsx",
  "trust-growth/AdminTrustGrowthControlSection.tsx",
  "community/penalties/AdminCommunityPenaltiesPageMain.tsx",
];

const BG_TRAVEL_PRIMARY_RE = /bg-travel-500 px-[34] py-2 text-small font-medium text-white hover:bg-travel-600/;

describe("admin primary action button (VIS-07)", () => {
  for (const rel of FILTER_MODULES) {
    it(`uses ADMIN_PRIMARY_ACTION_BTN_CLASS in ${rel}`, () => {
      const src = readFileSync(join(__dir, rel), "utf8");
      expect(src).toContain("ADMIN_PRIMARY_ACTION_BTN_CLASS");
      expect(src).not.toMatch(BG_TRAVEL_PRIMARY_RE);
    });
  }

  for (const rel of WRITE_PRIMARY_MODULES) {
    it(`uses ADMIN_PRIMARY_ACTION_BTN_CLASS for write primary in ${rel}`, () => {
      const src = readFileSync(join(__dir, rel), "utf8");
      expect(src).toContain("ADMIN_PRIMARY_ACTION_BTN_CLASS");
      expect(src).not.toMatch(/rounded bg-travel-600 px-/);
    });
  }

  it("all app/admin *Filter* submit apply buttons use ADMIN_PRIMARY_ACTION_BTN_CLASS", () => {
    const offenders: string[] = [];
    for (const file of walkTsx(__dir)) {
      const base = file.replace(/\\/g, "/");
      if (!base.includes("/admin/") || !/Filter/i.test(base)) continue;
      const src = readFileSync(file, "utf8");
      if (!src.includes('type="submit"')) continue;
      if (!src.includes("ADMIN_PRIMARY_ACTION_BTN_CLASS")) offenders.push(base);
    }
    expect(offenders).toEqual([]);
  });
});