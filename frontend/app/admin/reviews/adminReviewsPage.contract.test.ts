import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const componentsAdmin = join(__dir, "../../../components/admin");

function readModuleSources(): string {
  return [
    readFileSync(join(componentsAdmin, "AdminListPageChrome.tsx"), "utf8"),
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminReviewsPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminReviewsFiltersCard.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminReviewsFetchAlerts.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminReviewsTableSection.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminReviewsPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminReviewsPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin reviews page", () => {
  const src = readModuleSources();

  it("keeps admin reviews list route + admin fetch + list chrome anchor", () => {
    expect(src).toContain("routes.admin.reviews");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminReviewsPageMain");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain('data-tt-admin-list-page="1"');
    expect(src).toContain("admin-reviews-filter-form");
    expect(src).toContain("stashEscrowOrderPrefetchForOrderIdNav");
  });
});
