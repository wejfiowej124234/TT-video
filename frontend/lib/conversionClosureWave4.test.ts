import { describe, expect, it } from "vitest";
import {
  PES_WAVE4_ID,
  WAVE4_P0_CLOSURES,
  buildBeforeAfterFunnelMatrix,
  buildDropoffDeltaReport,
} from "./conversionClosureWave4";

describe("conversionClosureWave4", () => {
  it("exposes stable wave4 id and three P0 closures", () => {
    expect(PES_WAVE4_ID).toBe("product-enhancement-wave4-closure-20260607");
    expect(WAVE4_P0_CLOSURES).toHaveLength(3);
    expect(WAVE4_P0_CLOSURES.map((c) => c.id)).toEqual(["CC-P0-01", "CC-P0-02", "CC-P0-03"]);
  });

  it("builds before/after funnel matrix with positive deltas", () => {
    const matrix = buildBeforeAfterFunnelMatrix();
    expect(matrix).toHaveLength(3);
    for (const row of matrix) {
      expect(row.deltaPp).toBeGreaterThan(0);
      expect(row.afterTargetDropoff).toBeLessThan(row.beforeDropoff);
    }
  });

  it("builds drop-off delta report for top three pairs", () => {
    const report = buildDropoffDeltaReport();
    expect(report).toHaveLength(3);
    const orderRow = report.find((r) => r.pair === "find_guide_order");
    expect(orderRow?.deltaPp).toBeCloseTo(20.91, 1);
  });
});
