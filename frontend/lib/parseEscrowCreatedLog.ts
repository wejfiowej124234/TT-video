import { decodeEventLog, type TransactionReceipt } from "viem";

import escrowFactoryAbi from "@/dapp/abis/EscrowFactory.json";

const ABI = escrowFactoryAbi as readonly unknown[];

/** 从 Factory 交易回执解析 `EscrowCreated` 中的新 Escrow 合约地址。 */
export function escrowAddressFromFactoryReceipt(
  receipt: TransactionReceipt,
  factoryAddress: `0x${string}`
): `0x${string}` | null {
  const want = factoryAddress.toLowerCase();
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== want) continue;
    try {
      const decoded = decodeEventLog({
        abi: ABI,
        data: log.data,
        topics: log.topics,
      });
      if (
        decoded.eventName === "EscrowCreated" &&
        decoded.args &&
        typeof decoded.args === "object" &&
        "escrow" in decoded.args
      ) {
        return decoded.args.escrow as `0x${string}`;
      }
    } catch {
      continue;
    }
  }
  return null;
}
