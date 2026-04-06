import { getAddress, isAddress } from "viem";

/** 结算 ERC-20（与后端 `SETTLEMENT_TOKEN`、canonical snapshot 一致）；未配置时链上创建不可用。 */
export function getSettlementTokenAddress(): `0x${string}` | null {
  if (typeof process === "undefined") return null;
  const raw = process.env.NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS?.trim();
  if (!raw) return null;
  if (!isAddress(raw)) return null;
  return getAddress(raw);
}
