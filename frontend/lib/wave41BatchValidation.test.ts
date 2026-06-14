import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { synthesizeWave41Runs } from "./wave4ValidationSynth";
import {
  WAVE41_BATCH_COUNT,
  WAVE41_SMOKE_RUNS,
  WAVE41_TOTAL_TARGET,
  batchJsonlFilename,
  checkSmokeEventsNonEmpty,
  evaluateWave41MatrixGate,
  mergeBatchJsonlInDir,
  writeWave41AggregateArtifacts,
} from "./wave41BatchValidation";
import { buildWave4ValidationReport } from "./wave4Validation";

describe("wave41BatchValidation", () => {
  const testDir = path.join(process.cwd(), "evidence", ".wave41-test-tmp");

  beforeEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it("defines smoke + 5 batch × 10 = 50 runs", () => {
    expect(WAVE41_SMOKE_RUNS).toBe(10);
    expect(WAVE41_BATCH_COUNT * 10).toBe(WAVE41_TOTAL_TARGET);
  });

  it("merges batch jsonl files", () => {
    for (let b = 1; b <= 5; b++) {
      const runs = synthesizeWave41Runs(10).map((r, i) => ({
        ...r,
        runId: `batch${b}-${i}`,
      }));
      fs.writeFileSync(
        path.join(testDir, batchJsonlFilename(b)),
        runs.map((r) => JSON.stringify(r)).join("\n") + "\n",
      );
    }
    const merged = mergeBatchJsonlInDir(testDir);
    expect(merged.length).toBe(50);
  });

  it("gates wave5 update on qualified matrix", () => {
    const runs = synthesizeWave41Runs(50);
    const validation = buildWave4ValidationReport(runs);
    const gate = evaluateWave41MatrixGate(validation);
    expect(checkSmokeEventsNonEmpty(runs).ok).toBe(true);
    const result = writeWave41AggregateArtifacts(runs, testDir);
    expect(fs.existsSync(path.join(testDir, "evidence", "pes-wave41-validation-20260607", "wave41-validation.json"))).toBe(
      true,
    );
    if (gate.qualified) {
      expect(result.wave5Updated).toBe(true);
    } else {
      expect(result.wave5Updated).toBe(false);
    }
  });
});
