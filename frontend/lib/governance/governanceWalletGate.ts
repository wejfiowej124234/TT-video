import { getExpectedChainId } from "@/lib/chainEnv";

/** 治理写链前：钱包已连 + 链 ID 与 `NEXT_PUBLIC_CHAIN_ID` / meta 一致 */
export function isGovernanceChainReady(
  isConnected: boolean,
  walletChainId: number | undefined,
  expectedChainId: number,
): boolean {
  return isConnected && walletChainId === expectedChainId;
}

export function governanceExpectedChainId(metaChainId: number | null | undefined): number {
  if (typeof metaChainId === "number" && Number.isFinite(metaChainId) && metaChainId > 0) {
    return metaChainId;
  }
  return getExpectedChainId();
}

export function normalizeEthAddress(addr: string | null | undefined): string | null {
  const v = typeof addr === "string" ? addr.trim().toLowerCase() : "";
  return v.startsWith("0x") && v.length === 42 ? v : null;
}

export function governanceWalletAddressMismatch(
  connected: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  const a = normalizeEthAddress(connected);
  const b = normalizeEthAddress(expected);
  if (!a || !b) return false;
  return a !== b;
}
