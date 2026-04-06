import { getAddress, isAddress } from "viem";

/** 部署的 Registry 合约；未配置或非法地址时返回 null（质押页仅隐藏链上读块）。 */
export function getRegistryAddress(): `0x${string}` | null {
  if (typeof process === "undefined") return null;
  const raw = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS?.trim();
  if (!raw) return null;
  if (!isAddress(raw)) return null;
  return getAddress(raw);
}
