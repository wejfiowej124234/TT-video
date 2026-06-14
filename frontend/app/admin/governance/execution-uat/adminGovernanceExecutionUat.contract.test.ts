import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../../../../..");

describe("BE-DAO-01 governance execution UAT contract", () => {
  it("admin page exposes LINE-B and evidence markers", () => {
    const src = readFileSync(join(__dirname, "AdminGovernanceExecutionUatPageMain.tsx"), "utf8");
    expect(src).toContain("data-tt-admin-governance-execution-uat-steps");
    expect(src).toContain("b417-run-onchain-evidence.sh");
    expect(src).toContain("run_20260417T0810Z");
  });

  it("B-417 orchestration scripts exist on disk", () => {
    for (const s of [
      "b417-sepolia-preflight.sh",
      "b417-governor-queue-testnet.sh",
      "b417-governance-execution-automation.sh",
      "b417-run-onchain-evidence.sh",
      "b417-evidence-pack-verify.sh",
    ]) {
      expect(readFileSync(join(root, "scripts/ops", s), "utf8").length).toBeGreaterThan(20);
    }
  });
});
