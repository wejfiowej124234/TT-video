import escrowAbiJson from "@/dapp/abis/Escrow.json";
import type { OrderRow, ItineraryBlock, ConfirmAction, OrderChainSyncState } from "./types";

export const ESCROW_ABI = escrowAbiJson as readonly unknown[];

/** GET :id 偶发未带 `itinerary` 时仍展示报价区与终版确认（P05；占位 version 与 ConfirmFinalPlan 乐观锁一致） */
export function itineraryOrPlaceholderForPreEscrow(
  order: OrderRow | null | undefined,
  fromApi: ItineraryBlock | null | undefined,
): ItineraryBlock | null {
  if (fromApi) return fromApi;
  if (!order?.id) return null;
  const st = String(order.state ?? order.status ?? "").toLowerCase();
  if (order.escrow_address) return null;
  if (st !== "draft" && st !== "created" && st !== "accepted") return null;
  return {
    version: 1,
    snapshot_hash: null,
    daily_itinerary: [],
    amount_breakdown: undefined,
  };
}

export interface UseEscrowDetailResult {
  order: OrderRow | null;
  itinerary: ItineraryBlock | null;
  error: string | null;
  refreshOrder: () => void;
  confirmAction: ConfirmAction;
  setConfirmAction: (a: ConfirmAction) => void;
  dismissReorgBanner: boolean;
  setDismissReorgBanner: (v: boolean) => void;
  meData: {
    user?: { id?: string; default_wallet_address?: string | null };
    guide?: { id?: string; wallet_address?: string | null };
  } | null;
  state: string;
  amount: string;
  currency: string;
  hasEscrow: boolean;
  isDraft: boolean;
  /** 未上链托管前（draft / created / accepted），与 PATCH itinerary / 终版确认 同域 */
  isPreEscrowProtocol: boolean;
  /** 展示报价摘要 + Confirm Final Plan（含接单后 Accepted） */
  showItineraryBudgetZone: boolean;
  /** Confirm Final Plan 按钮：Draft 或 双边已确认后的 Accepted */
  allowConfirmFinalPlan: boolean;
  expectedChainId: number;
  chainMismatch: boolean;
  disputeDeadlineAt: string | undefined;
  disputeWindowExpired: boolean;
  showReorgBanner: boolean;
  deposit: () => void;
  release: () => void;
  refund: () => void;
  openDispute: (reasonHash: `0x${string}`) => void;
  depositPending: boolean;
  releasePending: boolean;
  refundPending: boolean;
  disputePending: boolean;
  depositSuccess: boolean;
  releaseSuccess: boolean;
  refundSuccess: boolean;
  disputeSuccess: boolean;
  depositError: Error | null;
  releaseError: Error | null;
  refundError: Error | null;
  disputeError: Error | null;
  pending: boolean;
  success: boolean;
  failed: boolean;
  /** 与当前 `confirmAction` 对齐的弹层状态机（避免其它动作的 isSuccess 污染） */
  txModalPending: boolean;
  txModalSuccess: boolean;
  txModalFailed: boolean;
  /** 链上操作区 TxMachineStatus：无弹层时 success 不与全局 failed 并存 */
  txSectionPending: boolean;
  txSectionSuccess: boolean;
  txSectionFailed: boolean;
  /** 清除当前链上写错误态以便重试（wagmi reset） */
  resetChainWriteError: () => void;
  connectedAddress: string | undefined;
  isConnected: boolean;
  chainId: number;
  depositAmount: bigint | undefined;
  /** 原始钱包/RPC 文案，仅供 `escrowChainTxErrorUserMessage` 分类；勿直接渲染 */
  txErrorMessage: string;
  /** 仅当为可展示的 32 字节 hex 快照哈希时非空；无效/占位不冒充已绑定（B-031） */
  snapshotHash: string | null;
  /** 53-S10：链上按钮与订单态、评分双确对齐 */
  canDepositOnChain: boolean;
  canReleaseOnChain: boolean;
  canRefundOnChain: boolean;
  /** B-037：与链下争议同态，避免误点 openDispute revert */
  canOpenDisputeOnChain: boolean;
  /** B-037：`!canOpenDisputeOnChain` 时的说明键；可发起时为 null */
  disputeOnChainUnavailableReasonKey: string | null;
  /** 35 / 13-1：allowance 不足时需先 ERC-20 approve 再 deposit */
  needsDepositApproval: boolean;
  approveForDeposit: () => void;
  approveDepositPending: boolean;
  approveDepositError: Error | null;
  /** Escrow.token()，用于 Tx Modal 与 13-1 代币展示 */
  settlementTokenAddress: `0x${string}` | undefined;
  settlementTokenSymbol: string | undefined;
  /** 110 §3.3：链同步读模型；401/403 等失败时为 null，不污染主 error */
  chainSync: OrderChainSyncState | null;
  /** B-068：钱包 RPC `readContract` 失败且 query 已落定，勿用陈旧 `data` 冒充最新 */
  chainContractReadDegraded: boolean;
  /** 最近一次成功读取 `Escrow.token()` 的时间戳（ms）；无成功记录则为 null */
  lastChainContractReadOkAt: number | null;
}
