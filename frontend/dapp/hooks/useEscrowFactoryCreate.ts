"use client";

/**
 * EscrowFactory.createEscrow：`platformFeeRecipient` 默认由 `requirePlatformFeeRecipient()` 解析（env 优先，/meta 兜底，二者冲突则抛错）。
 */
import { useMemo } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { getEscrowFactoryAddress } from "@/lib/escrowFactoryEnv";
import { requirePlatformFeeRecipient } from "@/lib/platformFeeRecipient";

import escrowFactoryAbi from "../abis/EscrowFactory.json";

const ABI = escrowFactoryAbi as readonly unknown[];

export type EscrowCreateParamsInput = {
  chainId: bigint;
  orderId: `0x${string}`;
  snapshotHash: `0x${string}`;
  schemaVersion: number;
  traveler: `0x${string}`;
  guide: `0x${string}`;
  token: `0x${string}`;
  totalAmount: bigint;
  platformFeeBps: number;
  serviceStart: bigint;
  serviceEnd: bigint;
  disputeWindowSeconds: number;
  arbitrator: `0x${string}`;
};

export function useEscrowFactoryCreate() {
  const factory = useMemo(() => getEscrowFactoryAddress(), []);
  const {
    writeContractAsync,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract();
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess,
  } = useWaitForTransactionReceipt({ hash });

  const createEscrow = async (
    params: EscrowCreateParamsInput,
    opts?: { platformFeeRecipient?: `0x${string}`; signal?: AbortSignal }
  ) => {
    if (!factory) {
      throw new Error("escrow_factory_unconfigured: set NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS");
    }
    const platformFeeRecipient =
      opts?.platformFeeRecipient ?? (await requirePlatformFeeRecipient(opts?.signal));
    return writeContractAsync({
      address: factory,
      abi: ABI,
      functionName: "createEscrow",
      args: [
        {
          chainId: params.chainId,
          orderId: params.orderId,
          snapshotHash: params.snapshotHash,
          schemaVersion: params.schemaVersion,
          traveler: params.traveler,
          guide: params.guide,
          platformFeeRecipient,
          token: params.token,
          totalAmount: params.totalAmount,
          platformFeeBps: params.platformFeeBps,
          serviceStart: params.serviceStart,
          serviceEnd: params.serviceEnd,
          disputeWindowSeconds: params.disputeWindowSeconds,
          arbitrator: params.arbitrator,
        },
      ],
    });
  };

  return {
    factory,
    createEscrow,
    hash,
    receipt,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    reset,
  };
}
