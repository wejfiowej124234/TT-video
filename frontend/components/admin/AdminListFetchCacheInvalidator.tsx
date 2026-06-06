"use client";

import { useEffect } from "react";

import { resetAdminAuthSessionState } from "@/lib/admin/adminAuthSessionReset";

/** 登出 / 切账号时清空 Admin 列表与详情 SWR 缓存 · boot latch · prefetch。 */
export function AdminListFetchCacheInvalidator() {
  useEffect(() => {
    const onAuth = () => {
      resetAdminAuthSessionState();
    };
    window.addEventListener("traveltrust:auth-change", onAuth);
    return () => window.removeEventListener("traveltrust:auth-change", onAuth);
  }, []);

  return null;
}
