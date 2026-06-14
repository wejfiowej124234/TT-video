import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildPesJourneyReviewReport,
  synthesizeRujrRuns,
} from "./pesJourneyReviewAggregate";
import {
  PES_FRICTION_CATALOG,
  PES_RUJR_RUNS_PER_PERSONA,
  PES_RUJR_TARGET_RUNS,
} from "./pesJourneyReviewModel";

describe("pesJourneyReviewAggregate", () => {
  it("targets 48 runs across four personas", () => {
    expect(PES_RUJR_TARGET_RUNS).toBe(48);
    expect(PES_RUJR_RUNS_PER_PERSONA * 4).toBe(PES_RUJR_TARGET_RUNS);
  });

  it("builds top-10 dropoffs, frictions, and ux backlog from runs", () => {
    const runs = synthesizeRujrRuns(12);
    expect(runs).toHaveLength(48);
    const report = buildPesJourneyReviewReport(runs);
    expect(report.totalRuns).toBe(48);
    expect(report.top10Dropoffs.length).toBeLessThanOrEqual(10);
    expect(report.top10Frictions.length).toBe(10);
    expect(report.uxBacklog.length).toBe(10);
    expect(report.wave4RecommendationKeys.length).toBeGreaterThan(0);
  });

  it("friction catalog has twelve registered items", () => {
    expect(PES_FRICTION_CATALOG).toHaveLength(12);
  });

  it("exports RUJR evidence JSON for runbook", () => {
    const runs = synthesizeRujrRuns(12);
    const report = buildPesJourneyReviewReport(runs);
    const dir = path.join(process.cwd(), "evidence", "pes-rujr-20260607");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "rujr-report-synth.json"), JSON.stringify(report, null, 2), "utf8");
    expect(fs.existsSync(path.join(dir, "rujr-report-synth.json"))).toBe(true);
  });
});
