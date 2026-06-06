import type { BuildEscrowParamsErrorCode } from "@/lib/buildEscrowCreateParams";
import {
  TT_MARKETING_BTN_ESCROW_MODAL_GHOST,
  TT_MARKETING_BTN_WARM_OUTLINE_COMPACT,
  TT_MARKETING_FOCUS_RING_CONSOLE,
} from "@/lib/marketingUi";
import { marketCyanPillControlFocusClasses } from "@/lib/travelLinkFocus";

import type { ItineraryBlock, OrderRow } from "./types";

export function buildErrKey(code: BuildEscrowParamsErrorCode): string {
  switch (code) {
    case "invalid_order_id":
      return "escrow_factoryBuildErr_orderId";
    case "missing_snapshot":
      return "escrow_factoryBuildErr_snapshot";
    case "invalid_snapshot":
      return "escrow_factoryBuildErr_snapshotHex";
    case "missing_order_amount":
      return "escrow_factoryBuildErr_amount";
    case "missing_traveler":
    case "missing_guide":
      return "escrow_factoryBuildErr_participants";
    case "missing_token":
      return "escrow_factoryBuildErr_token";
    case "missing_arbitrator":
      return "escrow_factoryBuildErr_arbitrator";
    default:
      return "escrow_factoryCreateErrGeneric";
  }
}

export const FACTORY_WRITE_ERROR_OPTS = {
  revertPatterns: [] as { re: RegExp; messageKey: string }[],
  rejectKey: "escrow_txErrorUserRejected",
  allowanceKey: "escrow_allowanceHint",
  genericKey: "escrow_factoryCreateTxFailed",
} as const;

export interface CreateOnChainEscrowBlockProps {
  order: OrderRow;
  itinerary: ItineraryBlock | null;
  snapshotHash: string | null;
  meUserId?: string;
  meDefaultWallet?: string | null;
  connectedAddress?: string;
  isConnected: boolean;
  chainId: number;
  expectedChainId: number;
  chainMismatch: boolean;
  refreshOrder: () => void;
  panelClassName?: string;
  /** 与订单协议区 30-DID 一致时，工厂签名弹层使用深色玻璃态 */
  variantDid?: boolean;
  /** B-067 */
  protocolPaused?: boolean;
}

export function createOnChainEscrowFactoryModalUi(variantDid: boolean | undefined) {
  const isDid = !!variantDid;
  const factoryModalCtaFocusClass = isDid
    ? marketCyanPillControlFocusClasses
    : `${TT_MARKETING_FOCUS_RING_CONSOLE}`;
  return {
    factoryModalCtaFocusClass,
    modalPanelClass: isDid
      ? "relative z-10 w-full max-w-md rounded-[var(--radius-xl)] border border-cyan-500/30 bg-ink-900/95 backdrop-blur-md p-6 shadow-scifi-modal-inner space-y-4"
      : "relative z-10 w-full max-w-md rounded-[var(--radius-sm)] bg-bg-console p-6 shadow-strong space-y-4",
    modalTitleClass: isDid ? "text-body-l font-semibold text-cyan-200" : "text-body-l font-semibold text-ink-900",
    modalDescClass: isDid ? "text-small text-slate-300 leading-relaxed" : "text-small text-ink-600",
    modalUlClass: isDid
      ? "text-small space-y-1 font-mono bg-ink-800/70 border border-ink-600/40 p-3 rounded-[var(--radius-sm)] text-slate-200"
      : "text-small space-y-1 font-mono bg-bg-soft p-3 rounded-[var(--radius-sm)]",
    modalLabelClass: isDid ? "text-slate-300" : "text-ink-500",
    modalNoteClass: isDid ? "text-meta text-warning/95" : "text-meta text-warning",
    modalCancelClass: isDid
      ? `${TT_MARKETING_BTN_ESCROW_MODAL_GHOST} ${factoryModalCtaFocusClass}`
      : `${TT_MARKETING_BTN_WARM_OUTLINE_COMPACT} px-4 py-2 focus-visible:ring-offset-bg-console`,
  };
}
