"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getMe, clearGetMeCache } from "@/lib/apiClient";

export type CommunityMeUser = {
  id: string;
  nickname?: string | null;
  avatar_url?: string | null;
  /** GET /api/v1/me 的 `users.role`（与 04 一致） */
  role?: string | null;
  /** `user.default_wallet_address`，展示时由前端缩写 */
  default_wallet_address?: string | null;
};

type CommunityAuthContextValue = {
  isLoggedIn: boolean;
  isLoading: boolean;
  /** 已登录时来自 GET /api/v1/me；未登录为 null */
  user: CommunityMeUser | null;
};

const CommunityAuthContext = createContext<CommunityAuthContextValue>({
  isLoggedIn: false,
  isLoading: true,
  user: null,
});

function normalizeMe(me: unknown): CommunityMeUser | null {
  if (!me || typeof me !== "object") return null;
  const root = me as Record<string, unknown>;
  const inner =
    root.user && typeof root.user === "object" && root.user !== null
      ? (root.user as Record<string, unknown>)
      : root;
  const id = typeof inner.id === "string" ? inner.id : undefined;
  if (!id || id === "anonymous") return null;
  const w = inner.default_wallet_address;
  return {
    id,
    nickname: typeof inner.nickname === "string" ? inner.nickname : inner.nickname === null ? null : undefined,
    avatar_url: typeof inner.avatar_url === "string" ? inner.avatar_url : inner.avatar_url === null ? null : undefined,
    role: typeof inner.role === "string" ? inner.role : inner.role === null ? null : undefined,
    default_wallet_address: typeof w === "string" ? w : w === null ? null : undefined,
  };
}

export function useCommunityAuth() {
  const ctx = useContext(CommunityAuthContext);
  if (!ctx) throw new Error("useCommunityAuth must be used within CommunityAuthProvider");
  return ctx;
}

/** 31 附录：社区内登录态（getMe）；发帖/评论/私信前校验。监听 traveltrust:auth-change 与顶栏一致。 */
export function CommunityAuthProvider({ children }: { children: React.ReactNode }) {
  const communityAuthMeGen = useRef(0);
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [user, setUser] = useState<CommunityMeUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      const gen = ++communityAuthMeGen.current;
      setLoading(true);
      getMe()
        .then((me) => {
          if (cancelled) return;
          if (gen !== communityAuthMeGen.current) return;
          const u = normalizeMe(me);
          setUser(u);
          setLoggedIn(u != null);
        })
        .catch((err) => {
          if (cancelled) return;
          if (gen !== communityAuthMeGen.current) return;
          if (typeof window !== "undefined") {
            console.error("CommunityAuthProvider getMe:", err);
          }
          setUser(null);
          setLoggedIn(false);
        })
        .finally(() => {
          if (cancelled) return;
          if (gen !== communityAuthMeGen.current) return;
          setLoading(false);
        });
    };
    const onAuthChange = () => {
      clearGetMeCache();
      run();
    };
    const id = requestAnimationFrame(() => {
      if (!cancelled) run();
    });
    if (typeof window !== "undefined") {
      window.addEventListener("traveltrust:auth-change", onAuthChange);
    }
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
      if (typeof window !== "undefined") {
        window.removeEventListener("traveltrust:auth-change", onAuthChange);
      }
    };
  }, []);

  return (
    <CommunityAuthContext.Provider value={{ isLoggedIn, isLoading, user }}>
      {children}
    </CommunityAuthContext.Provider>
  );
}
