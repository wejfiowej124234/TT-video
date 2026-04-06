"use client";

/**
 * P9 DApp：Escrow 链上写操作（01 §7 须钱包签）
 * 与 06 txMachine、09 §2.7 一致；签名前由 UI 展示金额/合约/链（05 §九 9.0.5）
 */
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import escrowAbi from "../abis/Escrow.json";

const ABI = escrowAbi as readonly unknown[];

export function useEscrowRelease(escrowAddress: `0x${string}` | undefined) {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const release = () => {
    if (!escrowAddress) return;
    writeContract({ address: escrowAddress, abi: ABI, functionName: "release" });
  };
  return { release, isPending: isPending || isConfirming, isSuccess, error, hash, reset };
}

export function useEscrowDeposit(escrowAddress: `0x${string}` | undefined, amount: bigint | undefined) {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const deposit = () => {
    if (!escrowAddress || amount === undefined) return;
    writeContract({ address: escrowAddress, abi: ABI, functionName: "deposit", args: [amount] });
  };
  return { deposit, isPending: isPending || isConfirming, isSuccess, error, hash, reset };
}

export function useEscrowRefund(escrowAddress: `0x${string}` | undefined) {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const refund = () => {
    if (!escrowAddress) return;
    writeContract({ address: escrowAddress, abi: ABI, functionName: "refund" });
  };
  return { refund, isPending: isPending || isConfirming, isSuccess, error, hash, reset };
}

export function useEscrowOpenDispute(escrowAddress: `0x${string}` | undefined) {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const openDispute = (reasonHash: `0x${string}`) => {
    if (!escrowAddress) return;
    writeContract({ address: escrowAddress, abi: ABI, functionName: "openDispute", args: [reasonHash] });
  };
  return { openDispute, isPending: isPending || isConfirming, isSuccess, error, hash, reset };
}
