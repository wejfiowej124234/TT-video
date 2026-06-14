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

describe("L5 Enterprise Acceptance contract (161)", () => {
  it("UX P1/P2 closure markers", () => {
    expect(readFe("app/me/referrals/MeReferralsPageMain.tsx")).toContain(
      "data-tt-me-referrals-login-cta",
    );
    expect(readFe("app/admin/growth/AdminGrowthHubMain.tsx")).toContain("data-tt-admin-growth-hub-kpi");
    expect(readFe("e2e/e2e-a-01-cold-start-campaign-consumer.spec.ts")).toContain(
      "data-tt-cold-start-surface",
    );
    expect(readRepo("frontend/lib/admin/adminShellMoreNavLinks.ts")).toContain(
      "/admin/conversion-analytics",
    );
    expect(readFe("app/admin/growth/airdrop-campaigns/AdminAirdropCampaignsPageMain.tsx")).toContain(
      "data-tt-admin-growth-airdrop-export-progress",
    );
    expect(readFe("app/admin/growth/analytics/AdminGrowthAnalyticsPageMain.tsx")).toContain(
      "data-tt-admin-growth-analytics-presets",
    );
  });

  it("enterprise audit harness scripts", () => {
    for (const rel of [
      "scripts/dev/generate-l5-enterprise-acceptance-matrix.py",
      "scripts/dev/run-l5-enterprise-acceptance.sh",
      "scripts/check-l5-enterprise-acceptance-execution.sh",
      "scripts/dev/l5-enterprise-data-integrity-audit.sh",
      "scripts/dev/l5-enterprise-rbac-security-audit.sh",
      "scripts/dev/l5-enterprise-performance-audit.sh",
      "scripts/dev/l5-enterprise-human-acceptance-audit.sh",
      "scripts/dev/l5-enterprise-performance-benchmark.sh",
    ]) {
      expect(readRepo(rel).length).toBeGreaterThan(10);
    }
  });

  it("human acceptance manifest five roles", () => {
    const manifest = readRepo("evidence/l5_enterprise_acceptance/human_acceptance_manifest.v1.json");
    expect(manifest).toContain('"traveler"');
    expect(manifest).toContain('"guide"');
    expect(manifest).toContain('"merchant"');
    expect(manifest).toContain('"ops"');
    expect(manifest).toContain('"admin"');
  });
});
