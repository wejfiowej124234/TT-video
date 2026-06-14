/**
 * Product Enhancement Sprint · Wave 3 · A/B Test Registry
 * 客户端实验登记 — 不改 API / 业务链
 */
import type { PesTouchpoint } from "./productEnhancementSprint";

export const PES_WAVE3_ID = "product-enhancement-wave3-analytics-20260607" as const;

export type PesAbTestStatus = "active" | "paused" | "concluded";

export type PesAbTestDefinition = {
  id: string;
  touchpoint: PesTouchpoint;
  status: PesAbTestStatus;
  variants: readonly string[];
  /** i18n: pes3_ab_*_hypothesis */
  hypothesisKey: string;
  /** i18n: pes3_ab_*_metric */
  primaryMetricKey: string;
  owner: string;
};

/** Wave 3 登记实验（机读 SSOT） */
export const PES_AB_TEST_REGISTRY: readonly PesAbTestDefinition[] = [
  {
    id: "ab-home-role-grid-v1",
    touchpoint: "home",
    status: "active",
    variants: ["control", "role_grid_prominent"],
    hypothesisKey: "pes3_ab_home_role_grid_hypothesis",
    primaryMetricKey: "pes3_ab_metric_registration_intent",
    owner: "pes-product",
  },
  {
    id: "ab-market-escrow-inline-v1",
    touchpoint: "market",
    status: "active",
    variants: ["control", "escrow_card"],
    hypothesisKey: "pes3_ab_market_escrow_hypothesis",
    primaryMetricKey: "pes3_ab_metric_escrow_trust_click",
    owner: "pes-product",
  },
  {
    id: "ab-governance-funnel-compact-v1",
    touchpoint: "governance",
    status: "active",
    variants: ["control", "funnel_compact"],
    hypothesisKey: "pes3_ab_governance_funnel_hypothesis",
    primaryMetricKey: "pes3_ab_metric_governance_participation",
    owner: "pes-product",
  },
] as const;

export function getAbTestById(id: string): PesAbTestDefinition | undefined {
  return PES_AB_TEST_REGISTRY.find((t) => t.id === id);
}

export function getActiveAbTestsForTouchpoint(touchpoint: PesTouchpoint): PesAbTestDefinition[] {
  return PES_AB_TEST_REGISTRY.filter((t) => t.touchpoint === touchpoint && t.status === "active");
}
