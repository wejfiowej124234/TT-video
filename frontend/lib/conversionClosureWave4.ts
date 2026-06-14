/**
 * PES Wave 4 · Conversion Closure Sprint
 * Before/After 漏斗矩阵 · Drop-off Delta — RUJR 基线收口
 */
import type { ConversionFunnelStageId } from "./conversionFunnelModel";
import { PES_RUJR_ID } from "./pesJourneyReviewModel";

export const PES_WAVE4_ID = "product-enhancement-wave4-closure-20260607" as const;

export type Wave4ClosureP0Id = "CC-P0-01" | "CC-P0-02" | "CC-P0-03";

export type Wave4FunnelPair =
  | "visit_register"
  | "identity_post"
  | "find_guide_order";

export type Wave4ClosureItem = {
  id: Wave4ClosureP0Id;
  funnelPair: Wave4FunnelPair;
  fromStage: ConversionFunnelStageId;
  toStage: ConversionFunnelStageId;
  component: string;
  rujrBaselineDropoff: number;
  wave4TargetDropoff: number;
  titleKey: string;
};

/** RUJR 48 轮基线流失率（rujr-report-synth.json） */
export const WAVE4_RUJR_BASELINE_DROP_OFFS: Record<Wave4FunnelPair, number> = {
  visit_register: 0.1875,
  identity_post: 0.59375,
  find_guide_order: 0.9090909090909091,
};

/** Wave 4 UX 收口目标（Closure Sprint · 非 API 承诺） */
export const WAVE4_TARGET_DROP_OFFS: Record<Wave4FunnelPair, number> = {
  visit_register: 0.1,
  identity_post: 0.35,
  find_guide_order: 0.7,
};

export const WAVE4_P0_CLOSURES: readonly Wave4ClosureItem[] = [
  {
    id: "CC-P0-01",
    funnelPair: "find_guide_order",
    fromStage: "find_guide",
    toStage: "order",
    component: "MarketOrderClosureStrip",
    rujrBaselineDropoff: WAVE4_RUJR_BASELINE_DROP_OFFS.find_guide_order,
    wave4TargetDropoff: WAVE4_TARGET_DROP_OFFS.find_guide_order,
    titleKey: "pes4_closure_market_order",
  },
  {
    id: "CC-P0-02",
    funnelPair: "identity_post",
    fromStage: "identity",
    toStage: "post",
    component: "IdentityPostClosureStrip",
    rujrBaselineDropoff: WAVE4_RUJR_BASELINE_DROP_OFFS.identity_post,
    wave4TargetDropoff: WAVE4_TARGET_DROP_OFFS.identity_post,
    titleKey: "pes4_closure_identity_post",
  },
  {
    id: "CC-P0-03",
    funnelPair: "visit_register",
    fromStage: "visit",
    toStage: "register",
    component: "PersistentRoleEntryBar",
    rujrBaselineDropoff: WAVE4_RUJR_BASELINE_DROP_OFFS.visit_register,
    wave4TargetDropoff: WAVE4_TARGET_DROP_OFFS.visit_register,
    titleKey: "pes4_closure_visit_register",
  },
] as const;

export type FunnelMatrixRow = {
  fromStage: ConversionFunnelStageId;
  toStage: ConversionFunnelStageId;
  pair: Wave4FunnelPair | "other";
  beforeDropoff: number;
  afterTargetDropoff: number;
  deltaPp: number;
  closureId?: Wave4ClosureP0Id;
};

export type DropoffDeltaRow = {
  pair: Wave4FunnelPair;
  beforePct: number;
  afterTargetPct: number;
  deltaPp: number;
  closureId: Wave4ClosureP0Id;
  evidenceKey: string;
};

export function buildBeforeAfterFunnelMatrix(): FunnelMatrixRow[] {
  const pairs: Wave4FunnelPair[] = ["visit_register", "identity_post", "find_guide_order"];
  return pairs.map((pair) => {
    const closure = WAVE4_P0_CLOSURES.find((c) => c.funnelPair === pair)!;
    const before = WAVE4_RUJR_BASELINE_DROP_OFFS[pair];
    const after = WAVE4_TARGET_DROP_OFFS[pair];
    return {
      fromStage: closure.fromStage,
      toStage: closure.toStage,
      pair,
      beforeDropoff: before,
      afterTargetDropoff: after,
      deltaPp: (before - after) * 100,
      closureId: closure.id,
    };
  });
}

export function buildDropoffDeltaReport(): DropoffDeltaRow[] {
  return WAVE4_P0_CLOSURES.map((c) => ({
    pair: c.funnelPair,
    beforePct: c.rujrBaselineDropoff * 100,
    afterTargetPct: c.wave4TargetDropoff * 100,
    deltaPp: (c.rujrBaselineDropoff - c.wave4TargetDropoff) * 100,
    closureId: c.id,
    evidenceKey: `pes4_delta_${c.funnelPair}`,
  }));
}

export const WAVE4_AUDIT_META = {
  wave4Id: PES_WAVE4_ID,
  rujrBaselineId: PES_RUJR_ID,
  businessCoreChain: "FROZEN",
  apiContract: "FROZEN",
} as const;
