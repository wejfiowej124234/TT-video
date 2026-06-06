"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMe, clearGetMeCache } from "@/lib/apiClient";
import { headerSessionUserFromMe } from "@/components/header/headerSession";

export function useHeaderUserMenuMeSync(initialUser: {
  id: string;
  nickname?: string | null;
  avatar_url?: string | null;
}) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => initialUser.avatar_url?.trim() || null);
  const [avatarError, setAvatarError] = useState(false);
  const [nickname, setNickname] = useState<string | null>(() => initialUser.nickname?.trim() || null);
  /** 96-17：用于四脊签 `aria-label`/`title`；与 `getMe` 原始 envelope 同源（非仅 `headerSessionUserFromMe` 裁剪体）。 */
  const [mePayload, setMePayload] = useState<unknown | null>(null);
  const userMenuMeGen = useRef(0);

  useEffect(() => {
    setAvatarUrl(initialUser.avatar_url?.trim() || null);
    setNickname(initialUser.nickname?.trim() || null);
    setAvatarError(false);
  }, [initialUser.id, initialUser.nickname, initialUser.avatar_url]);

  const loadUser = useCallback(() => {
    const gen = ++userMenuMeGen.current;
    getMe()
      .then((res) => {
        if (gen !== userMenuMeGen.current) return;
        setMePayload(res ?? null);
        const u = headerSessionUserFromMe(res);
        if (!u) {
          setAvatarUrl(null);
          setNickname(null);
          setAvatarError(false);
          return;
        }
        setAvatarUrl(u.avatar_url?.trim() || null);
        setNickname(u.nickname?.trim() || null);
        setAvatarError(false);
      })
      .catch((err) => {
        if (gen !== userMenuMeGen.current) return;
        if (typeof window !== "undefined") {
          console.error("Header UserMenu getMe:", err);
        }
        setMePayload(null);
        setAvatarUrl(null);
        setNickname(null);
      });
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);
  useEffect(() => {
    const onAuthChange = () => loadUser();
    window.addEventListener("traveltrust:auth-change", onAuthChange);
    return () => window.removeEventListener("traveltrust:auth-change", onAuthChange);
  }, [loadUser]);
  useEffect(() => {
    const onProfileUpdated = () => {
      clearGetMeCache();
      loadUser();
    };
    window.addEventListener("traveltrust:profile-updated", onProfileUpdated);
    return () => window.removeEventListener("traveltrust:profile-updated", onProfileUpdated);
  }, [loadUser]);

  return {
    mePayload,
    avatarUrl,
    setAvatarError,
    avatarError,
    nickname,
  };
}
