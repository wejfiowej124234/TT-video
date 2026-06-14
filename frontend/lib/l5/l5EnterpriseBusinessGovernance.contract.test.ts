import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const feRoot = join(__dirname, "../..");
const repoRoot = join(__dirname, "../../..");

function readFe(rel: string) {
  return readFileSync(join(feRoot, rel), "utf8");
}

function readRepo(rel: string) {
  return readFileSync(join(repoRoot, rel), "utf8");
}

describe("L5 Enterprise Business & Governance contract (165)", () => {
  it("business rules · growth freeze + ledger", () => {
    expect(readRepo("docs/handbook/engineering/133-G-S8-Growth-Release-Freeze-Report.md")).toContain(
      "GROWTH_RELEASE_FREEZE_GO",
    );
    expect(readRepo("crates/api/src/db/growth_ledger.rs")).toContain("append-only SSOT");
    expect(readFe("app/me/referrals/MeReferralsPageMain.tsx")).toContain("data-tt-me-referrals-page");
  });

  it("tokenomics · governance token + investor distribution", () => {
    expect(readRepo("contracts/abi/GovernanceVotesToken.json")).toContain("getPastVotes");
    expect(readRepo("docs/fundraising/external/07-Protocol-Tokenomics-Reader.md").length).toBeGreaterThan(200);
    expect(readFe("lib/governanceInvestorDistributionAccruals.ts")).toContain("investor-distribution-accruals");
  });

  it("economic attack · anti-fraud + rate limit", () => {
    expect(readFe("app/admin/growth/anti-fraud/AdminAntiFraudPageMain.tsx")).toContain(
      "data-tt-admin-growth-anti-fraud-rules",
    );
    expect(readRepo("crates/api/src/db/growth_referral.rs")).toContain("referral_hourly_rate_limit");
  });

  it("governance · hub + timelock", () => {
    expect(readFe("app/governance/GovernanceHubPageMain.tsx")).toContain("GovernanceHubPageMain");
    expect(readRepo("contracts/test/GovernanceSafeDeployFlow.t.sol")).toContain("GovernanceSafeDeployFlow");
  });

  it("investor readiness · fundraising pack", () => {
    expect(readRepo("docs/fundraising/external/02-Investor-Executive-Summary.md").length).toBeGreaterThan(100);
    expect(readRepo("docs/fundraising/START-HERE-SSOT-001.md").length).toBeGreaterThan(50);
    expect(readRepo("evidence/l5_enterprise_business_governance/business_governance_manifest.v1.json")).toContain(
      '"admin"',
    );
  });

  it("business governance harness scripts", () => {
    for (const rel of [
      "scripts/dev/generate-l5-enterprise-business-governance-audit-matrix.py",
      "scripts/check-l5-enterprise-business-governance-execution.sh",
      "scripts/dev/l5-bg-business-rules-audit.sh",
      "scripts/dev/l5-bg-tokenomics-audit.sh",
      "scripts/dev/l5-bg-economic-attack-audit.sh",
      "scripts/dev/l5-bg-governance-audit.sh",
      "scripts/dev/l5-bg-investor-readiness-audit.sh",
    ]) {
      expect(readRepo(rel).length).toBeGreaterThan(20);
    }
  });
});
