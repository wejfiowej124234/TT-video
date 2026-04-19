import { getAddress, isAddress } from "viem";

/** Guide 池（`GuideIdentityStakingPool`）；与后端 `GUIDE_STAKING_ADDRESS` / `GET /meta.chain.contracts.guide_staking_address` 对齐。 */
export function getGuideStakingAddress(): `0x${string}` | null {
  if (typeof process === "undefined") return null;
  const raw = process.env.NEXT_PUBLIC_GUIDE_STAKING_ADDRESS?.trim();
  if (!raw) return null;
  if (!isAddress(raw)) return null;
  return getAddress(raw);
}

/** Provider 池（`ProviderIdentityStakingPool`）；与后端 `STAKING_PROVIDER_ADDRESS` / `GET /meta.chain.contracts.staking_provider_address` 对齐。 */
export function getProviderStakingAddress(): `0x${string}` | null {
  if (typeof process === "undefined") return null;
  const raw = process.env.NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS?.trim();
  if (!raw) return null;
  if (!isAddress(raw)) return null;
  return getAddress(raw);
}
