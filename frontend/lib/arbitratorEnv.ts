import { getAddress, isAddress } from "viem";

/** Escrow 仲裁员地址；须与部署/运营约定一致，未配置时不在前端发起 createEscrow。 */
export function getArbitratorAddress(): `0x${string}` | null {
  if (typeof process === "undefined") return null;
  const raw = process.env.NEXT_PUBLIC_ARBITRATOR_ADDRESS?.trim();
  if (!raw) return null;
  if (!isAddress(raw)) return null;
  return getAddress(raw);
}
