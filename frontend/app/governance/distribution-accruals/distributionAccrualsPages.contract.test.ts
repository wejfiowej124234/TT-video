import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("governance distribution-accruals pages (P5-4-2 contract)", () => {
  const listSrc = readFileSync(join(__dir, "page.tsx"), "utf8");
  const detailSrc = readFileSync(join(__dir, "[id]", "page.tsx"), "utf8");

  it("list + detail never reference /api/v1/internal/ or internal accrual routes", () => {
    for (const src of [listSrc, detailSrc]) {
      expect(src).not.toMatch(/\/api\/v1\/internal\//);
      expect(src).not.toContain("internalInvestorDistributionAccrual");
    }
  });

  it("list + detail use governance accruals URL builder only", () => {
    expect(listSrc).toContain("buildGovernanceInvestorDistributionAccrualsUrl");
    expect(detailSrc).toContain("buildGovernanceInvestorDistributionAccrualsUrl");
  });
});
