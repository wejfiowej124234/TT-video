"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

/**
 * SSR / hydration 安全：挂载前恒为 false（与顶栏 `useHeaderSession.mounted` 同策略），
 * 避免 wagmi `isConnected` 在服务端与客户端首帧不一致导致 Next 水合失败。
 */
export function useMeOnboardingClientWalletConnected(): boolean {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted && isConnected;
}
