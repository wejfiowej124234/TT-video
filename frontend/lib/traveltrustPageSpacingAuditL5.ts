/**
 * `/traveltrust` 垂直节奏 · L5 企业审计 SSOT
 *
 * 原则（与 `TT_PAGE_VERTICAL_RHYTHM_L5` 一致）：
 * - 8px 基准网格；Tailwind spacing 须为 4 的倍数（rem×16）
 * - 节间用 padding/gap，**不用**额外 border-t / Film 缝堆叠（全页 ≤2 处软过渡即可）
 * - 同主题簇（兑换·信任·结算）节间目标 40–48px；大转折 56–72px
 * - 并排 CTA 目标 32–40px（gap-8 ~ gap-10）
 */

export const TT_PAGE_SPACING_AUDIT_L5 = {
  gridUnitPx: 8,
  /** 允许的节奏台阶（px） */
  rhythmStepsPx: [16, 20, 24, 32, 40, 48, 56, 64, 72, 80] as const,
  /** 节与节外缘间距目标（测量：上一节 bottom → 下一节 top） */
  sectionGapTargetsPx: {
    "theater→liquidity": { min: 56, ideal: 64, max: 80 },
    "liquidity→trust": { min: 36, ideal: 44, max: 56 },
    "trust→settlement": { min: 36, ideal: 44, max: 56 },
    "settlement→faq": { min: 56, ideal: 64, max: 80 },
    "faq→start": { min: 56, ideal: 64, max: 80 },
  },
  /** 同排主/次 CTA 水平间距 */
  ctaPairGapPx: { min: 32, ideal: 40, max: 48 },
  /** 步骤条底 → CTA 顶 */
  startStepsToCtaPx: { min: 32, ideal: 40, max: 56 },
  maxFilmDividersOnPage: 2,
} as const;

export type TraveltrustSpacingSectionPair = keyof typeof TT_PAGE_SPACING_AUDIT_L5.sectionGapTargetsPx;

/** 将 Tailwind spacing 类解析为约略 px（base 16px） */
export function tailwindSpacingToPx(classFragment: string): number | null {
  const m = classFragment.match(/(?:^|[\s:])(?:p|py|pt|pb|m|my|mt|mb|gap|gap-x|gap-y)-(\d+(?:\.\d+)?)/);
  if (!m) return null;
  return Number.parseFloat(m[1]) * 4;
}

export function isOnL5SpacingGrid(px: number, tolerance = 0): boolean {
  const u = TT_PAGE_SPACING_AUDIT_L5.gridUnitPx;
  return Math.abs(px % u) <= tolerance || (TT_PAGE_SPACING_AUDIT_L5.rhythmStepsPx as readonly number[]).includes(px);
}

export function auditTraveltrustSectionGapPx(
  pair: TraveltrustSpacingSectionPair,
  measuredPx: number,
): { ok: boolean; status: "pass" | "tight" | "loose"; target: (typeof TT_PAGE_SPACING_AUDIT_L5.sectionGapTargetsPx)[TraveltrustSpacingSectionPair] } {
  const target = TT_PAGE_SPACING_AUDIT_L5.sectionGapTargetsPx[pair];
  if (measuredPx >= target.min && measuredPx <= target.max) {
    return { ok: true, status: "pass", target };
  }
  if (measuredPx < target.min) {
    return { ok: false, status: "tight", target };
  }
  return { ok: false, status: "loose", target };
}

/** 代码侧： rhythm token 与 L5 台阶对齐（静态审计） */
export const TT_PAGE_VERTICAL_RHYTHM_L5_AUDIT = [
  { token: "sectionY", classes: "py-8 sm:py-9", nominalPx: 32 },
  { token: "sectionClusterMid", classes: "py-5 sm:py-6", nominalPx: 20 },
  { token: "sectionClusterFirst pb", classes: "pb-5 sm:pb-6", nominalPx: 20 },
  { token: "sectionTopStart", classes: "pt-8 sm:pt-10", nominalPx: 32 },
  { token: "start cta gap-x", classes: "gap-x-8 sm:gap-x-10", nominalPx: 32 },
  { token: "headerStackGap", classes: "mt-4 sm:mt-5", nominalPx: 16 },
  { token: "contentStackGap", classes: "mt-5 sm:mt-6", nominalPx: 20 },
] as const;

export function runTraveltrustVerticalRhythmTokenAudit(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  for (const row of TT_PAGE_VERTICAL_RHYTHM_L5_AUDIT) {
    const px = tailwindSpacingToPx(row.classes.replace(/sm:\S+/g, "").trim());
    if (px !== null && !isOnL5SpacingGrid(px)) {
      failures.push(`${row.token}: ${row.classes} → ${px}px not on 8px grid`);
    }
  }
  return { ok: failures.length === 0, failures };
}
