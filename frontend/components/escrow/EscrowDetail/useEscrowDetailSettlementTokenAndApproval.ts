"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isAddress } from "viem";
import {
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { erc20TokenAbi } from "@/lib/stakingAbi";
import { ESCROW_ABI } from "./escrowDetailHookModel";

export interface UseEscrowDetailSettlementTokenAndApprovalArgs {
  escrowAddress: `0x${string}` | undefined;
  chainId: number;
  expectedChainId: number;
  connectedAddress: string | undefined;
  depositAmount: bigint | undefined;
}

export function useEscrowDetailSettlementTokenAndApproval({
  escrowAddress,
  chainId,
  expectedChainId,
  connectedAddress,
  depositAmount,
}: UseEscrowDetailSettlementTokenAndApprovalArgs) {
  const [lastChainContractReadOkAt, setLastChainContractReadOkAt] = useState<number | null>(null);

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
        ? ([connectedAddress as `0x${string}`, escrowAddress] as const)
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

  return {
    readEscrowEnabled,
    tokenFromChain,
    settlementTokenSymbol,
    allowanceData,
    refetchAllowance,
    chainContractReadDegraded,
    lastChainContractReadOkAt,
    approveForDeposit,
    approveDepositPending,
    approveDepositError,
    resetApproveDeposit,
    approveDepositSuccess,
  };
}
