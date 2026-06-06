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



import { fetchAdminQueueList } from "@/lib/admin/fetchAdminQueueList";

import { runAdminQueueFetchesInSeries } from "@/lib/admin/runAdminQueueFetchesInSeries";
import { scheduleAdminDeferredShellWork } from "@/lib/admin/adminDeferredShellWork";

import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { routes } from "@/lib/api/routes";



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

};



const EMPTY: AdminHomeKpiCounts = { orders: null, disputes: null };



type KpiChannelResult = {

  count: number | null;

  errorKind: import("@/lib/adminFetchDisplay").AdminFetchErrorKind | null;

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

    return { count: null, errorKind: null, skipped: true };

  }

  if (!allowed) {

    return { count: null, errorKind: null, permissionDenied: true, skipped: true };

  }

  const res = await fetchAdminQueueList<{ items?: unknown[] }>(context, url);

  const count =

    res.errorKind === null && Array.isArray(res.items) ? res.items.length : null;

  return {
    count,
    errorKind: res.errorKind,
    rateLimited: res.rateLimited,
    permissionDenied: false,
  };

}



const AdminHomeKpiContext = createContext<AdminHomeKpiValue | null>(null);



export function useAdminHomeKpiInternal(options?: { fetchEnabled?: boolean }): AdminHomeKpiValue {

  const fetchEnabled = options?.fetchEnabled ?? true;

  const caps = useAdminCapabilities();

  const [counts, setCounts] = useState<AdminHomeKpiCounts>(EMPTY);

  const [ordersDenied, setOrdersDenied] = useState(false);

  const [loading, setLoading] = useState(fetchEnabled);

  const [error, setError] = useState(false);

  const rateLimitUntilRef = useRef(0);

  const loadInFlightRef = useRef(false);



  const load = useCallback(() => {

    if (!fetchEnabled) return;

    if (!caps.permissionsLoaded) {

      setLoading(true);

      return;

    }

    if (Date.now() < rateLimitUntilRef.current) {

      return;

    }

    if (loadInFlightRef.current) {

      return;

    }



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

      });

  }, [caps.hasPermission, caps.permissionsLoaded, fetchEnabled]);



  useEffect(() => {

    if (!fetchEnabled) return;

    return scheduleAdminDeferredShellWork(load, { timeoutMs: 1200 });

  }, [load, fetchEnabled]);



  return {

    counts,

    loading: loading || !caps.permissionsLoaded,

    error,

    reload: load,

    ordersPermissionDenied: ordersDenied,

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

