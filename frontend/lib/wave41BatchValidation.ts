/**
 * PES Wave 4.1 · 分批浏览器验证 SSOT
 * smoke(10) → 5×batch(10) → merge → 达标才更新 Wave 5 决策包
 */
import * as fs from "node:fs";
import * as path from "node:path";
import type { PesJourneyRunRecord } from "./pesJourneyReviewAggregate";
import {
  buildWave4ValidationReport,
  buildWave5DecisionPackage,
  type Wave4ValidationReport,
  type Wave5DecisionPackage,
  PES_WAVE4_1_ID,
} from "./wave4Validation";

export const WAVE41_EVIDENCE_DIRNAME = "pes-wave41-validation-20260607" as const;
export const WAVE41_SMOKE_RUNS = 10 as const;
export const WAVE41_BATCH_COUNT = 5 as const;
export const WAVE41_BATCH_SIZE = 10 as const;
export const WAVE41_TOTAL_TARGET = 50 as const;
export const WAVE41_MIN_RUNS_FOR_AGGREGATE = 48 as const;

export const WAVE41_SMOKE_JSONL = "journey-runs-smoke.jsonl" as const;
export const WAVE41_MERGED_JSONL = "journey-runs.jsonl" as const;
export const WAVE41_VALIDATION_JSON = "wave41-validation.json" as const;
export const WAVE41_WAVE5_JSON = "wave5-decision-package.json" as const;
export const WAVE41_WAVE5_BLOCKED_JSON = "wave5-decision-package.blocked.json" as const;

export type Wave41Mode = "smoke" | "batch" | "aggregate";

export function resolveWave41Mode(raw?: string): Wave41Mode {
  const m = (raw ?? "batch").trim().toLowerCase();
  if (m === "smoke" || m === "batch" || m === "aggregate") return m;
  return "batch";
}

export function wave41EvidenceDir(cwd = process.cwd()): string {
  return path.join(cwd, "evidence", WAVE41_EVIDENCE_DIRNAME);
}

export function batchJsonlFilename(batchIndex: number): string {
  const n = String(batchIndex).padStart(2, "0");
  return `journey-runs-batch-${n}.jsonl`;
}

export function batchJsonlPath(batchIndex: number, cwd = process.cwd()): string {
  return path.join(wave41EvidenceDir(cwd), batchJsonlFilename(batchIndex));
}

export function smokeJsonlPath(cwd = process.cwd()): string {
  return path.join(wave41EvidenceDir(cwd), WAVE41_SMOKE_JSONL);
}

export function mergedJsonlPath(cwd = process.cwd()): string {
  return path.join(wave41EvidenceDir(cwd), WAVE41_MERGED_JSONL);
}

export function mergeBatchJsonlInDir(dir: string): PesJourneyRunRecord[] {
  const merged: PesJourneyRunRecord[] = [];
  for (let b = 1; b <= WAVE41_BATCH_COUNT; b++) {
    merged.push(...readJsonlRuns(path.join(dir, batchJsonlFilename(b))));
  }
  return merged;
}

export function readJsonlRuns(filePath: string): PesJourneyRunRecord[] {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, "utf8").trim().split("\n").filter(Boolean);
  return lines.map((l) => JSON.parse(l) as PesJourneyRunRecord);
}

export function appendRunJsonl(filePath: string, record: PesJourneyRunRecord): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(record)}\n`, "utf8");
}

export function writeJsonlRuns(filePath: string, runs: PesJourneyRunRecord[]): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, runs.map((r) => JSON.stringify(r)).join("\n") + (runs.length ? "\n" : ""), "utf8");
}

/** 合并 batch-01..batch-N → journey-runs.jsonl */
export function mergeWave41BatchJsonl(cwd = process.cwd()): PesJourneyRunRecord[] {
  const dir = wave41EvidenceDir(cwd);
  const merged = mergeBatchJsonlInDir(dir);
  writeJsonlRuns(mergedJsonlPath(cwd), merged);
  return merged;
}

export type SmokeEventsCheck = {
  ok: boolean;
  totalRuns: number;
  runsWithEvents: number;
  totalEvents: number;
  minEventsPerRun: number;
};

/** smoke 阶段：埋点必须非空 */
export function checkSmokeEventsNonEmpty(runs: readonly PesJourneyRunRecord[]): SmokeEventsCheck {
  const totalEvents = runs.reduce((n, r) => n + r.events.length, 0);
  const runsWithEvents = runs.filter((r) => r.events.length > 0).length;
  const minEventsPerRun = runs.length
    ? Math.min(...runs.map((r) => r.events.length))
    : 0;
  const ok = runs.length >= WAVE41_SMOKE_RUNS && runsWithEvents >= Math.ceil(runs.length * 0.8) && totalEvents >= runs.length;
  return { ok, totalRuns: runs.length, runsWithEvents, totalEvents, minEventsPerRun };
}

export type Wave41MatrixGateResult = {
  qualified: boolean;
  reasons: string[];
};

/** Actual Funnel Matrix 达标：≥48 轮 · 有埋点 · 三条路径均改善且至少 2 条达目标 */
export function evaluateWave41MatrixGate(validation: Wave4ValidationReport): Wave41MatrixGateResult {
  const reasons: string[] = [];
  if (validation.totalRuns < WAVE41_MIN_RUNS_FOR_AGGREGATE) {
    reasons.push(`runs_${validation.totalRuns}_lt_${WAVE41_MIN_RUNS_FOR_AGGREGATE}`);
  }
  if (validation.totalEvents <= 0) {
    reasons.push("total_events_zero");
  }
  const improved = validation.actualFunnelMatrix.filter((r) => r.improvedVsBaseline).length;
  if (improved < 3) {
    reasons.push(`improved_pairs_${improved}_lt_3`);
  }
  if (validation.closuresMet < 2) {
    reasons.push(`closures_met_${validation.closuresMet}_lt_2`);
  }
  const qualified = reasons.length === 0;
  return { qualified, reasons };
}

export type Wave41AggregateResult = {
  validation: Wave4ValidationReport;
  matrixGate: Wave41MatrixGateResult;
  wave5: Wave5DecisionPackage;
  wave5Updated: boolean;
};

const BLOCKED_WAVE5: Wave5DecisionPackage = {
  wave41Id: PES_WAVE4_1_ID,
  decision: "NO_GO",
  wave5Blocked: true,
  rationaleKey: "pes41_wave5_rationale_await_browser",
  validationSummary: { totalRuns: 0, pairsMet: 0, pairsPartial: 0, pairsMiss: 0 },
  recommendedWave5Themes: [],
  machineKeys: { PES_WAVE5: "BLOCKED", PES_WAVE5_DECISION: "NO_GO" },
};

/** 写入 wave41-validation.json；仅 matrix 达标时覆盖 wave5-decision-package.json */
export function writeWave41AggregateArtifacts(
  runs: readonly PesJourneyRunRecord[],
  cwd = process.cwd(),
): Wave41AggregateResult {
  const dir = wave41EvidenceDir(cwd);
  fs.mkdirSync(dir, { recursive: true });
  const validation = buildWave4ValidationReport(runs);
  const matrixGate = evaluateWave41MatrixGate(validation);
  fs.writeFileSync(path.join(dir, WAVE41_VALIDATION_JSON), JSON.stringify(validation, null, 2), "utf8");

  let wave5: Wave5DecisionPackage;
  let wave5Updated = false;
  if (matrixGate.qualified) {
    wave5 = buildWave5DecisionPackage(validation, { dataSource: "browser" });
    fs.writeFileSync(path.join(dir, WAVE41_WAVE5_JSON), JSON.stringify(wave5, null, 2), "utf8");
    wave5Updated = true;
  } else {
    wave5 = {
      ...BLOCKED_WAVE5,
      rationaleKey: "pes41_wave5_rationale_matrix_not_qualified",
      validationSummary: {
        totalRuns: validation.totalRuns,
        pairsMet: validation.closuresMet,
        pairsPartial: validation.closuresPartial,
        pairsMiss: validation.closuresMiss,
      },
      machineKeys: {
        PES_WAVE5: "BLOCKED",
        PES_WAVE5_DECISION: "NO_GO",
      },
    };
    fs.writeFileSync(path.join(dir, WAVE41_WAVE5_BLOCKED_JSON), JSON.stringify({ ...wave5, matrixGate }, null, 2), "utf8");
    const staleGo = path.join(dir, WAVE41_WAVE5_JSON);
    if (fs.existsSync(staleGo)) {
      fs.unlinkSync(staleGo);
    }
  }
  return { validation, matrixGate, wave5, wave5Updated };
}

/** 按批次分配 persona/runIndex（全局 0..49） */
export function wave41RunPlan(
  globalRunIndex: number,
): { persona: "traveler" | "guide" | "merchant" | "govern"; runIndex: number } {
  const personas = ["traveler", "guide", "merchant", "govern"] as const;
  const persona = personas[globalRunIndex % personas.length]!;
  const runIndex = Math.floor(globalRunIndex / personas.length);
  return { persona, runIndex };
}
