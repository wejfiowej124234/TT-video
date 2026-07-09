/**
 * `/governance/params` · L5 排版与分区 token（运营可读 · 与 proposals 同源）。
 */
import { GOV_PARAMS_L5 } from "@/lib/governance/governanceParamsPageL5";

export const GOV_PARAMS_LAYOUT = {
  /** 面板主标题（Uppercase kicker 下方的大标题） */
  panelTitle: "text-h3 font-bold tracking-tight text-slate-50 sm:text-[1.35rem]",
  /** 面板导语 */
  panelLead: `mt-2 max-w-3xl text-body leading-relaxed text-slate-200`,
  /** 子区块 kicker */
  blockKicker: `text-xs font-semibold uppercase tracking-[0.14em] text-ref-sun/85`,
  /** 子区块标题 */
  blockTitle: "text-body font-semibold text-slate-50 sm:text-[1.05rem]",
  /** 子区块说明 */
  blockLead: `mt-1.5 max-w-3xl text-small leading-relaxed text-slate-300`,
  /** 正文 / 列表说明 */
  body: GOV_PARAMS_L5.cardHint,
  /** 脚注 / 状态 */
  footnote: GOV_PARAMS_L5.mutedNote,
  /** 面板间距 */
  panelGap: "mt-6",
  /** 子区块间距 */
  blockGap: "mt-5",
  /** 子区块分隔 */
  blockDivider: "border-t border-white/10 pt-6",
  /** 运营提示条 */
  callout: `${GOV_PARAMS_L5.noticeSoft} px-4 py-3.5 text-small leading-relaxed text-slate-200`,
  /** Phase / 状态 pill */
  statusPill:
    "inline-flex items-center rounded-full border border-ref-sun/35 bg-ref-sun/[0.1] px-2.5 py-0.5 text-xs font-medium text-ref-sun/95",
  /** 步骤序号圆 */
  stepBadge:
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ref-sun/40 bg-ref-sun/[0.12] text-xs font-bold text-ref-sun/95",
  /** 双轨卡片 */
  railCard:
    "rounded-[var(--radius-md)] border border-white/12 bg-slate-950/50 p-4 sm:p-5",
  /** 表格容器 */
  tableWrap: "mt-4 overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-slate-950/35",
} as const;
