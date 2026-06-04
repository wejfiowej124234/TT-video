import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("AdminStewardApplicationReviewCard contract", () => {
  const src = readFileSync(join(__dir, "AdminStewardApplicationReviewCard.tsx"), "utf8");

  it("exposes stable review testid and admin steward API hooks", () => {
    expect(src).toContain('data-testid="admin-steward-application-review"');
    expect(src).toContain("getAdminUserStewardApplication");
    expect(src).toContain("patchAdminStewardApplicationReview");
    expect(src).toContain('"approved"');
    expect(src).toContain('"under_review"');
    expect(src).toContain('"rejected"');
  });
});
