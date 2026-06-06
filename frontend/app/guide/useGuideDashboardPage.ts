// search-params gate: parent route provides Suspense boundary.
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { getMeFull } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import type { UserShape } from "@/components/me/constants";

export type GuideDashboardPageViewModel = {
  t: ReturnType<typeof useTranslation>["t"];
  loading: boolean;
  error: string | null;
  user: UserShape | null;
  mePayload: unknown;
  stats: Record<string, unknown> | null;
  statsLoading: boolean;
  statsError: boolean;
  loadMe: (opts?: { silent?: boolean; force?: boolean }) => void;
  retryStatsCards: () => void;
};

export function useGuideDashboardPage(): GuideDashboardPageViewModel {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const guideLoginReturnPath = useMemo(() => {
    const base = pathname && pathname !== "/" ? pathname : "/guide";
    const q = searchParams?.toString() ?? "";
    return q ? `${base}?${q}` : base;
  }, [pathname, searchParams]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserShape | null>(null);
  const [mePayload, setMePayload] = useState<unknown>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(false);
  const guideMeFetchGen = useRef(0);

  const applyStatsFromPayload = useCallback((res: unknown) => {
    const st = (res as { stats?: unknown } | null)?.stats;
    if (st && typeof st === "object" && !Array.isArray(st)) {
      setStats(st as Record<string, unknown>);
      setStatsError(false);
    } else if (res != null) {
      setStats({});
    }
  }, []);

  const loadMe = useCallback(
    (opts?: { silent?: boolean; force?: boolean }) => {
      const silent = opts?.silent === true;
      const force = opts?.force === true;
      const gen = ++guideMeFetchGen.current;
      if (!silent) {
        setLoading(true);
        setError(null);
      } else {
        setStatsLoading(true);
        setStatsError(false);
      }
      getMeFull({ force })
        .then((res) => {
          if (gen !== guideMeFetchGen.current) return;
          if (res == null) {
            if (!silent) {
              router.replace(`/auth/login?returnUrl=${encodeURIComponent(guideLoginReturnPath)}`);
            } else {
              setStatsError(true);
            }
            return;
          }
          setMePayload(res);
          const u = (res as { user?: UserShape })?.user;
          setUser(u ?? null);
          applyStatsFromPayload(res);
        })
        .catch((err) => {
          if (gen !== guideMeFetchGen.current) return;
          if (err instanceof Error && err.message === "login_required") {
            router.replace(`/auth/login?returnUrl=${encodeURIComponent(guideLoginReturnPath)}`);
            return;
          }
          if (typeof window !== "undefined") {
            console.error("GuideDashboard getMeFull:", err);
          }
          if (silent) {
            setStatsError(true);
          } else {
            setError(mapApiReadError(err, t, "guide_dashboard_load_fail"));
          }
        })
        .finally(() => {
          if (gen !== guideMeFetchGen.current) return;
          if (!silent) setLoading(false);
          else setStatsLoading(false);
        });
    },
    [applyStatsFromPayload, guideLoginReturnPath, router, t]
  );

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const retryStatsCards = useCallback(() => {
    void loadMe({ silent: true, force: true });
  }, [loadMe]);

  return {
    t,
    loading,
    error,
    user,
    mePayload,
    stats,
    statsLoading,
    statsError,
    loadMe,
    retryStatsCards,
  };
}
