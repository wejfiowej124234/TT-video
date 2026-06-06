import type { OrderRow, ItineraryBlock } from "./types";
import {
  canDepositToEscrow,
  canRefundEscrow,
  canReleaseAfterRating,
  canOpenDisputeOnChain as orderAllowsOnChainDispute,
  escrowDisputeOnChainUnavailableReasonKey,
} from "./escrowOnChainEligibility";
import { walletErrorRaw } from "@/lib/mapWalletWriteError";
import { isDisplayableSnapshotHash } from "@/lib/snapshotHashDisplay";
import { orderAllowsConfirmFinalPlan } from "@/lib/escrowDraftFlow";

export type EscrowDetailDerivedSlice = {
  state: string;
  amount: string;
  currency: string;
  hasEscrow: boolean;
  isDraft: boolean;
  isPreEscrowProtocol: boolean;
  showItineraryBudgetZone: boolean;
  allowConfirmFinalPlan: boolean;
  chainMismatch: boolean;
  disputeDeadlineAt: string | undefined;
  disputeWindowExpired: boolean;
  showReorgBanner: boolean;
  txErrorMessage: string;
  snapshotHash: string | null;
  canDepositOnChain: boolean;
  canReleaseOnChain: boolean;
  canRefundOnChain: boolean;
  canOpenDisputeOnChain: boolean;
  disputeOnChainUnavailableReasonKey: string | null;
  needsDepositApproval: boolean;
};

export type EscrowDetailDerivedSliceInput = {
  order: OrderRow | null;
  itinerary: ItineraryBlock | null;
  t: (key: string) => string;
  chainId: number;
  expectedChainId: number;
  dismissReorgBanner: boolean;
  isConnected: boolean;
  tokenFromChain: `0x${string}` | undefined;
  escrowAddress: `0x${string}` | undefined;
  depositAmount: bigint | undefined;
  allowanceData: bigint | undefined;
  depositError: Error | null | undefined;
  releaseError: Error | null | undefined;
  refundError: Error | null | undefined;
  disputeError: Error | null | undefined;
  approveDepositError: Error | null | undefined;
};

/** 由订单/行程 + 钱包与 allowance 快照派生的 UI 与链上门闸（无副作用） */
export function deriveEscrowDetailSlice(input: EscrowDetailDerivedSliceInput): EscrowDetailDerivedSlice {
  const {
    order,
    itinerary,
    t,
    chainId,
    expectedChainId,
    dismissReorgBanner,
    isConnected,
    tokenFromChain,
    escrowAddress,
    depositAmount,
    allowanceData,
    depositError,
    releaseError,
    refundError,
    disputeError,
    approveDepositError,
  } = input;

  const state = order
    ? String(order.state ?? order.status ?? "unknown")
        .trim()
        .toLowerCase()
    : "";
  const amount = order?.amount ?? t("ui_em_dash");
  const currency = order?.currency ?? "";
  const hasEscrow = !!order?.escrow_address;
  const stateLower = state;
  const isDraft = stateLower === "draft";
  const subNorm = String((order as OrderRow & { sub_status?: string })?.sub_status ?? "")
    .toLowerCase()
    .replace(/-/g, "_");
  const bilateralConfirmed = subNorm === "confirmed";
  const isPreEscrowProtocol =
    !hasEscrow && (isDraft || stateLower === "created" || stateLower === "accepted");

  const chainMismatch = hasEscrow && chainId !== expectedChainId;
  const disputeDeadlineAt = order
    ? (order as OrderRow & { dispute_deadline_at?: string }).dispute_deadline_at
    : undefined;
  const disputeWindowExpired = !!disputeDeadlineAt && new Date(disputeDeadlineAt) < new Date();
  const reorgHint = order ? (order as OrderRow & { reorg_hint?: boolean }).reorg_hint === true : false;
  const showReorgBanner = reorgHint && !dismissReorgBanner;

  const chainWriteError =
    depositError ??
    releaseError ??
    refundError ??
    disputeError ??
    approveDepositError ??
    null;
  const txErrorMessage = chainWriteError ? walletErrorRaw(chainWriteError) : "";
  const snapshotHashRaw =
    itinerary?.snapshot_hash ??
    (order as OrderRow & { snapshot_hash?: string } | null)?.snapshot_hash ??
    null;
  const snapshotHash = isDisplayableSnapshotHash(snapshotHashRaw) ? snapshotHashRaw.trim() : null;

  const showItineraryBudgetZone = Boolean(isPreEscrowProtocol && itinerary);
  const allowConfirmFinalPlan = orderAllowsConfirmFinalPlan({
    state: stateLower,
    sub_status: (order as OrderRow & { sub_status?: string })?.sub_status,
    snapshotHash,
  });

  const canDepositOnChain = canDepositToEscrow(order, hasEscrow, depositAmount);
  const canReleaseOnChain = canReleaseAfterRating(order, hasEscrow);
  const canRefundOnChain = canRefundEscrow(order, hasEscrow);
  const canOpenDisputeOnChain = orderAllowsOnChainDispute(order, hasEscrow);
  const disputeOnChainUnavailableReasonKey = escrowDisputeOnChainUnavailableReasonKey(order);

  const needsDepositApproval =
    canDepositOnChain &&
    isConnected &&
    Boolean(tokenFromChain && escrowAddress) &&
    depositAmount !== undefined &&
    depositAmount > BigInt(0) &&
    allowanceData !== undefined &&
    allowanceData < depositAmount;

  return {
    state,
    amount,
    currency,
    hasEscrow,
    isDraft,
    isPreEscrowProtocol,
    showItineraryBudgetZone,
    allowConfirmFinalPlan,
    chainMismatch,
    disputeDeadlineAt,
    disputeWindowExpired,
    showReorgBanner,
    txErrorMessage,
    snapshotHash,
    canDepositOnChain,
    canReleaseOnChain,
    canRefundOnChain,
    canOpenDisputeOnChain,
    disputeOnChainUnavailableReasonKey,
    needsDepositApproval,
  };
}
