import { getAddress, isAddress } from "viem";

/**
 * P5-4-1：`InvestorDistributionClaim` 部署地址（与链上环境一致；未设则 Claim UI 仅展示说明）。
 */
export function getInvestorDistributionClaimAddress(): `0x${string}` | undefined {
  if (typeof process === "undefined") return undefined;
  const raw = process.env.NEXT_PUBLIC_INVESTOR_DISTRIBUTION_CLAIM_ADDRESS?.trim();
  if (!raw) return undefined;
  return isAddress(raw) ? getAddress(raw as `0x${string}`) : undefined;
}
