import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { WAVE4_RUJR_BASELINE_DROP_OFFS } from "./conversionClosureWave4";
import { synthesizeRujrRuns } from "./pesJourneyReviewAggregate";
import { synthesizeWave41Runs } from "./wave4ValidationSynth";
import {
  PES_WAVE4_1_ID,
  buildWave4ValidationReport,
  buildWave5DecisionPackage,
} from "./wave4Validation";

describe("wave4Validation", () => {
  it("exposes stable wave4.1 id", () => {
    expect(PES_WAVE4_1_ID).toBe("pes-wave4-1-validation-20260607");
  });

  it("shows improvement vs RUJR baseline on 50 post-wave4 runs", () => {
    const before = buildWave4ValidationReport(synthesizeRujrRuns(12));
    const after = buildWave4ValidationReport(synthesizeWave41Runs(50));
    for (const pair of ["visit_register", "identity_post", "find_guide_order"] as const) {
      const b = before.actualFunnelMatrix.find((r) => r.pair === pair)!;
      const a = after.actualFunnelMatrix.find((r) => r.pair === pair)!;
      expect(a.actualDropoffPct).toBeLessThanOrEqual(b.baselineDropoffPct + 0.01);
    }
    expect(after.totalRuns).toBe(50);
  });

  it("exports validation evidence and wave5 decision package", () => {
    const runs = synthesizeWave41Runs(50);
    const validation = buildWave4ValidationReport(runs);
    const wave5 = buildWave5DecisionPackage(validation, { dataSource: "synth" });
    const dir = path.join(process.cwd(), "evidence", "pes-wave41-validation-20260607");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "wave41-validation-synth.json"),
      JSON.stringify({ validation, wave5, baseline: WAVE4_RUJR_BASELINE_DROP_OFFS }, null, 2),
    );
    expect(validation.dropoffDelta.length).toBe(3);
    expect(["NO_GO", "CONDITIONAL_GO", "GO"]).toContain(wave5.decision);
    expect(wave5.wave5Blocked).toBe(true);
    expect(wave5.machineKeys.PES_WAVE5).toBe("BLOCKED");
  });
});
