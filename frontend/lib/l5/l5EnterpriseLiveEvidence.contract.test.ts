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

describe("L5 Enterprise Live Evidence contract (164)", () => {
  it("RUJR live evidence bundles", () => {
    expect(readFe("evidence/pes-rujr-20260607/rujr-report-synth.json")).toContain('"totalRuns": 48');
    expect(readFe("evidence/pes-wave41-validation-20260607/journey-runs.jsonl").length).toBeGreaterThan(100);
    expect(readRepo("evidence/l5_enterprise_live_evidence/rujr-live-record.v1.json")).toContain("rujrId");
    expect(readRepo("evidence/l5_enterprise_live_evidence/live_evidence_manifest.v1.json")).toContain('"admin"');
  });

  it("A11Y live scan captured evidence", () => {
    expect(readFe("e2e/l5-a11y-live-scan.spec.ts")).toContain("l5-a11y-live-scan");
    expect(readFe("evidence/l5-a11y-live-scan/scan-summary.json")).toContain("routesScanned");
    expect(readFe("evidence/l5-a11y-live-scan/scan-results.jsonl").length).toBeGreaterThan(50);
  });

  it("live resilience evidence records", () => {
    expect(readRepo("evidence/l5_enterprise_live_evidence/cdia-static-record.v1.json")).toContain("BASELINE_CAPTURED");
    expect(readRepo("evidence/l5_enterprise_live_evidence/frca-static-record.v1.json")).toContain("BASELINE_CAPTURED");
    expect(readRepo("evidence/l5_enterprise_live_evidence/b480-gate-record.v1.json")).toContain("GATE_CONFIG_VERIFIED");
  });

  it("live evidence harness scripts", () => {
    for (const rel of [
      "scripts/dev/generate-l5-enterprise-live-evidence-audit-matrix.py",
      "scripts/check-l5-enterprise-live-evidence-execution.sh",
      "scripts/dev/seed-l5-enterprise-live-evidence-bundles.py",
      "scripts/dev/l5-le-rujr-live-audit.sh",
      "scripts/dev/l5-le-a11y-live-evidence-audit.sh",
      "scripts/dev/l5-le-resilience-live-audit.sh",
    ]) {
      expect(readRepo(rel).length).toBeGreaterThan(20);
    }
  });
});
