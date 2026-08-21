"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { ADMIN_AUTH_SESSION_RESET_EVENT } from "@/lib/admin/adminAuthSessionReset";
import { ADMIN_DATA_MUTATED_EVENT } from "@/lib/admin/adminPostWriteCacheInvalidation";
import { scheduleAdminDeferredShellWork } from "@/lib/admin/adminDeferredShellWork";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { fetchAdminQueueList } from "@/lib/admin/fetchAdminQueueList";
import { mergeOpsKpiSources } from "@/lib/admin/opsWorkbenchL5";
import { runAdminQueueFetchesInSeries } from "@/lib/admin/runAdminQueueFetchesInSeries";
import { useAdminHomeSoftRevalidate } from "@/lib/admin/useAdminHomeSoftRevalidate";
import { routes } from "@/lib/api/routes";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";

import { useAdminCapabilities } from "./useAdminCapabilities";

export type AdminHomeKpiCounts = {
  orders: number | null;
  disputes: number | null;
};

export type AdminHomeKpiValue = {
  counts: AdminHomeKpiCounts;
  loading: boolean;
  error: boolean;
  reload: () => void;
  ordersPermissionDenied: boolean;
  /** Merged list meta.source for ops lamp (postgres / memory / unknown). */
  kpiSource: string | null;
};

const EMPTY: AdminHomeKpiCounts = { orders: null, disputes: null };

type KpiChannelResult = {
  count: number | null;
  source: string | null;
  errorKind: AdminFetchErrorKind | null;
  rateLimited?: boolean;
  permissionDenied?: boolean;
  skipped?: boolean;
};

async function fetchKpiChannel(
  context: string,
  url: string,
  allowed: boolean,
  permissionsLoaded: boolean,
): Promise<KpiChannelResult> {
  if (!permissionsLoaded) {
    return { count: null, source: null, errorKind: null, skipped: true };
  }
  if (!allowed) {
    return { count: null, source: null, errorKind: null, permissionDenied: true, skipped: true };
  }

  const res = await fetchAdminQueueList<{ items?: unknown[] }>(context, url);
  if (res.errorKind) {
    return {
      count: null,
      source: res.source,
      errorKind: res.errorKind,
      rateLimited: res.rateLimited,
      permissionDenied: false,
    };
  }
  const count =
    typeof res.total === "number" && Number.isFinite(res.total) && res.total >= 0
      ? Math.floor(res.total)
      : Array.isArray(res.items)
        ? res.items.length
        : 0;
  return { count, source: res.source, errorKind: null, rateLimited: res.rateLimited };
}

const AdminHomeKpiContext = createContext<AdminHomeKpiValue | null>(null);

export function useAdminHomeKpiInternal(options?: { fetchEnabled?: boolean }): AdminHomeKpiValue {
  const fetchEnabled = options?.fetchEnabled ?? true;
  const caps = useAdminCapabilities();
  const [counts, setCounts] = useState<AdminHomeKpiCounts>(EMPTY);
  const [kpiSource, setKpiSource] = useState<string | null>(null);
  const [ordersDenied, setOrdersDenied] = useState(false);
  const [loading, setLoading] = useState(fetchEnabled);
  const [error, setError] = useState(false);
  const rateLimitUntilRef = useRef(0);
  const loadInFlightRef = useRef(false);
  const loadRef = useRef<() => void>(() => {});

  // HU-463 · tab visible → soft reload
  const { markFetched } = useAdminHomeSoftRevalidate(() => loadRef.current(), fetchEnabled);

  const load = useCallback(() => {
    if (!fetchEnabled) return;
    if (!caps.permissionsLoaded) {
      setLoading(true);
      return;
    }
    if (Date.now() < rateLimitUntilRef.current) return;
    if (loadInFlightRef.current) return;

    loadInFlightRef.current = true;
    setLoading(true);
    setError(false);

    const canOrders = caps.hasPermission(ADMIN_PERM.ORDERS_READ);

    void runAdminQueueFetchesInSeries([
      () =>
        fetchKpiChannel(
          "AdminHomeKpi.orders",
          `${routes.admin.orders({ limit: 200 })}`,
          canOrders,
          caps.permissionsLoaded,
        ),
      () =>
        fetchKpiChannel(
          "AdminHomeKpi.disputes",
          `${routes.admin.disputes({ limit: 200 })}`,
          canOrders,
          caps.permissionsLoaded,
        ),
    ])
      .then(([ordersRes, disputesRes]) => {
        setOrdersDenied(Boolean(ordersRes.permissionDenied || disputesRes.permissionDenied));
        setCounts({
          orders: ordersRes.permissionDenied ? null : ordersRes.count,
          disputes: disputesRes.permissionDenied ? null : disputesRes.count,
        });
        setKpiSource(mergeOpsKpiSources(ordersRes.source, disputesRes.source));
        const results = [ordersRes, disputesRes];
        if (results.some((r) => r.rateLimited)) {
          rateLimitUntilRef.current = Date.now() + 60_000;
        }
        const anyErr = results.some((r) => r.errorKind !== null && !r.permissionDenied);
        setError(anyErr);
      })
      .finally(() => {
        loadInFlightRef.current = false;
        setLoading(false);
        markFetched();
      });
  }, [caps.hasPermission, caps.permissionsLoaded, fetchEnabled, markFetched]);

  loadRef.current = load;

  useEffect(() => {
    if (!fetchEnabled) return;
    return scheduleAdminDeferredShellWork(load, { timeoutMs: 1200 });
  }, [load, fetchEnabled]);

  useEffect(() => {
    if (!fetchEnabled) return;
    const onRefresh = () => {
      setCounts(EMPTY);
      setKpiSource(null);
      load();
    };
    window.addEventListener(ADMIN_AUTH_SESSION_RESET_EVENT, onRefresh);
    window.addEventListener(ADMIN_DATA_MUTATED_EVENT, onRefresh);
    return () => {
      window.removeEventListener(ADMIN_AUTH_SESSION_RESET_EVENT, onRefresh);
      window.removeEventListener(ADMIN_DATA_MUTATED_EVENT, onRefresh);
    };
  }, [fetchEnabled, load]);

  return {
    counts,
    loading: loading || !caps.permissionsLoaded,
    error,
    reload: load,
    ordersPermissionDenied: ordersDenied,
    kpiSource,
  };
}

export function AdminHomeKpiProvider({ children }: { children: ReactNode }) {
  const value = useAdminHomeKpiInternal();
  return createElement(AdminHomeKpiContext.Provider, { value }, children);
}

export function useAdminHomeKpi(): AdminHomeKpiValue {
  const ctx = useContext(AdminHomeKpiContext);
  const fallback = useAdminHomeKpiInternal({ fetchEnabled: !ctx });
  return ctx ?? fallback;
}
