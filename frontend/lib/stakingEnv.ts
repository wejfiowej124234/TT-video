import { getAddress, isAddress } from "viem";

/** Staking 合约地址；未配置时质押页不展示链上质押只读块。 */
export function getStakingAddress(): `0x${string}` | null {
  if (typeof process === "undefined") return null;
  const raw = process.env.NEXT_PUBLIC_STAKING_ADDRESS?.trim();
  if (!raw) return null;
  if (!isAddress(raw)) return null;
  return getAddress(raw);
}
