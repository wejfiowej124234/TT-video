import { describe, expect, it } from "vitest";
import { routes } from "@/lib/api";
import {
  buildGovernanceInvestorDistributionAccrualsUrl,
  isDistributionDetailUuid,
} from "@/lib/governanceInvestorDistributionAccruals";

describe("governanceInvestorDistributionAccruals (P5-4-2)", () => {
  it("uses only the public governance GET path (never internal accrual POST path)", () => {
    expect(routes.governanceInvestorDistributionAccruals).toBe(
      "/api/v1/governance/investor-distribution-accruals"
    );
    expect(routes.internalInvestorDistributionAccrual).toContain("/internal/");
    expect(routes.governanceInvestorDistributionAccruals).not.toContain("/internal/");
  });

  it("buildGovernanceInvestorDistributionAccrualsUrl encodes query params", () => {
    expect(buildGovernanceInvestorDistributionAccrualsUrl({ limit: 20 })).toBe(
      "/api/v1/governance/investor-distribution-accruals?limit=20"
    );
    expect(
      buildGovernanceInvestorDistributionAccrualsUrl({
        limit: 10,
        chainId: 1,
        distributionId: "550e8400-e29b-41d4-a716-446655440000",
      })
    ).toBe(
      "/api/v1/governance/investor-distribution-accruals?limit=10&chain_id=1&distribution_id=550e8400-e29b-41d4-a716-446655440000"
    );
  });

  it("isDistributionDetailUuid accepts canonical UUID", () => {
    expect(isDistributionDetailUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isDistributionDetailUuid("not-a-uuid")).toBe(false);
  });
});
