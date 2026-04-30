"use client";

/**
 * 钱包 **chainId / address** 与邮箱会话解耦：连接器变化时清空 **`getMeFull`** 缓存并广播，
 * 迫使依赖「已登录 + 当前链」的 UI 重新拉 **`GET /api/v1/me`**（与 04 Target、05 七点十一致）。
 */
import { useEffect, useRef } from "react";
import { useAccount, useChainId } from "wagmi";
import { clearGetMeFullCache } from "@/lib/apiClient";

export function WalletSessionRevalidate() {
  const { address } = useAccount();
  const chainId = useChainId();
  const prev = useRef<{ address?: string; chainId: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const next = { address: address ?? undefined, chainId };
    if (prev.current === null) {
      prev.current = next;
      return;
    }
    if (prev.current.address === next.address && prev.current.chainId === next.chainId) {
      return;
    }
    prev.current = next;
    clearGetMeFullCache();
    window.dispatchEvent(new CustomEvent("traveltrust:wallet-context-changed"));
    window.dispatchEvent(new CustomEvent("traveltrust:auth-change"));
  }, [address, chainId]);

  return null;
}
