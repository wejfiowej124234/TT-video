/**
 * FeeRouter 接线 UI 与自检（07 §5.2A、Runbook §7.1、与 requirePlatformFeeRecipient 一致）。
 */

import { getAddress, isAddress } from "viem";

import { getFeeRouterAddress } from "./feeRouterEnv";

/** 自 GET /meta 根对象的 chain.contracts 读取 fee_router / escrow_platform_fee_recipient 原始字符串。 */
export function rawFeeRouterFromMeta(meta: unknown): string | null {
  const chain =
    typeof meta === "object" && meta !== null && "chain" in meta
      ? (meta as { chain?: unknown }).chain
      : undefined;
  const contracts =
    typeof chain === "object" && chain !== null && "contracts" in chain
      ? (chain as { contracts?: Record<string, unknown> | null }).contracts
      : undefined;
  if (!contracts || typeof contracts !== "object") return null;
  const fr =
    (typeof contracts.fee_router_address === "string" && contracts.fee_router_address.trim()) ||
    (typeof contracts.escrow_platform_fee_recipient === "string" &&
      contracts.escrow_platform_fee_recipient.trim()) ||
    "";
  return fr || null;
}

export function normalizeEvmAddr(raw: string | null | undefined): `0x${string}` | null {
  const s = raw?.trim();
  if (!s) return null;
  return isAddress(s) ? getAddress(s as `0x${string}`) : null;
}

export type FeeRouterWiringUi = {
  metaRaw: string | null;
  envAddr: `0x${string}` | null;
  metaAddr: `0x${string}` | null;
  mismatch: boolean;
  neither: boolean;
};

/** 供 Escrow 创建前展示：env 与 /meta 规范化地址及是否冲突。 */
export function computeFeeRouterWiringUi(meta: unknown): FeeRouterWiringUi {
  const metaRaw = rawFeeRouterFromMeta(meta);
  const metaAddr = normalizeEvmAddr(metaRaw);
  const envAddr = getFeeRouterAddress();
  const mismatch = Boolean(envAddr && metaAddr && envAddr !== metaAddr);
  const neither = !envAddr && !metaAddr;
  return { metaRaw, envAddr, metaAddr, mismatch, neither };
}

export function shortHexAddr(addr: string, head = 6, tail = 4): string {
  const t = addr.trim();
  if (t.length <= head + tail + 2) return t;
  return `${t.slice(0, head + 2)}…${t.slice(-tail)}`;
}
