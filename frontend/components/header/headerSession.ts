"use client";

import { useRef, useEffect, useLayoutEffect, useState, useCallback } from "react";
import { getMe, clearGetMeCache, getAuthHeaders } from "@/lib/apiClient";

/** 与 `CommunityAuthContext.normalizeMe` 同源：须 `user.id` 存在且非 `anonymous` 才视为已登录（勿仅凭 localStorage）。 */
export function headerSessionUserFromMe(me: unknown): {
  id: string;
  nickname?: string | null;
  avatar_url?: string | null;
} | null {
  if (!me || typeof me !== "object") return null;
  const root = me as Record<string, unknown>;
  const inner =
    root.user && typeof root.user === "object" && root.user !== null
      ? (root.user as Record<string, unknown>)
      : root;
  const id = typeof inner.id === "string" ? inner.id : undefined;
  if (!id || id === "anonymous") return null;
  const nickname = inner.nickname;
  const avatar_url = inner.avatar_url;
  return {
    id,
    nickname: typeof nickname === "string" ? nickname : nickname === null ? null : undefined,
    avatar_url: typeof avatar_url === "string" ? avatar_url : avatar_url === null ? null : undefined,
  };
}

/**
 * 顶栏会话：以 GET /me 为准（与社区 `CommunityAuthProvider` 一致），避免仅有陈旧 `traveltrust_user_id` 时误显头像菜单。
 * `mounted` 前按访客展示登录/注册（不读 localStorage），避免 SSR 与客户端 hydration 分叉。
 */
export function useHeaderSession() {
  const [mounted, setMounted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sessionUser, setSessionUser] = useState<{
    id: string;
    nickname?: string | null;
    avatar_url?: string | null;
  } | null>(null);
  const genRef = useRef(0);

  const run = useCallback(() => {
    const gen = ++genRef.current;
    try {
      if (typeof window === "undefined") {
        if (gen !== genRef.current) return;
        setSessionUser(null);
        setChecking(false);
        return;
      }
      const auth = getAuthHeaders();
      const canProbe = !!(auth.Authorization || auth["X-User-Id"]);
      if (!canProbe) {
        if (gen !== genRef.current) return;
        setSessionUser(null);
        setChecking(false);
        return;
      }
      setChecking(true);
      void getMe()
        .then((me) => {
          if (gen !== genRef.current) return;
          setSessionUser(headerSessionUserFromMe(me));
          setChecking(false);
        })
        .catch((err) => {
          if (gen !== genRef.current) return;
          if (typeof window !== "undefined") {
            console.error("Header useHeaderSession getMe:", err);
          }
          setSessionUser(null);
          setChecking(false);
        });
    } catch {
      if (gen !== genRef.current) return;
      setSessionUser(null);
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  /** 不在每次 pathname 变更时重打 GET /me，避免与 App Router 的 RSC 导航抢连接、拖慢切页体感 */
  useLayoutEffect(() => {
    if (!mounted) return;
    run();
  }, [mounted, run]);

  useEffect(() => {
    if (!mounted) return;
    const onAuthChange = () => {
      clearGetMeCache();
      run();
    };
    window.addEventListener("traveltrust:auth-change", onAuthChange);
    return () => window.removeEventListener("traveltrust:auth-change", onAuthChange);
  }, [mounted, run]);

  useEffect(() => {
    if (!mounted) return;
    const onProfileUpdated = () => {
      clearGetMeCache();
      run();
    };
    window.addEventListener("traveltrust:profile-updated", onProfileUpdated);
    return () => window.removeEventListener("traveltrust:profile-updated", onProfileUpdated);
  }, [mounted, run]);

  return { sessionUser, checking, mounted } as const;
}
