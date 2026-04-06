import { getAddress, isAddress } from "viem";

/** EscrowFactory 部署地址；未配置时 createEscrow 链上入口不可用。 */
export function getEscrowFactoryAddress(): `0x${string}` | null {
  if (typeof process === "undefined") return null;
  const raw = process.env.NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS?.trim();
  if (!raw) return null;
  if (!isAddress(raw)) return null;
  return getAddress(raw);
}
