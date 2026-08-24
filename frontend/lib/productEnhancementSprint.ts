/**
 * Product Enhancement Sprint · 共享 UX 令牌（2026-06-07）
 * 边界：加载反馈 / 空态 / 转化条 / 移动端触控 — 不修改 layout lock 与核心业务链
 */
export const PES_SPRINT_ID = "product-enhancement-sprint-20260607" as const;

export type PesTouchpoint =
  | "home"
  | "market"
  | "community"
  | "guide"
  | "merchant"
  | "governance";

export const PES_TOUCHPOINT_ORDER: readonly PesTouchpoint[] = [
  "home",
  "market",
  "community",
  "guide",
  "merchant",
  "governance",
] as const;

/** 共享样式 — 叠加于现有壳，不改 L0/L1 marketing token */
export const PES_UI = {
  loadingBand:
    "rounded-[var(--radius-md)] border border-cyan-400/25 bg-cyan-500/8 px-3 py-2.5 sm:px-4 sm:py-3",
  loadingPulse: "inline-block h-2 w-2 rounded-full bg-cyan-400/90 animate-pulse motion-reduce:animate-none",
  loadingText: "text-meta text-cyan-100/95 leading-snug",
  emptyPanel:
    "rounded-[var(--radius-md)] border border-slate-500/35 bg-ink-800/45 backdrop-blur-sm px-4 py-4 sm:px-5 sm:py-5",
  emptyTitle: "text-body font-semibold text-slate-100",
  emptyBody: "mt-2 text-small text-slate-300/95 leading-relaxed",
  emptyActions: "mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3",
  ctaPrimary:
    "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-[#0a1520] px-4 py-2 text-meta font-medium text-cyan-100 hover:bg-[#0c1a28] motion-sub motion-reduce:transition-none",
  ctaSecondary:
    "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-500/50 bg-ink-700/50 px-4 py-2 text-meta text-slate-200 hover:bg-ink-600/60 motion-sub motion-reduce:transition-none",
  conversionStrip:
    "rounded-[var(--radius-md)] border border-ref-sun/30 bg-[#14100d] px-3 py-2.5 sm:px-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between",
  conversionKicker: "text-meta font-semibold uppercase tracking-wide text-ref-sun/95",
  conversionBody: "text-small text-slate-200/95 leading-snug",
  conversionBadge:
    "shrink-0 inline-flex items-center rounded-full border border-emerald-400/40 bg-[#0c1814] px-2.5 py-0.5 text-meta font-medium text-emerald-100",
  /** F7 · funnel rail chips (opaque ink fills — not emerald/cyan translucent self-bg) */
  funnelChipActive:
    "border-cyan-400/55 bg-[#0a1520] text-cyan-100 font-semibold",
  funnelChipDone: "border-emerald-400/40 bg-[#0c1814] text-emerald-100",
  funnelChipIdleDark: "border-slate-600/50 bg-[#12151a] text-slate-300",
  funnelChipIdleLight:
    "border-ink-200 bg-white text-ink-700 dark:border-ink-600/50 dark:bg-ink-800 dark:text-ink-200",
  skeletonRow: "h-3 rounded-[var(--radius-sm)] bg-slate-700/60 animate-pulse motion-reduce:animate-none",
} as const;

export function pesTouchpointI18nPrefix(touchpoint: PesTouchpoint): string {
  return `pes_${touchpoint}`;
}
