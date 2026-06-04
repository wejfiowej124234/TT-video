import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const appAdmin = join(fe, "app", "admin");

/** ① 第二十三批 UX · guides/reviews/flags + 社区空态 SSOT / applied_filters 人话 / 三联 marker。 */
describe("admin batch23 UX L5 (①)", () => {
  const nextLinks = readFileSync(join(__dir, "adminListEmptyStateNextLinks.ts"), "utf8");
  const fmt = readFileSync(join(__dir, "formatAdminAppliedFiltersHuman.ts"), "utf8");
  const guides = readFileSync(join(appAdmin, "guides", "AdminGuidesPageMain.tsx"), "utf8");
  const reviews = readFileSync(join(appAdmin, "reviews", "AdminReviewsTableSection.tsx"), "utf8");
  const flags = readFileSync(join(appAdmin, "flags", "AdminFlagsListSection.tsx"), "utf8");
  const penalties = readFileSync(
    join(appAdmin, "community", "penalties", "AdminCommunityPenaltiesListSection.tsx"),
    "utf8",
  );
  const reports = readFileSync(
    join(appAdmin, "community", "reports", "AdminCommunityReportsPageInner.tsx"),
    "utf8",
  );

  it("extends ops/community empty next-link SSOT", () => {
    expect(nextLinks).toContain("ADMIN_EMPTY_NEXT_GUIDES_EMPTY");
    expect(nextLinks).toContain("ADMIN_EMPTY_NEXT_REVIEWS_EMPTY");
    expect(nextLinks).toContain("ADMIN_EMPTY_NEXT_FLAGS_EMPTY");
    expect(nextLinks).toContain("ADMIN_EMPTY_NEXT_COMMUNITY_PENALTIES_EMPTY");
    expect(nextLinks).toContain("ADMIN_EMPTY_NEXT_COMMUNITY_POLICY_LOGS_EMPTY");
    expect(guides).toContain("ADMIN_EMPTY_NEXT_GUIDES_EMPTY");
    expect(reviews).toContain("ADMIN_EMPTY_NEXT_REVIEWS_EMPTY");
    expect(flags).toContain("ADMIN_EMPTY_NEXT_FLAGS_EMPTY");
    expect(penalties).toContain("ADMIN_EMPTY_NEXT_COMMUNITY_PENALTIES_EMPTY");
  });

  it("formatAdminAppliedFiltersHuman replaces JSON dump on community/flags/guides", () => {
    expect(fmt).toContain("formatAdminAppliedFiltersHuman");
    for (const src of [guides, flags, penalties]) {
      expect(src).toContain("formatAdminAppliedFiltersHuman");
      expect(src).not.toContain("JSON.stringify(appliedFilters)");
    }
  });

  it("community pages wire filtered empty marker triple with applied banner", () => {
    expect(reports).toContain("filteredEmpty={Boolean(appliedHuman)}");
    expect(reports).toContain("formatReportsAppliedFiltersHuman");
    expect(penalties).toContain("filteredEmpty={Boolean(appliedFilters)}");
    expect(penalties).toContain("AdminAppliedFiltersBanner");
    expect(penalties).toContain("formatAdminAppliedFiltersHuman");
  });
});
