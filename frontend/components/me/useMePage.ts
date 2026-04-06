"use client";

import { useEffect, useLayoutEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import {
  getMe,
  clearGetMeCache,
  putMe,
  postLogout,
  applyLocalLogoutAfterServerOk,
  getMeStats,
} from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import type { UserShape } from "./constants";

export function useMePage(t: (k: string) => string) {
  const router = useRouter();
  const pathname = usePathname();
  const { address: connectedAddress } = useAccount();
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ nickname: "", avatar_url: "", default_wallet_address: "" });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [syncingWallet, setSyncingWallet] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [copiedField, setCopiedField] = useState<"id" | "wallet" | null>(null);
  const [copyClipboardBusy, setCopyClipboardBusy] = useState<"id" | "wallet" | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const statsFetchGen = useRef(0);
  const meFetchGen = useRef(0);

  const copyToClipboard = useCallback(async (text: string, field: "id" | "wallet") => {
    if (!text.trim()) return;
    setCopyClipboardBusy(field);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("useMePage copyToClipboard:", err);
      }
    } finally {
      setCopyClipboardBusy(null);
    }
  }, []);

  const loadStats = useCallback(() => {
    const gen = ++statsFetchGen.current;
    setStatsError(false);
    setStatsLoading(true);
    setStats(null);
    getMeStats()
      .then((r) => {
        if (gen !== statsFetchGen.current) return;
        /** 成功响应但缺 stats 时归一为 {}，避免 stats=null + statsLoading=false 与「已加载完成」混淆 */
        const next =
          r.stats && typeof r.stats === "object" && !Array.isArray(r.stats)
            ? r.stats
            : {};
        setStats(next);
        setStatsError(false);
      })
      .catch((err) => {
        if (gen !== statsFetchGen.current) return;
        if (typeof window !== "undefined") {
          console.error("useMePage getMeStats failed:", err);
        }
        setStatsError(true);
      })
      .finally(() => {
        if (gen !== statsFetchGen.current) return;
        setStatsLoading(false);
      });
  }, []);

  const loadMe = useCallback((opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    const gen = ++meFetchGen.current;
    if (!silent) setLoading(true);
    setError(null);
    getMe()
      .then((res) => {
        if (gen !== meFetchGen.current) return;
        if (res == null) {
          const returnUrl = pathname && pathname !== "/" ? pathname : "/me";
          router.replace(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
          return;
        }
        setData(res);
        const u = (res as { user?: UserShape })?.user;
        if (u) {
          setEditForm({
            nickname: u.nickname ?? "",
            avatar_url: u.avatar_url ?? "",
            default_wallet_address: u.default_wallet_address ?? "",
          });
          setAvatarError(false);
        }
      })
      .catch((err) => {
        if (gen !== meFetchGen.current) return;
        if (err instanceof Error && err.message === "login_required") {
          const returnUrl = pathname && pathname !== "/" ? pathname : "/me";
          router.replace(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
          return;
        }
        if (typeof window !== "undefined") {
          console.error("useMePage loadMe:", err);
        }
        setError(mapApiReadError(err, t, "me_requestFailed"));
      })
      .finally(() => {
        if (gen !== meFetchGen.current) return;
        if (!silent) setLoading(false);
      });
  }, [pathname, router, t]);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  useEffect(() => {
    const onAuthChange = () => {
      clearGetMeCache();
      loadMe();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("traveltrust:auth-change", onAuthChange);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("traveltrust:auth-change", onAuthChange);
      }
    };
  }, [loadMe]);

  const userId = (data as { user?: UserShape })?.user?.id;
  /** 须在绘制前拉起 stats 请求态，避免首帧 stats=null + statsLoading=false 被误判为「空数据 / 全 0」。 */
  useLayoutEffect(() => {
    if (!userId) return;
    loadStats();
  }, [userId, loadStats]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    putMe({
      nickname: editForm.nickname || undefined,
      avatar_url: editForm.avatar_url || undefined,
      default_wallet_address: editForm.default_wallet_address || undefined,
    })
      .then(() => {
        setEditing(false);
        loadMe({ silent: true });
        if (typeof window !== "undefined") window.dispatchEvent(new Event("traveltrust:profile-updated"));
        setTimeout(() => editButtonRef.current?.focus({ preventScroll: true }), 0);
      })
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("useMePage putMe:", err);
        }
        setSubmitError(mapApiReadError(err, t, "me_saveFail"));
      })
      .finally(() => setSubmitting(false));
  }, [editForm, loadMe, t]);

  const handleSyncWallet = useCallback(() => {
    if (!connectedAddress) return;
    setSubmitError(null);
    setSyncingWallet(true);
    putMe({ default_wallet_address: connectedAddress })
      .then(() => {
        loadMe({ silent: true });
        if (typeof window !== "undefined") window.dispatchEvent(new Event("traveltrust:profile-updated"));
      })
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("useMePage putMe sync wallet:", err);
        }
        setSubmitError(mapApiReadError(err, t, "me_syncFail"));
      })
      .finally(() => setSyncingWallet(false));
  }, [connectedAddress, loadMe, t]);

  const handleLogout = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!window.confirm(t("me_logout_confirm"))) return;
    postLogout()
      .then(() => {
        applyLocalLogoutAfterServerOk();
        window.location.href = "/auth/login";
      })
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("useMePage postLogout:", err);
        }
      });
  }, [t]);

  return {
    data,
    error,
    loading,
    editing,
    setEditing,
    editForm,
    setEditForm,
    submitError,
    submitting,
    stats,
    syncingWallet,
    avatarError,
    setAvatarError,
    copiedField,
    copyClipboardBusy,
    statsLoading,
    statsError,
    editButtonRef,
    connectedAddress,
    copyToClipboard,
    loadStats,
    loadMe,
    handleSubmit,
    handleSyncWallet,
    handleLogout,
  };
}
