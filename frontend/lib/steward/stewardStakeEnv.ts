import { getAddress, isAddress } from "viem";

/** `RegionStewardStakePool`；与根 `.env` **`REGION_STEWARD_STAKE_POOL_ADDRESS`** / sync **`NEXT_PUBLIC_*`** 对齐。 */
export function getRegionStewardStakePoolAddress(): `0x${string}` | null {
  if (typeof process === "undefined") return null;
  const raw = process.env.NEXT_PUBLIC_REGION_STEWARD_STAKE_POOL_ADDRESS?.trim();
  if (!raw || !isAddress(raw)) return null;
  return getAddress(raw);
}
