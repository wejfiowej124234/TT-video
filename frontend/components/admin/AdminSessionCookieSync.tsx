"use client";

import { useEffect } from "react";

import { syncClientSessionUserIdCookieFromStorage } from "@/lib/apiClient/auth/sessionSideEffects";

/** Admin 子树挂载时同步 localStorage → cookie，减少硬刷新 middleware 误跳 `/auth/login`。 */
export function AdminSessionCookieSync() {
  useEffect(() => {
    syncClientSessionUserIdCookieFromStorage();
  }, []);
  return null;
}
