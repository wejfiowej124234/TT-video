import { getAddress, isAddress } from "viem";

/** EscrowFactory 部署地址；未配置时 createEscrow 链上入口不可用。 */
export function getEscrowFactoryAddress(): `0x${string}` | null {
  if (typeof process === "undefined") return null;
  const raw = process.env.NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS?.trim();
  if (!raw) return null;
  if (!isAddress(raw)) return null;
  return getAddress(raw);
}

/** EscrowFactoryV2 部署地址（双边确认 · Phase ② Sepolia）；未广播前可为空。 */
export function getEscrowFactoryV2Address(): `0x${string}` | null {
  if (typeof process === "undefined") return null;
  const raw = process.env.NEXT_PUBLIC_ESCROW_FACTORY_V2_ADDRESS?.trim();
  if (!raw) return null;
  if (!isAddress(raw)) return null;
  return getAddress(raw);
}

/** 优先 V2（已配置时），否则 V1 legacy factory。 */
export function getActiveEscrowFactoryAddress(): `0x${string}` | null {
  return getEscrowFactoryV2Address() ?? getEscrowFactoryAddress();
}
