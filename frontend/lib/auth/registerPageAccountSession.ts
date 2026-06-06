"use client";

import { useCallback, useEffect, useState } from "react";
import { onAccountSessionChange, probeAccountLoggedInViaGetMe } from "./accountSessionProbe";

/**
 * 入驻/申请页账户会话：与顶栏 `useHeaderSession` 同源（`getMe` + localStorage 凭证），
 * 并监听 `traveltrust:auth-change`，避免登出后页身仍按旧会话展示「审核中」等门态。
 */
export function useRegisterPageAccountSession(): boolean | null {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const probe = useCallback(() => {
    if (typeof window === "undefined") return Promise.resolve();
    return probeAccountLoggedInViaGetMe().then(setIsLoggedIn);
  }, []);

  useEffect(() => {
    void probe();
  }, [probe]);

  useEffect(() => onAccountSessionChange(() => void probe()), [probe]);

  return isLoggedIn;
}
