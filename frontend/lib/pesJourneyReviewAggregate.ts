/**
 * RUJR · 聚合走查结果 → Top-10 Drop-off / Friction / UX Backlog
 */
import type { ConversionFunnelStageId } from "./conversionFunnelModel";
import { CONVERSION_FUNNEL_STAGES } from "./conversionFunnelModel";
import {
  buildConversionAnalyticsSnapshot,
  type PesAnalyticsEvent,
  type DropoffRow,
} from "./conversionAnalyticsLayer";
import {
  PES_FRICTION_CATALOG,
  type PesFrictionCatalogEntry,
  type PesFrictionId,
  type PesPersonaId,
  PES_RUJR_ID,
} from "./pesJourneyReviewModel";

export type JourneyStepOutcome = "ok" | "login_gate" | "element_missing" | "timeout" | "skipped";

export type PesJourneyStepResult = {
  stepId: string;
  route: string;
  outcome: JourneyStepOutcome;
  funnelStage?: ConversionFunnelStageId;
};

export type PesJourneyRunRecord = {
  runId: string;
  persona: PesPersonaId;
  runIndex: number;
  sessionId: string;
  steps: PesJourneyStepResult[];
  events: PesAnalyticsEvent[];
  frictionsObserved: PesFrictionId[];
};

export type RankedDropoff = DropoffRow & {
  rank: number;
  dropoffPct: number;
  evidence: string;
};

export type RankedFriction = PesFrictionCatalogEntry & {
  rank: number;
  observedRuns: number;
  observedRate: number;
};

export type UxBacklogItem = {
  id: string;
  priority: "P0" | "P1" | "P2";
  titleKey: string;
  wave4ThemeKey: string;
  personas: PesPersonaId[];
  sourceFrictionIds: PesFrictionId[];
};

export type PesJourneyReviewReport = {
  rujrId: typeof PES_RUJR_ID;
  generatedAt: number;
  totalRuns: number;
  totalEvents: number;
  uniqueSessions: number;
  snapshot: ReturnType<typeof buildConversionAnalyticsSnapshot>;
  top10Dropoffs: RankedDropoff[];
  top10Frictions: RankedFriction[];
  uxBacklog: UxBacklogItem[];
  wave4RecommendationKeys: string[];
};

const OUTCOME_FRICTION_MAP: Partial<Record<JourneyStepOutcome, PesFrictionId[]>> = {
  login_gate: ["FR-04"],
  element_missing: ["FR-01", "FR-09"],
  timeout: ["FR-08"],
};

const STAGE_DROP_EVIDENCE: Record<string, string> = {
  "visit→register": "pes_rujr_drop_visit_register",
  "register→identity": "pes_rujr_drop_register_identity",
  "identity→post": "pes_rujr_drop_identity_post",
  "post→find_guide": "pes_rujr_drop_post_market",
  "find_guide→order": "pes_rujr_drop_market_order",
  "order→govern": "pes_rujr_drop_order_govern",
};

function stagePairKey(from: ConversionFunnelStageId, to: ConversionFunnelStageId): string {
  return `${from}→${to}`;
}

function inferFrictionsFromRun(run: PesJourneyRunRecord): PesFrictionId[] {
  const set = new Set<PesFrictionId>(run.frictionsObserved);
  for (const step of run.steps) {
    const mapped = OUTCOME_FRICTION_MAP[step.outcome];
    if (mapped) mapped.forEach((id) => set.add(id));
    if (step.route.includes("/auth/") && step.outcome === "login_gate") set.add("FR-04");
    if (step.route === "/provider/register" && step.outcome === "login_gate") set.add("FR-04");
    if (step.route === "/guide/register" && step.outcome === "login_gate") set.add("FR-05");
    if (step.route === "/community" && step.outcome === "login_gate") set.add("FR-04");
    if (step.route === "/me/identities" && step.outcome === "login_gate") set.add("FR-04");
    if (step.route === "/orders" && step.outcome === "login_gate") set.add("FR-03");
    if (step.route.includes("governance") && step.outcome === "element_missing") set.add("FR-07");
  }
  if (run.persona === "merchant") {
    const onboarding = run.steps.find((s) => s.route.includes("/me/onboarding"));
    if (onboarding?.outcome === "login_gate") set.add("FR-06");
  }
  return [...set];
}

export function buildPesJourneyReviewReport(runs: readonly PesJourneyRunRecord[]): PesJourneyReviewReport {
  const allEvents = runs.flatMap((r) => r.events);
  const snapshot = buildConversionAnalyticsSnapshot(allEvents);

  const top10Dropoffs: RankedDropoff[] = [...snapshot.dropoffMatrix]
    .map((row) => {
      const retention =
        row.fromSessions > 0 ? Math.min(1, row.toSessions / row.fromSessions) : 0;
      const dropoffRate = row.fromSessions > 0 ? 1 - retention : 0;
      return { ...row, dropoffRate, retentionRate: retention };
    })
    .filter((row) => row.fromSessions > 0)
    .sort((a, b) => b.dropoffRate - a.dropoffRate || b.fromSessions - a.fromSessions)
    .slice(0, 10)
    .map((row, i) => ({
      ...row,
      rank: i + 1,
      dropoffPct: row.dropoffRate * 100,
      evidence: STAGE_DROP_EVIDENCE[stagePairKey(row.fromStageId, row.toStageId)] ?? "pes_rujr_drop_generic",
    }));

  const frictionRuns = new Map<PesFrictionId, number>();
  for (const run of runs) {
    for (const id of inferFrictionsFromRun(run)) {
      frictionRuns.set(id, (frictionRuns.get(id) ?? 0) + 1);
    }
  }

  const totalRuns = runs.length || 1;
  const top10Frictions: RankedFriction[] = PES_FRICTION_CATALOG.map((entry) => ({
    ...entry,
    rank: 0,
    observedRuns: frictionRuns.get(entry.id) ?? 0,
    observedRate: (frictionRuns.get(entry.id) ?? 0) / totalRuns,
  }))
    .sort(
      (a, b) =>
        b.observedRate - a.observedRate ||
        (a.severity === "P0" ? 0 : a.severity === "P1" ? 1 : 2) -
          (b.severity === "P0" ? 0 : b.severity === "P1" ? 1 : 2),
    )
    .slice(0, 10)
    .map((row, i) => ({ ...row, rank: i + 1 }));

  const uxBacklog: UxBacklogItem[] = top10Frictions.slice(0, 10).map((f, i) => ({
    id: `UX-${String(i + 1).padStart(2, "0")}`,
    priority: f.severity,
    titleKey: f.wave4CandidateKey,
    wave4ThemeKey: f.wave4CandidateKey,
    personas: [...f.personas],
    sourceFrictionIds: [f.id],
  }));

  const wave4RecommendationKeys = [...new Set(uxBacklog.map((u) => u.wave4ThemeKey))].slice(0, 5);

  return {
    rujrId: PES_RUJR_ID,
    generatedAt: Date.now(),
    totalRuns: runs.length,
    totalEvents: allEvents.length,
    uniqueSessions: snapshot.uniqueSessions,
    snapshot,
    top10Dropoffs,
    top10Frictions,
    uxBacklog,
    wave4RecommendationKeys,
  };
}

function pushEvent(
  events: PesAnalyticsEvent[],
  n: number,
  sessionId: string,
  touchpoint: PesAnalyticsEvent["touchpoint"],
  category: PesAnalyticsEvent["category"],
  stageId: ConversionFunnelStageId,
  extra?: Partial<PesAnalyticsEvent>,
): void {
  events.push({
    id: `e-${n}-${events.length}`,
    ts: Date.now(),
    wave3Id: "product-enhancement-wave3-analytics-20260607",
    sessionId,
    touchpoint,
    category,
    stageId,
    ...extra,
  });
}

/** 合成走查数据（契约 / 无浏览器环境 · 模拟 48 次漏斗分布） */
export function synthesizeRujrRuns(countPerPersona = 12): PesJourneyRunRecord[] {
  const personas: PesPersonaId[] = ["traveler", "guide", "merchant", "govern"];
  const runs: PesJourneyRunRecord[] = [];
  let n = 0;
  for (const persona of personas) {
    for (let i = 0; i < countPerPersona; i++) {
      n += 1;
      const sessionId = `rujr-synth-${persona}-${i}`;
      const events: PesAnalyticsEvent[] = [];
      const touchpoint =
        persona === "govern"
          ? "governance"
          : persona === "merchant"
            ? "merchant"
            : persona === "guide"
              ? "guide"
              : "home";

      pushEvent(events, n, sessionId, touchpoint, "touchpoint_view", "visit");

      const depth =
        persona === "traveler"
          ? i % 6
          : persona === "guide"
            ? Math.min(i % 5, 3)
            : persona === "merchant"
              ? Math.min(i % 4, 2)
              : Math.min(i % 4, 3);

      if (depth >= 1) pushEvent(events, n, sessionId, "home", "registration_intent", "register", { href: "/auth/register" });
      if (depth >= 2) pushEvent(events, n, sessionId, "merchant", "identity_intent", "identity", { href: "/me/identities" });
      if (depth >= 3) pushEvent(events, n, sessionId, "community", "touchpoint_view", "post");
      if (depth >= 4) pushEvent(events, n, sessionId, "market", "touchpoint_view", "find_guide");
      if (depth >= 5) pushEvent(events, n, sessionId, "market", "cta_click", "order", { href: "/orders", ctaId: "orders" });

      if (persona === "guide" && i % 2 === 0) {
        pushEvent(events, n, sessionId, "guide", "guide_recruit_click", "register", { href: "/guide/register" });
      }
      if (persona === "govern" && i % 2 === 0) {
        pushEvent(events, n, sessionId, "governance", "governance_participation", "govern", { href: "/governance/proposals" });
      }
      if (i % 7 === 0) {
        pushEvent(events, n, sessionId, touchpoint, "escrow_trust_click", "find_guide", { href: "/trust" });
      }

      const loginGate = persona !== "govern" && i % 5 === 0;
      const steps: PesJourneyStepResult[] = [
        { stepId: "s1", route: "/", outcome: "ok", funnelStage: "visit" },
        {
          stepId: "s2",
          route: persona === "guide" ? "/guide/register" : "/auth/register",
          outcome: loginGate ? "login_gate" : "ok",
          funnelStage: "register",
        },
      ];
      if (persona === "traveler" && i % 4 === 1) {
        steps.push({ stepId: "s3", route: "/", outcome: "element_missing", funnelStage: "visit" });
      }

      runs.push({
        runId: `run-${n}`,
        persona,
        runIndex: i,
        sessionId,
        steps,
        events,
        frictionsObserved: loginGate ? ["FR-04"] : i % 4 === 1 ? ["FR-01"] : [],
      });
    }
  }
  return runs;
}
