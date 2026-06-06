"use client";

import { useMemo } from "react";
import { isAddress } from "viem";
import { useAccount, useSimulateContract } from "wagmi";
import { escrowDisputeSummaryToReasonHash } from "@/lib/escrowDisputeReason";
import { ESCROW_ABI } from "./escrowTxModalModel";
import type { ConfirmAction, OrderRow } from "./types";

export function useEscrowTxModalContractSims(opts: {
  confirmAction: ConfirmAction;
  order: OrderRow;
  chainId: number;
  expectedChainId: number;
  depositAmountOnChain?: bigint;
  disputeSummary: string;
}) {
  const { confirmAction: action, order, chainId, expectedChainId, depositAmountOnChain, disputeSummary } =
    opts;
  const { isConnected } = useAccount();

  const wrongChain = chainId !== expectedChainId;
  const escrowHex =
    order.escrow_address && isAddress(order.escrow_address)
      ? (order.escrow_address as `0x${string}`)
      : undefined;
  const simBase = Boolean(action && escrowHex && !wrongChain && isConnected);

  const disputeParsed = useMemo(
    () => escrowDisputeSummaryToReasonHash(disputeSummary),
    [disputeSummary],
  );

  const depositSim = useSimulateContract({
    address: escrowHex,
    abi: ESCROW_ABI,
    functionName: "deposit",
    args:
      depositAmountOnChain !== undefined && depositAmountOnChain > BigInt(0)
        ? [depositAmountOnChain]
        : undefined,
    query: {
      enabled:
        simBase &&
        action === "deposit" &&
        depositAmountOnChain !== undefined &&
        depositAmountOnChain > BigInt(0),
    },
  });

  const releaseSim = useSimulateContract({
    address: escrowHex,
    abi: ESCROW_ABI,
    functionName: "release",
    query: { enabled: simBase && action === "release" },
  });

  const refundSim = useSimulateContract({
    address: escrowHex,
    abi: ESCROW_ABI,
    functionName: "refund",
    query: { enabled: simBase && action === "refund" },
  });

  const disputeSim = useSimulateContract({
    address: escrowHex,
    abi: ESCROW_ABI,
    functionName: "openDispute",
    args: disputeParsed.ok ? [disputeParsed.hash] : undefined,
    query: {
      enabled: simBase && action === "dispute" && disputeParsed.ok,
    },
  });

  const activeSim =
    action === "deposit"
      ? depositSim
      : action === "release"
        ? releaseSim
        : action === "refund"
          ? refundSim
          : action === "dispute"
            ? disputeSim
            : null;

  const gasUnits = (activeSim?.data as { request?: { gas?: bigint } } | undefined)?.request?.gas;
  const gasPending = Boolean(activeSim?.isFetching || activeSim?.isPending);
  const gasFailed = Boolean(simBase && action && activeSim?.isError);

  return {
    isConnected,
    wrongChain,
    disputeParsed,
    gasUnits,
    gasPending,
    gasFailed,
  };
}
