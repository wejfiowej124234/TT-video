/**
 * PES Wave 4.1 · Validation Sprint
 * 对比 RUJR 基线 vs Wave 4 后实际漏斗 — 产出 Wave 5 决策包
 */
import { buildConversionAnalyticsSnapshot } from "./conversionAnalyticsLayer";
import {
  WAVE4_RUJR_BASELINE_DROP_OFFS,
  WAVE4_TARGET_DROP_OFFS,
  WAVE4_P0_CLOSURES,
  PES_WAVE4_ID,
  type Wave4FunnelPair,
} from "./conversionClosureWave4";
import type { PesJourneyRunRecord } from "./pesJourneyReviewAggregate";
import { buildPesJourneyReviewReport } from "./pesJourneyReviewAggregate";
import { PES_RUJR_ID } from "./pesJourneyReviewModel";

export const PES_WAVE4_1_ID = "pes-wave4-1-validation-20260607" as const;
export const PES_WAVE5_DECISION = "PENDING_REAL_DATA" as const;

export type Wave5GoDecision = "NO_GO" | "CONDITIONAL_GO" | "GO";

const PAIR_STAGES: Record<
  Wave4FunnelPair,
  { from: "visit" | "identity" | "find_guide"; to: "register" | "post" | "order" }
> = {
  visit_register: { from: "visit", to: "register" },
  identity_post: { from: "identity", to: "post" },
  find_guide_order: { from: "find_guide", to: "order" },
};

export type ActualFunnelMatrixRow = {
  pair: Wave4FunnelPair;
  fromStage: string;
  toStage: string;
  baselineDropoffPct: number;
  wave4TargetDropoffPct: number;
  actualDropoffPct: number;
  actualDeltaVsBaselinePp: number;
  targetDeltaPp: number;
  metTarget: boolean;
  improvedVsBaseline: boolean;
  closureId: string;
};

export type ActualDropoffDeltaRow = {
  pair: Wave4FunnelPair;
  baselinePct: number;
  actualPct: number;
  targetPct: number;
  actualImprovementPp: number;
  targetImprovementPp: number;
  pctOfTargetAchieved: number;
  verdict: "MET" | "PARTIAL" | "MISS";
};

export type Wave4ValidationReport = {
  wave41Id: typeof PES_WAVE4_1_ID;
  wave4Id: typeof PES_WAVE4_ID;
  rujrBaselineId: typeof PES_RUJR_ID;
  generatedAt: number;
  totalRuns: number;
  totalEvents: number;
  uniqueSessions: number;
  actualFunnelMatrix: ActualFunnelMatrixRow[];
  dropoffDelta: ActualDropoffDeltaRow[];
  closuresMet: number;
  closuresPartial: number;
  closuresMiss: number;
};

export type Wave5DecisionPackage = {
  wave41Id: typeof PES_WAVE4_1_ID;
  decision: Wave5GoDecision;
  wave5Blocked: boolean;
  rationaleKey: string;
  validationSummary: {
    totalRuns: number;
    pairsMet: number;
    pairsPartial: number;
    pairsMiss: number;
  };
  recommendedWave5Themes: string[];
  machineKeys: {
    PES_WAVE5: string;
    PES_WAVE5_DECISION: string;
  };
};

function dropoffForPair(
  snapshot: ReturnType<typeof buildConversionAnalyticsSnapshot>,
  pair: Wave4FunnelPair,
): number {
  const { from, to } = PAIR_STAGES[pair];
  const row = snapshot.dropoffMatrix.find((r) => r.fromStageId === from && r.toStageId === to);
  if (!row || row.fromSessions === 0) return 1;
  const retention = Math.min(1, row.toSessions / row.fromSessions);
  return 1 - retention;
}

export function buildWave4ValidationReport(
  runs: readonly PesJourneyRunRecord[],
): Wave4ValidationReport {
  const allEvents = runs.flatMap((r) => r.events);
  const snapshot = buildConversionAnalyticsSnapshot(allEvents);
  const review = buildPesJourneyReviewReport(runs);

  const actualFunnelMatrix: ActualFunnelMatrixRow[] = WAVE4_P0_CLOSURES.map((c) => {
    const baseline = WAVE4_RUJR_BASELINE_DROP_OFFS[c.funnelPair];
    const target = WAVE4_TARGET_DROP_OFFS[c.funnelPair];
    const actual = dropoffForPair(snapshot, c.funnelPair);
    const baselinePct = baseline * 100;
    const actualPct = actual * 100;
    const targetPct = target * 100;
    return {
      pair: c.funnelPair,
      fromStage: c.fromStage,
      toStage: c.toStage,
      baselineDropoffPct: baselinePct,
      wave4TargetDropoffPct: targetPct,
      actualDropoffPct: actualPct,
      actualDeltaVsBaselinePp: baselinePct - actualPct,
      targetDeltaPp: (baseline - target) * 100,
      metTarget: actual <= target,
      improvedVsBaseline: actual < baseline,
      closureId: c.id,
    };
  });

  const dropoffDelta: ActualDropoffDeltaRow[] = actualFunnelMatrix.map((row) => {
    const baseline = row.baselineDropoffPct;
    const actual = row.actualDropoffPct;
    const target = row.wave4TargetDropoffPct;
    const actualImprovement = baseline - actual;
    const targetImprovement = baseline - target;
    const pctOfTarget =
      targetImprovement > 0 ? Math.max(0, (actualImprovement / targetImprovement) * 100) : 0;
    let verdict: ActualDropoffDeltaRow["verdict"] = "MISS";
    if (row.metTarget) verdict = "MET";
    else if (row.improvedVsBaseline && pctOfTarget >= 50) verdict = "PARTIAL";
    return {
      pair: row.pair,
      baselinePct: baseline,
      actualPct: actual,
      targetPct: target,
      actualImprovementPp: actualImprovement,
      targetImprovementPp: targetImprovement,
      pctOfTargetAchieved: pctOfTarget,
      verdict,
    };
  });

  const closuresMet = dropoffDelta.filter((d) => d.verdict === "MET").length;
  const closuresPartial = dropoffDelta.filter((d) => d.verdict === "PARTIAL").length;
  const closuresMiss = dropoffDelta.filter((d) => d.verdict === "MISS").length;

  return {
    wave41Id: PES_WAVE4_1_ID,
    wave4Id: PES_WAVE4_ID,
    rujrBaselineId: PES_RUJR_ID,
    generatedAt: Date.now(),
    totalRuns: runs.length,
    totalEvents: allEvents.length,
    uniqueSessions: review.uniqueSessions,
    actualFunnelMatrix,
    dropoffDelta,
    closuresMet,
    closuresPartial,
    closuresMiss,
  };
}

export type Wave41DataSource = "browser" | "synth";

export function buildWave5DecisionPackage(
  validation: Wave4ValidationReport,
  opts?: { dataSource?: Wave41DataSource },
): Wave5DecisionPackage {
  const dataSource = opts?.dataSource ?? "browser";

  if (dataSource === "synth") {
    return {
      wave41Id: PES_WAVE4_1_ID,
      decision: "NO_GO",
      wave5Blocked: true,
      rationaleKey: "pes41_wave5_rationale_await_browser",
      validationSummary: {
        totalRuns: validation.totalRuns,
        pairsMet: validation.closuresMet,
        pairsPartial: validation.closuresPartial,
        pairsMiss: validation.closuresMiss,
      },
      recommendedWave5Themes: [],
      machineKeys: {
        PES_WAVE5: "BLOCKED",
        PES_WAVE5_DECISION: "NO_GO",
      },
    };
  }

  const { closuresMet, closuresPartial, closuresMiss, totalRuns } = validation;
  const pairsMet = closuresMet;
  const pairsPartial = closuresPartial;
  const pairsMiss = closuresMiss;

  let decision: Wave5GoDecision = "NO_GO";
  let rationaleKey = "pes41_wave5_rationale_no_go";
  const recommendedWave5Themes: string[] = [];

  if (totalRuns < 20) {
    rationaleKey = "pes41_wave5_rationale_insufficient_runs";
  } else if (pairsMet >= 2) {
    decision = "GO";
    rationaleKey = "pes41_wave5_rationale_go";
    recommendedWave5Themes.push("pes_rujr_fr09_wave4", "pes_rujr_fr07_wave4", "pes_rujr_fr10_wave4");
  } else if (pairsMet + pairsPartial >= 2 && pairsMiss <= 1) {
    decision = "CONDITIONAL_GO";
    rationaleKey = "pes41_wave5_rationale_conditional";
    for (const row of validation.dropoffDelta.filter((d) => d.verdict === "MISS")) {
      if (row.pair === "find_guide_order") recommendedWave5Themes.push("pes4_closure_market_order");
      if (row.pair === "identity_post") recommendedWave5Themes.push("pes4_closure_identity_post");
      if (row.pair === "visit_register") recommendedWave5Themes.push("pes4_closure_visit_register");
    }
  } else {
    for (const row of validation.dropoffDelta) {
      if (row.verdict !== "MET") {
        const theme = WAVE4_P0_CLOSURES.find((c) => c.funnelPair === row.pair)?.titleKey;
        if (theme) recommendedWave5Themes.push(theme);
      }
    }
  }

  const wave5Blocked = decision === "NO_GO";

  return {
    wave41Id: PES_WAVE4_1_ID,
    decision,
    wave5Blocked,
    rationaleKey,
    validationSummary: {
      totalRuns,
      pairsMet,
      pairsPartial,
      pairsMiss,
    },
    recommendedWave5Themes: [...new Set(recommendedWave5Themes)],
    machineKeys: {
      PES_WAVE5: wave5Blocked ? "BLOCKED" : "READY_FOR_DECISION",
      PES_WAVE5_DECISION: decision,
    },
  };
}
