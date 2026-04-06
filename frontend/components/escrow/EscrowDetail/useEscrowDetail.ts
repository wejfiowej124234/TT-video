"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { isAddress } from "viem";
import { useAccount, useChainId, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useEscrowChainSync } from "./useEscrowChainSync";
import { getOrder, getOrderChainSyncStatus, getMe, isComplianceError } from "@/lib/apiClient";
import { consumeEscrowOrderPrefetch } from "@/lib/orderEscrowPrefetch";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { useEscrowRelease, useEscrowDeposit, useEscrowRefund, useEscrowOpenDispute } from "@/dapp/hooks/useEscrowActions";
import escrowAbiJson from "@/dapp/abis/Escrow.json";
import { erc20TokenAbi } from "@/lib/stakingAbi";
import type { OrderRow, OrderResponse, ItineraryBlock, ConfirmAction, OrderChainSyncState } from "./types";
import { parseOrderChainSyncResponse } from "./types";
import {
  canDepositToEscrow,
  canRefundEscrow,
  canReleaseAfterRating,
  canOpenDisputeOnChain as orderAllowsOnChainDispute,
  escrowDisputeOnChainUnavailableReasonKey,
} from "./escrowOnChainEligibility";
import { orderAmountToBigInt } from "./utils";
import { getExpectedChainId } from "@/lib/chainEnv";
import { walletErrorRaw } from "@/lib/mapWalletWriteError";
import { isDisplayableSnapshotHash } from "@/lib/snapshotHashDisplay";

const ESCROW_ABI = escrowAbiJson as readonly unknown[];

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
    guide?: { wallet_address?: string | null };
  } | null;
  state: string;
  amount: string;
  currency: string;
  hasEscrow: boolean;
  isDraft: boolean;
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

export function useEscrowDetail(escrowId: string, t: (key: string) => string): UseEscrowDetailResult {
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryBlock | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [dismissReorgBanner, setDismissReorgBanner] = useState(false);
  const [meData, setMeData] = useState<{
    user?: { id?: string; default_wallet_address?: string | null };
    guide?: { wallet_address?: string | null };
  } | null>(null);
  const [chainSync, setChainSync] = useState<OrderChainSyncState | null>(null);
  const [lastChainContractReadOkAt, setLastChainContractReadOkAt] = useState<number | null>(null);

  const { isConnected, address: connectedAddress } = useAccount();
  const chainId = useChainId();
  const expectedChainId = getExpectedChainId();
  const escrowRaw = order?.escrow_address;
  const escrowAddress =
    escrowRaw && isAddress(escrowRaw) ? (escrowRaw as `0x${string}`) : undefined;
  const depositAmount = orderAmountToBigInt(order?.amount);
  const readEscrowEnabled = Boolean(escrowAddress && chainId === expectedChainId);

  const tokenRead = useReadContract({
    address: escrowAddress,
    abi: ESCROW_ABI,
    functionName: "token",
    query: { enabled: readEscrowEnabled },
  });
  const {
    isError: tokenQueryError,
    isSuccess: tokenQuerySuccess,
    fetchStatus: tokenFetchStatus,
    dataUpdatedAt: tokenDataUpdatedAt,
    error: tokenQueryErrObj,
  } = tokenRead;

  /** B-068：错误态下忽略 TanStack Query 可能保留的上一笔 `data`，禁止冒充最新链上读 */
  const tokenFromChain =
    readEscrowEnabled &&
    tokenQuerySuccess &&
    !tokenQueryError &&
    typeof tokenRead.data === "string" &&
    isAddress(tokenRead.data)
      ? (tokenRead.data as `0x${string}`)
      : undefined;

  const tokenReadSettledError =
    readEscrowEnabled && tokenQueryError && tokenFetchStatus === "idle";

  const tokenSymbolRead = useReadContract({
    address: tokenFromChain,
    abi: erc20TokenAbi,
    functionName: "symbol",
    query: { enabled: Boolean(readEscrowEnabled && tokenFromChain) },
  });
  const {
    isError: symbolQueryError,
    isSuccess: symbolQuerySuccess,
    fetchStatus: symbolFetchStatus,
  } = tokenSymbolRead;

  const settlementTokenSymbol =
    readEscrowEnabled &&
    tokenFromChain &&
    symbolQuerySuccess &&
    !symbolQueryError &&
    typeof tokenSymbolRead.data === "string" &&
    tokenSymbolRead.data.length > 0
      ? tokenSymbolRead.data
      : undefined;

  const symbolReadSettledError =
    readEscrowEnabled &&
    Boolean(tokenFromChain) &&
    symbolQueryError &&
    symbolFetchStatus === "idle";

  const allowanceEnabled = Boolean(readEscrowEnabled && tokenFromChain && connectedAddress);

  const {
    data: allowanceDataRaw,
    refetch: refetchAllowance,
    isError: allowanceQueryError,
    isSuccess: allowanceQuerySuccess,
    fetchStatus: allowanceFetchStatus,
  } = useReadContract({
    address: tokenFromChain,
    abi: erc20TokenAbi,
    functionName: "allowance",
    args:
      connectedAddress && escrowAddress && tokenFromChain
        ? [connectedAddress, escrowAddress]
        : undefined,
    query: { enabled: allowanceEnabled },
  });

  const allowanceReadSettledError =
    allowanceEnabled && allowanceQueryError && allowanceFetchStatus === "idle";

  const allowanceData =
    allowanceEnabled && allowanceQuerySuccess && !allowanceQueryError && allowanceDataRaw !== undefined
      ? allowanceDataRaw
      : undefined;

  const chainContractReadDegraded =
    tokenReadSettledError || symbolReadSettledError || allowanceReadSettledError;

  useEffect(() => {
    setLastChainContractReadOkAt(null);
  }, [escrowAddress, expectedChainId]);

  useEffect(() => {
    if (!readEscrowEnabled) return;
    if (tokenQuerySuccess && !tokenQueryError && tokenDataUpdatedAt) {
      setLastChainContractReadOkAt(tokenDataUpdatedAt);
    }
  }, [readEscrowEnabled, tokenQuerySuccess, tokenQueryError, tokenDataUpdatedAt]);

  const chainReadDegradedLogRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (chainContractReadDegraded) {
      if (!chainReadDegradedLogRef.current) {
        console.warn(
          "[useEscrowDetail][B-068] chainContractReadDegraded: wallet RPC / readContract failed",
          {
            tokenReadSettledError,
            symbolReadSettledError,
            allowanceReadSettledError,
            tokenMessage: tokenQueryErrObj instanceof Error ? tokenQueryErrObj.message : undefined,
          },
        );
      }
      chainReadDegradedLogRef.current = true;
    } else {
      chainReadDegradedLogRef.current = false;
    }
  }, [
    chainContractReadDegraded,
    tokenReadSettledError,
    symbolReadSettledError,
    allowanceReadSettledError,
    tokenQueryErrObj,
  ]);

  const {
    writeContract: writeApproveDeposit,
    data: approveDepositHash,
    isPending: approveDepositWritePending,
    error: approveDepositError,
    reset: resetApproveDeposit,
  } = useWriteContract();
  const { isLoading: approveDepositConfirming, isSuccess: approveDepositSuccess } =
    useWaitForTransactionReceipt({ hash: approveDepositHash });

  const approveDepositPending = approveDepositWritePending || approveDepositConfirming;

  const approveForDeposit = useCallback(() => {
    if (!tokenFromChain || !escrowAddress || depositAmount === undefined || depositAmount <= BigInt(0)) {
      return;
    }
    writeApproveDeposit({
      address: tokenFromChain,
      abi: erc20TokenAbi,
      functionName: "approve",
      args: [escrowAddress, depositAmount],
    });
  }, [tokenFromChain, escrowAddress, depositAmount, writeApproveDeposit]);

  const {
    deposit,
    isPending: depositPending,
    isSuccess: depositSuccess,
    error: depositError,
    reset: resetDeposit,
  } = useEscrowDeposit(escrowAddress, depositAmount);
  const {
    release,
    isPending: releasePending,
    isSuccess: releaseSuccess,
    error: releaseError,
    reset: resetRelease,
  } = useEscrowRelease(escrowAddress);
  const {
    refund,
    isPending: refundPending,
    isSuccess: refundSuccess,
    error: refundError,
    reset: resetRefund,
  } = useEscrowRefund(escrowAddress);
  const {
    openDispute,
    isPending: disputePending,
    isSuccess: disputeSuccess,
    error: disputeError,
    reset: resetDispute,
  } = useEscrowOpenDispute(escrowAddress);

  const pending =
    depositPending || releasePending || refundPending || disputePending || approveDepositPending;
  const success = depositSuccess || releaseSuccess || refundSuccess || disputeSuccess;
  const failed =
    !!depositError ||
    !!releaseError ||
    !!refundError ||
    !!disputeError ||
    !!approveDepositError;

  const txModalMachine = useMemo((): { pending: boolean; success: boolean; failed: boolean } => {
    const a = confirmAction;
    if (a === "deposit") {
      return {
        pending: depositPending || approveDepositPending,
        success: depositSuccess && !depositError && !approveDepositError,
        failed: !!depositError || !!approveDepositError,
      };
    }
    if (a === "release") {
      return {
        pending: releasePending,
        success: releaseSuccess && !releaseError,
        failed: !!releaseError,
      };
    }
    if (a === "refund") {
      return {
        pending: refundPending,
        success: refundSuccess && !refundError,
        failed: !!refundError,
      };
    }
    if (a === "dispute") {
      return {
        pending: disputePending,
        success: disputeSuccess && !disputeError,
        failed: !!disputeError,
      };
    }
    return { pending: false, success: false, failed: false };
  }, [
    confirmAction,
    depositPending,
    approveDepositPending,
    depositSuccess,
    depositError,
    approveDepositError,
    releasePending,
    releaseSuccess,
    releaseError,
    refundPending,
    refundSuccess,
    refundError,
    disputePending,
    disputeSuccess,
    disputeError,
  ]);

  const txSectionMachine = useMemo((): { pending: boolean; success: boolean; failed: boolean } => {
    if (confirmAction != null) return txModalMachine;
    return {
      pending,
      failed,
      success: success && !failed,
    };
  }, [confirmAction, txModalMachine, pending, failed, success]);

  const resetChainWriteError = useCallback(() => {
    if (depositError) resetDeposit();
    else if (releaseError) resetRelease();
    else if (refundError) resetRefund();
    else if (disputeError) resetDispute();
    else if (approveDepositError) resetApproveDeposit();
  }, [
    depositError,
    releaseError,
    refundError,
    disputeError,
    approveDepositError,
    resetDeposit,
    resetRelease,
    resetRefund,
    resetDispute,
    resetApproveDeposit,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const errs = [depositError, releaseError, refundError, disputeError, approveDepositError].filter(
      Boolean
    ) as Error[];
    if (errs.length === 0) return;
    for (const e of errs) {
      console.error("[useEscrowDetail] chain write error (raw, UI uses mapped i18n):", walletErrorRaw(e));
    }
  }, [depositError, releaseError, refundError, disputeError, approveDepositError]);

  const fetchChainSync = useCallback(() => {
    getOrderChainSyncStatus(escrowId)
      .then((raw) => {
        setChainSync(parseOrderChainSyncResponse(raw));
      })
      .catch(() => {
        setChainSync(null);
      });
  }, [escrowId]);

  useEffect(() => {
    fetchChainSync();
  }, [fetchChainSync]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    const pref = consumeEscrowOrderPrefetch(escrowId);
    if (pref) {
      setOrder(pref.order);
      setItinerary(pref.itinerary);
    }
    getOrder(escrowId)
      .then((data: unknown) => {
        if (cancelled) return;
        setError(null);
        const res = data as OrderResponse;
        const o = res?.order ?? (data as OrderRow);
        setOrder(o?.id ? o : { ...o, id: escrowId });
        setItinerary(res?.itinerary ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        if (typeof window !== "undefined") {
          console.error("useEscrowDetail getOrder:", err);
        }
        const msg = err instanceof Error ? err.message : "";
        if (isComplianceError(err)) setError(msg || t("escrow_loadFailed"));
        else if (/403|forbidden|权限|暂无权限/i.test(msg)) setError(t("escrow_403_message"));
        else setError(mapApiReadError(err, t, "escrow_loadFailed"));
      });
    return () => {
      cancelled = true;
    };
  }, [escrowId, t]);

  useEffect(() => {
    getMe()
      .then((res) =>
        setMeData(
          res as {
            user?: { id?: string; default_wallet_address?: string | null };
            guide?: { wallet_address?: string | null };
          }
        )
      )
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("useEscrowDetail getMe:", err);
        }
        setMeData(null);
      });
  }, []);

  const refreshOrder = useCallback(() => {
    getOrder(escrowId)
      .then((data: unknown) => {
        setError(null);
        const res = data as OrderResponse;
        const o = res?.order ?? (data as OrderRow);
        if (o?.id) setOrder(o);
        if (res?.itinerary != null) setItinerary(res.itinerary);
        fetchChainSync();
      })
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("useEscrowDetail refreshOrder getOrder:", err);
        }
        const msg = err instanceof Error ? err.message : "";
        if (isComplianceError(err)) setError(msg || t("escrow_loadFailed"));
        else if (/403|forbidden|权限|暂无权限/i.test(msg)) setError(t("escrow_403_message"));
        else setError(mapApiReadError(err, t, "escrow_loadFailed"));
      });
  }, [escrowId, t, fetchChainSync]);

  useEscrowChainSync(escrowAddress, readEscrowEnabled, refreshOrder);

  useEffect(() => {
    if (disputeSuccess) refreshOrder();
  }, [disputeSuccess, refreshOrder]);

  useEffect(() => {
    if (releaseSuccess) refreshOrder();
  }, [releaseSuccess, refreshOrder]);

  useEffect(() => {
    if (depositSuccess) refreshOrder();
  }, [depositSuccess, refreshOrder]);

  useEffect(() => {
    if (refundSuccess) refreshOrder();
  }, [refundSuccess, refreshOrder]);

  useEffect(() => {
    if (!approveDepositSuccess) return;
    void refetchAllowance();
  }, [approveDepositSuccess, refetchAllowance]);

  const state = order ? (order.state ?? order.status ?? "unknown") as string : "";
  const amount = order?.amount ?? t("ui_em_dash");
  const currency = order?.currency ?? "";
  const hasEscrow = !!order?.escrow_address;
  const isDraft = state === "draft";
  const chainMismatch = hasEscrow && chainId !== expectedChainId;
  const disputeDeadlineAt = order ? (order as OrderRow & { dispute_deadline_at?: string }).dispute_deadline_at : undefined;
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
    order,
    itinerary,
    error,
    refreshOrder,
    confirmAction,
    setConfirmAction,
    dismissReorgBanner,
    setDismissReorgBanner,
    meData,
    state,
    amount,
    currency,
    hasEscrow,
    isDraft,
    expectedChainId,
    chainMismatch,
    disputeDeadlineAt,
    disputeWindowExpired,
    showReorgBanner,
    deposit,
    release,
    refund,
    openDispute,
    depositPending,
    releasePending,
    refundPending,
    disputePending,
    depositSuccess,
    releaseSuccess,
    refundSuccess,
    disputeSuccess,
    depositError: depositError ?? null,
    releaseError: releaseError ?? null,
    refundError: refundError ?? null,
    disputeError: disputeError ?? null,
    pending,
    success,
    failed,
    txModalPending: txModalMachine.pending,
    txModalSuccess: txModalMachine.success,
    txModalFailed: txModalMachine.failed,
    txSectionPending: txSectionMachine.pending,
    txSectionSuccess: txSectionMachine.success,
    txSectionFailed: txSectionMachine.failed,
    resetChainWriteError,
    connectedAddress,
    isConnected,
    chainId,
    depositAmount,
    txErrorMessage,
    snapshotHash,
    canDepositOnChain,
    canReleaseOnChain,
    canRefundOnChain,
    canOpenDisputeOnChain,
    disputeOnChainUnavailableReasonKey,
    needsDepositApproval,
    approveForDeposit,
    approveDepositPending,
    approveDepositError: approveDepositError ?? null,
    settlementTokenAddress: tokenFromChain,
    settlementTokenSymbol,
    chainSync,
    chainContractReadDegraded,
    lastChainContractReadOkAt,
  };
}
