import escrowAbiJson from "@/dapp/abis/Escrow.json";
import { marketCyanPillControlFocusClasses } from "@/lib/travelLinkFocus";
import type { ConfirmAction, OrderRow } from "./types";
import {
  TT_MARKETING_BTN_ESCROW_MODAL_GHOST,
  TT_MARKETING_BTN_WARM_OUTLINE_COMPACT,
  TT_MARKETING_FOCUS_RING_CONSOLE,
} from "@/lib/marketingUi";

export const ESCROW_ABI = escrowAbiJson as readonly unknown[];

export interface EscrowTxModalProps {
  confirmAction: ConfirmAction;
  onClose: () => void;
  onConfirm: () => void;
  /** 链上 openDispute(bytes32)：由摘要派生 reasonHash 后签名 */
  onConfirmDispute?: (reasonHash: `0x${string}`) => void;
  order: OrderRow;
  amount: string;
  currency: string;
  snapshotHash: string | null;
  chainId: number;
  /** 协议目标链（与 35 §3.1 错链提示一致） */
  expectedChainId: number;
  /** Escrow.token()；错链或未加载时可能为空 */
  settlementTokenAddress?: `0x${string}`;
  settlementTokenSymbol?: string;
  /** deposit(uint256) 传入的原始整数（与订单展示金额同源换算） */
  depositAmountOnChain?: bigint;
  pending: boolean;
  success: boolean;
  failed: boolean;
  txError: string | null;
  /** 清除 wagmi 写错误以便重试（B-030） */
  onDismissTxError?: () => void;
  /** 从订单协议区打开时与 30-DID 深色弹层一致 */
  variantDid?: boolean;
  /** B-067：暂停时禁止确认签名（防弹层已开时绕门闸） */
  protocolPaused?: boolean;
}

export function escrowTxModalChrome(isDid: boolean) {
  const modalCtaFocusClass = isDid
    ? marketCyanPillControlFocusClasses
    : `${TT_MARKETING_FOCUS_RING_CONSOLE}`;
  const panelClass = isDid
    ? "relative z-10 w-full max-w-md rounded-[var(--radius-xl)] border border-cyan-500/30 bg-ink-900/95 backdrop-blur-md p-6 shadow-scifi-modal-inner space-y-4"
    : "relative z-10 w-full max-w-md rounded-[var(--radius-sm)] bg-bg-console p-6 shadow-strong space-y-4";
  const titleClass = isDid ? "text-body-l font-semibold text-cyan-200" : "text-body-l font-semibold text-ink-900";
  const descClass = isDid ? "text-small text-slate-300 leading-relaxed" : "text-small text-ink-600";
  const ulClass = isDid
    ? "text-small space-y-1 font-mono bg-ink-800/70 border border-ink-600/40 p-3 rounded-[var(--radius-sm)] text-slate-200"
    : "text-small space-y-1 font-mono bg-bg-soft p-3 rounded-[var(--radius-sm)]";
  const labelSpanClass = isDid ? "text-slate-300" : "text-ink-500";
  const sansMutedClass = isDid ? "font-sans text-slate-300" : "font-sans text-ink-600";
  const disputeLabelClass = isDid ? "block text-small font-medium text-slate-300" : "block text-small font-medium text-ink-700";
  const disputeHintClass = isDid ? "text-meta text-slate-300" : "text-meta text-ink-500";
  const cancelBtnClass = isDid
    ? `${TT_MARKETING_BTN_ESCROW_MODAL_GHOST} ${modalCtaFocusClass}`
    : `inline-flex min-h-[44px] items-center justify-center ${TT_MARKETING_BTN_WARM_OUTLINE_COMPACT} px-4 py-2 focus-visible:ring-offset-bg-console`;
  return {
    modalCtaFocusClass,
    panelClass,
    titleClass,
    descClass,
    ulClass,
    labelSpanClass,
    sansMutedClass,
    disputeLabelClass,
    disputeHintClass,
    cancelBtnClass,
  };
}
