/**
 * PES Wave 4.1 · 分批浏览器验证
 *
 * smoke:  PES_WAVE41_MODE=smoke npx playwright test e2e/pes-wave4-validation.spec.ts --project=chromium
 * batch:  PES_WAVE41_MODE=batch PES_WAVE41_BATCH=1 npx playwright test ...
 * merge:  PES_WAVE41_MODE=aggregate npx playwright test ... --grep aggregate
 */
import { test, expect } from "@playwright/test";
import * as fs from "node:fs";

import {
  WAVE41_SMOKE_RUNS,
  appendRunJsonl,
  batchJsonlPath,
  checkSmokeEventsNonEmpty,
  mergeWave41BatchJsonl,
  resolveWave41Mode,
  smokeJsonlPath,
  wave41EvidenceDir,
  wave41RunPlan,
  writeWave41AggregateArtifacts,
} from "../lib/wave41BatchValidation";
import { clearPesAnalyticsStorage, runPesWave41Journey } from "./helpers/pesWave41Journey";
import { gotoSmoke } from "./helpers/smoke-nav";

const MODE = resolveWave41Mode(process.env.PES_WAVE41_MODE);
const RUNS = Number(process.env.PES_WAVE41_RUNS ?? String(WAVE41_SMOKE_RUNS));
const BATCH = Number(process.env.PES_WAVE41_BATCH ?? "1");
const BATCH_OFFSET = (Math.max(1, BATCH) - 1) * RUNS;

function outputJsonl(): string {
  if (MODE === "smoke") return smokeJsonlPath();
  return batchJsonlPath(BATCH);
}

test.describe(`PES Wave 4.1 @pes-wave41 mode=${MODE}`, () => {
  test.describe.configure({ mode: "serial", timeout: 120_000 });

  if (MODE === "smoke" || MODE === "batch") {
    test.beforeAll(() => {
      fs.mkdirSync(wave41EvidenceDir(), { recursive: true });
      fs.writeFileSync(outputJsonl(), "", "utf8");
    });

    for (let i = 0; i < RUNS; i++) {
      const globalIndex = MODE === "smoke" ? i : BATCH_OFFSET + i;
      test(`run ${globalIndex + 1} · ${MODE} ${i + 1}/${RUNS}`, async ({ page, context }) => {
        const { persona, runIndex } = wave41RunPlan(globalIndex);
        await context.clearCookies();
        await gotoSmoke(page, "/");
        await clearPesAnalyticsStorage(page);
        const record = await runPesWave41Journey(page, persona, runIndex);
        expect(record.steps.length).toBeGreaterThan(0);
        appendRunJsonl(outputJsonl(), record);
      });
    }

    if (MODE === "smoke") {
      test("smoke: analytics events must be non-empty", async () => {
        const runs = fs
          .readFileSync(smokeJsonlPath(), "utf8")
          .trim()
          .split("\n")
          .filter(Boolean)
          .map((l) => JSON.parse(l));
        const check = checkSmokeEventsNonEmpty(runs);
        expect(check.ok, JSON.stringify(check)).toBe(true);
      });
    }
  }

  if (MODE === "aggregate") {
    test("aggregate: merge batches and gate wave5", async () => {
      const runs = mergeWave41BatchJsonl();
      expect(runs.length).toBeGreaterThanOrEqual(48);
      const result = writeWave41AggregateArtifacts(runs);
      expect(result.validation.actualFunnelMatrix).toHaveLength(3);
      if (result.matrixGate.qualified) {
        expect(result.wave5Updated).toBe(true);
        expect(result.wave5.machineKeys.PES_WAVE5).not.toBe("BLOCKED");
      } else {
        expect(result.wave5Updated).toBe(false);
        expect(result.wave5.machineKeys.PES_WAVE5).toBe("BLOCKED");
      }
    });
  }
});
