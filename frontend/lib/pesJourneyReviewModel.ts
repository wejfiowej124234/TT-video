/**
 * Product Enhancement Sprint · Real User Journey Review (RUJR)
 * 四角色路径 SSOT — 仅走查登记，不改业务链
 */
import type { ConversionFunnelStageId } from "./conversionFunnelModel";
import type { PesTouchpoint } from "./productEnhancementSprint";

export const PES_RUJR_ID = "pes-real-user-journey-review-20260607" as const;
export const PES_RUJR_TARGET_RUNS = 48 as const;
export const PES_RUJR_RUNS_PER_PERSONA = 12 as const;

export type PesPersonaId = "traveler" | "guide" | "merchant" | "govern";

export type PesJourneyStep = {
  id: string;
  route: string;
  touchpoint?: PesTouchpoint;
  funnelStage?: ConversionFunnelStageId;
  /** data-tt-pes-* 探针或 role/link 选择器 */
  pesProbe?: string;
  clickRole?: "traveler" | "guide" | "merchant" | "govern";
  clickFunnelNext?: boolean;
};

export type PesPersonaJourney = {
  id: PesPersonaId;
  labelKey: string;
  steps: readonly PesJourneyStep[];
};

export const PES_PERSONA_JOURNEYS: readonly PesPersonaJourney[] = [
  {
    id: "traveler",
    labelKey: "pes_rujr_persona_traveler",
    steps: [
      { id: "t1_home", route: "/", touchpoint: "home", funnelStage: "visit", pesProbe: "data-tt-pes-role-bar" },
      { id: "t2_register_intent", route: "/auth/register", funnelStage: "register" },
      { id: "t3_market", route: "/market", touchpoint: "market", funnelStage: "find_guide", pesProbe: "data-tt-pes-funnel-rail" },
      { id: "t4_community", route: "/community", touchpoint: "community", funnelStage: "post", pesProbe: "data-tt-pes-funnel-rail" },
      { id: "t5_orders", route: "/orders", funnelStage: "order" },
      { id: "t6_governance", route: "/governance", touchpoint: "governance", funnelStage: "govern", pesProbe: "data-tt-pes-funnel-rail" },
    ],
  },
  {
    id: "guide",
    labelKey: "pes_rujr_persona_guide",
    steps: [
      { id: "g1_guide_hub", route: "/guide", touchpoint: "guide", pesProbe: "data-tt-pes-funnel-rail" },
      { id: "g2_register", route: "/guide/register", funnelStage: "register" },
      { id: "g3_market", route: "/market", touchpoint: "market", funnelStage: "find_guide", pesProbe: "data-tt-pes-funnel-rail" },
      { id: "g4_staking", route: "/staking" },
    ],
  },
  {
    id: "merchant",
    labelKey: "pes_rujr_persona_merchant",
    steps: [
      { id: "m1_register", route: "/provider/register", touchpoint: "merchant", funnelStage: "identity", pesProbe: "data-tt-pes-funnel-rail" },
      { id: "m2_onboarding", route: "/me/onboarding", funnelStage: "identity" },
      { id: "m3_identities", route: "/me/identities", funnelStage: "identity" },
    ],
  },
  {
    id: "govern",
    labelKey: "pes_rujr_persona_govern",
    steps: [
      { id: "v1_hub", route: "/governance", touchpoint: "governance", funnelStage: "govern", pesProbe: "data-tt-pes-funnel-rail" },
      { id: "v2_proposals", route: "/governance/proposals", touchpoint: "governance", pesProbe: "data-tt-pes-funnel-rail" },
      { id: "v3_delegate", route: "/governance/delegate" },
    ],
  },
] as const;

export type PesFrictionId =
  | "FR-01"
  | "FR-02"
  | "FR-03"
  | "FR-04"
  | "FR-05"
  | "FR-06"
  | "FR-07"
  | "FR-08"
  | "FR-09"
  | "FR-10"
  | "FR-11"
  | "FR-12";

export type PesFrictionCatalogEntry = {
  id: PesFrictionId;
  severity: "P0" | "P1" | "P2";
  personas: PesPersonaId[];
  touchpoints: PesTouchpoint[];
  issueKey: string;
  wave4CandidateKey: string;
  /** 关联 Wave 2 断点 */
  breakpointIds?: string[];
};

/** 走查摩擦登记册（与代码/漏斗观测对齐） */
export const PES_FRICTION_CATALOG: readonly PesFrictionCatalogEntry[] = [
  {
    id: "FR-01",
    severity: "P0",
    personas: ["traveler"],
    touchpoints: ["home"],
    issueKey: "pes_rujr_fr01_issue",
    wave4CandidateKey: "pes_rujr_fr01_wave4",
    breakpointIds: ["BP-01"],
  },
  {
    id: "FR-02",
    severity: "P0",
    personas: ["traveler"],
    touchpoints: ["home", "market"],
    issueKey: "pes_rujr_fr02_issue",
    wave4CandidateKey: "pes_rujr_fr02_wave4",
    breakpointIds: ["BP-02"],
  },
  {
    id: "FR-03",
    severity: "P0",
    personas: ["traveler", "guide"],
    touchpoints: ["market"],
    issueKey: "pes_rujr_fr03_issue",
    wave4CandidateKey: "pes_rujr_fr03_wave4",
  },
  {
    id: "FR-04",
    severity: "P0",
    personas: ["traveler", "guide", "merchant"],
    touchpoints: ["community", "guide", "merchant"],
    issueKey: "pes_rujr_fr04_issue",
    wave4CandidateKey: "pes_rujr_fr04_wave4",
    breakpointIds: ["BP-05"],
  },
  {
    id: "FR-05",
    severity: "P1",
    personas: ["guide"],
    touchpoints: ["guide", "market"],
    issueKey: "pes_rujr_fr05_issue",
    wave4CandidateKey: "pes_rujr_fr05_wave4",
    breakpointIds: ["BP-03"],
  },
  {
    id: "FR-06",
    severity: "P1",
    personas: ["merchant"],
    touchpoints: ["merchant"],
    issueKey: "pes_rujr_fr06_issue",
    wave4CandidateKey: "pes_rujr_fr06_wave4",
    breakpointIds: ["BP-04"],
  },
  {
    id: "FR-07",
    severity: "P1",
    personas: ["govern"],
    touchpoints: ["governance"],
    issueKey: "pes_rujr_fr07_issue",
    wave4CandidateKey: "pes_rujr_fr07_wave4",
    breakpointIds: ["BP-06"],
  },
  {
    id: "FR-08",
    severity: "P1",
    personas: ["traveler", "guide"],
    touchpoints: ["market", "community"],
    issueKey: "pes_rujr_fr08_issue",
    wave4CandidateKey: "pes_rujr_fr08_wave4",
    breakpointIds: ["BP-08"],
  },
  {
    id: "FR-09",
    severity: "P2",
    personas: ["traveler"],
    touchpoints: ["home", "market"],
    issueKey: "pes_rujr_fr09_issue",
    wave4CandidateKey: "pes_rujr_fr09_wave4",
    breakpointIds: ["BP-07"],
  },
  {
    id: "FR-10",
    severity: "P2",
    personas: ["traveler"],
    touchpoints: ["home", "market"],
    issueKey: "pes_rujr_fr10_issue",
    wave4CandidateKey: "pes_rujr_fr10_wave4",
  },
  {
    id: "FR-11",
    severity: "P2",
    personas: ["govern"],
    touchpoints: ["governance"],
    issueKey: "pes_rujr_fr11_issue",
    wave4CandidateKey: "pes_rujr_fr11_wave4",
  },
  {
    id: "FR-12",
    severity: "P2",
    personas: ["traveler", "merchant"],
    touchpoints: ["home", "merchant"],
    issueKey: "pes_rujr_fr12_issue",
    wave4CandidateKey: "pes_rujr_fr12_wave4",
  },
] as const;

export function getPersonaJourney(persona: PesPersonaId): PesPersonaJourney {
  const j = PES_PERSONA_JOURNEYS.find((p) => p.id === persona);
  if (!j) throw new Error(`unknown persona: ${persona}`);
  return j;
}
