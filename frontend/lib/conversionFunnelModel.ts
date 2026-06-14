/**
 * Product Enhancement Sprint · Wave 2 · Conversion Funnel Model
 * 访问→注册→身份→发帖→找向导→下单→治理 — 仅 UX 导航，不改 API/业务链
 */
import type { PesTouchpoint } from "./productEnhancementSprint";

export const PES_WAVE2_ID = "product-enhancement-wave2-funnel-20260607" as const;

/** 全站转化主链阶段（顺序） */
export type ConversionFunnelStageId =
  | "visit"
  | "register"
  | "identity"
  | "post"
  | "find_guide"
  | "order"
  | "govern";

export type ConversionFunnelStage = {
  id: ConversionFunnelStageId;
  /** i18n key: pes2_funnel_stage_* */
  labelKey: string;
  href: string;
  /** 下一阶 CTA i18n */
  nextCtaKey: string;
};

export const CONVERSION_FUNNEL_STAGES: readonly ConversionFunnelStage[] = [
  { id: "visit", labelKey: "pes2_funnel_stage_visit", href: "/", nextCtaKey: "pes2_funnel_next_register" },
  {
    id: "register",
    labelKey: "pes2_funnel_stage_register",
    href: "/auth/register",
    nextCtaKey: "pes2_funnel_next_identity",
  },
  {
    id: "identity",
    labelKey: "pes2_funnel_stage_identity",
    href: "/me/identities",
    nextCtaKey: "pes2_funnel_next_post",
  },
  {
    id: "post",
    labelKey: "pes2_funnel_stage_post",
    href: "/community?publish=1",
    nextCtaKey: "pes2_funnel_next_market",
  },
  {
    id: "find_guide",
    labelKey: "pes2_funnel_stage_find_guide",
    href: "/market",
    nextCtaKey: "pes2_funnel_next_order",
  },
  {
    id: "order",
    labelKey: "pes2_funnel_stage_order",
    href: "/orders",
    nextCtaKey: "pes2_funnel_next_govern",
  },
  {
    id: "govern",
    labelKey: "pes2_funnel_stage_govern",
    href: "/governance",
    nextCtaKey: "pes2_funnel_next_govern_detail",
  },
] as const;

/** 六触点默认「当前阶段」— 用于 Funnel Rail 高亮 */
export const TOUCHPOINT_FUNNEL_STAGE: Record<PesTouchpoint, ConversionFunnelStageId> = {
  home: "visit",
  market: "find_guide",
  community: "post",
  guide: "find_guide",
  merchant: "identity",
  governance: "govern",
};

export type FunnelBreakpointId =
  | "BP-01"
  | "BP-02"
  | "BP-03"
  | "BP-04"
  | "BP-05"
  | "BP-06"
  | "BP-07"
  | "BP-08";

export type FunnelBreakpoint = {
  id: FunnelBreakpointId;
  severity: "P0" | "P1" | "P2";
  touchpoints: PesTouchpoint[];
  issueKey: string;
  wave2MitigationKey: string;
};

/** 审计登记断点（文档 + 机读） */
export const CONVERSION_FUNNEL_BREAKPOINTS: readonly FunnelBreakpoint[] = [
  {
    id: "BP-01",
    severity: "P0",
    touchpoints: ["home"],
    issueKey: "pes2_bp01_issue",
    wave2MitigationKey: "pes2_bp01_fix",
  },
  {
    id: "BP-02",
    severity: "P0",
    touchpoints: ["home", "market"],
    issueKey: "pes2_bp02_issue",
    wave2MitigationKey: "pes2_bp02_fix",
  },
  {
    id: "BP-03",
    severity: "P1",
    touchpoints: ["guide", "market"],
    issueKey: "pes2_bp03_issue",
    wave2MitigationKey: "pes2_bp03_fix",
  },
  {
    id: "BP-04",
    severity: "P1",
    touchpoints: ["merchant"],
    issueKey: "pes2_bp04_issue",
    wave2MitigationKey: "pes2_bp04_fix",
  },
  {
    id: "BP-05",
    severity: "P1",
    touchpoints: ["community"],
    issueKey: "pes2_bp05_issue",
    wave2MitigationKey: "pes2_bp05_fix",
  },
  {
    id: "BP-06",
    severity: "P1",
    touchpoints: ["governance"],
    issueKey: "pes2_bp06_issue",
    wave2MitigationKey: "pes2_bp06_fix",
  },
  {
    id: "BP-07",
    severity: "P2",
    touchpoints: ["market", "home"],
    issueKey: "pes2_bp07_issue",
    wave2MitigationKey: "pes2_bp07_fix",
  },
  {
    id: "BP-08",
    severity: "P2",
    touchpoints: ["market", "community"],
    issueKey: "pes2_bp08_issue",
    wave2MitigationKey: "pes2_bp08_fix",
  },
] as const;

export function getFunnelStageIndex(id: ConversionFunnelStageId): number {
  return CONVERSION_FUNNEL_STAGES.findIndex((s) => s.id === id);
}

export function getFunnelStage(id: ConversionFunnelStageId): ConversionFunnelStage {
  const s = CONVERSION_FUNNEL_STAGES.find((x) => x.id === id);
  if (!s) throw new Error(`unknown funnel stage: ${id}`);
  return s;
}

export function getNextFunnelStage(id: ConversionFunnelStageId): ConversionFunnelStage | null {
  const i = getFunnelStageIndex(id);
  if (i < 0 || i >= CONVERSION_FUNNEL_STAGES.length - 1) return null;
  return CONVERSION_FUNNEL_STAGES[i + 1]!;
}

export type FunnelNextStep = {
  href: string;
  ctaKey: string;
};

/**
 * 下一跳 CTA：文案取自**当前阶段**的 `nextCtaKey`，链接指向**下一阶段**的 `href`。
 * （勿用 `next.nextCtaKey`，否则市场页 find_guide 会误显「进入治理」。）
 */
const TOUCHPOINT_FUNNEL_NEXT_OVERRIDE: Partial<
  Record<PesTouchpoint, Partial<Record<ConversionFunnelStageId, FunnelNextStep>>>
> = {
  market: {
    find_guide: {
      href: "/orders",
      ctaKey: "pes2_funnel_next_market_travel",
    },
  },
  guide: {
    find_guide: {
      href: "/orders",
      ctaKey: "pes2_funnel_next_order",
    },
  },
};

export function resolveFunnelNextStep(
  currentId: ConversionFunnelStageId,
  touchpoint?: PesTouchpoint
): FunnelNextStep | null {
  const next = getNextFunnelStage(currentId);
  if (!next) return null;
  const override = touchpoint ? TOUCHPOINT_FUNNEL_NEXT_OVERRIDE[touchpoint]?.[currentId] : undefined;
  if (override) return override;
  const current = getFunnelStage(currentId);
  return { href: next.href, ctaKey: current.nextCtaKey };
}

export type RoleEntryId = "traveler" | "guide" | "merchant" | "govern";

export const ROLE_ENTRY_LINKS: readonly {
  id: RoleEntryId;
  labelKey: string;
  descKey: string;
  href: string;
}[] = [
  {
    id: "traveler",
    labelKey: "pes2_role_traveler",
    descKey: "pes2_role_traveler_desc",
    href: "/auth/register",
  },
  {
    id: "guide",
    labelKey: "pes2_role_guide",
    descKey: "pes2_role_guide_desc",
    href: "/guide/register",
  },
  {
    id: "merchant",
    labelKey: "pes2_role_merchant",
    descKey: "pes2_role_merchant_desc",
    href: "/provider/register",
  },
  {
    id: "govern",
    labelKey: "pes2_role_govern",
    descKey: "pes2_role_govern_desc",
    href: "/governance",
  },
] as const;
