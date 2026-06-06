import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminReviewDetailPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminReviewDetailPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminReviewDetailPageModel.ts"), "utf8"),
    readFileSync(join(__dir, "../../../../lib/admin/useAdminStandardDetailFetch.ts"), "utf8"),
  ].join("\n");
}

describe("admin review detail page", () => {
  const src = readModuleSources();

  it("keeps admin review by id route + escrow prefetch + admin fetch + DOM anchor", () => {
    expect(src).toContain("routes.admin.reviewById");
    expect(src).toContain("useAdminStandardDetailFetch");
    expect(src).toContain("review-detail");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminDetailPageChrome");
    expect(src).toContain('"AdminReviewDetailPage"');
    expect(src).toContain("stashEscrowOrderPrefetchForOrderIdNav");
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain("REVIEW_DETAIL_RELATED_FOLD_LINKS");
    expect(src).not.toContain("AdminOpsQueueBackLinks");
    expect(src).toContain("adminTableRowPrimaryActionClass");
  });
});
