/**
 * PD-009 · 旅行收购子站 L5 契约常量（① 本地 · 与 authL5 / meIdentitiesL5 同族机读闸）。
 * Vitest：`acquisitionL5.contract.test.ts` · `acquisitionL5FullScore.contract.test.ts`
 */
import { ACQUISITION_FULFILLMENT_BOND_THRESHOLD_USDC, ACQUISITION_PUBLISH_BOND_MIN_USDC } from "@/lib/acquisition/acquisitionBondConstants";

export const ACQUISITION_L5_VISUAL_DATA_ATTR = "acquisition-l5" as const;

export const TT_ACQUISITION_L5 = {
  /** Studio / 详情页 bond 提示区（数据链 · 非五主路由 layout lock） */
  bondCallout:
    "rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-meta leading-snug text-slate-300/95",
  bondCta:
    "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-amber-500/45 bg-amber-500/15 px-3 py-2 text-small font-semibold text-amber-100 hover:bg-amber-500/25 motion-sub disabled:cursor-not-allowed disabled:opacity-60",
  fulfillmentBanner:
    "rounded-[var(--radius-md)] border border-sky-500/30 bg-sky-500/10 px-3 py-2.5 text-meta text-slate-200/95",
} as const;

export const ACQUISITION_L5_SSOT = {
  publishBondMinUsdc: ACQUISITION_PUBLISH_BOND_MIN_USDC,
  fulfillmentBondThresholdUsdc: ACQUISITION_FULFILLMENT_BOND_THRESHOLD_USDC,
  agreeEscrowCopyBodyKey: "agree_escrow_copy" as const,
  escrowAckErrorKey: "acquisition_escrow_ack_required" as const,
} as const;

export function acquisitionL5BondCalloutDataAttrs(): Record<string, string> {
  return {
    "data-tt-acquisition-l5": "1",
    "data-tt-acquisition-visual": ACQUISITION_L5_VISUAL_DATA_ATTR,
    "data-tt-acquisition-bond-honesty": "phase1-mock-pg-not-mainnet",
  };
}
