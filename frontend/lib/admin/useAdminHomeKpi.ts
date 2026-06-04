"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchAdminQueueList } from "@/lib/admin/fetchAdminQueueList";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { routes } from "@/lib/api/routes";

import { useAdminCapabilities } from "./useAdminCapabilities";

export type AdminHomeKpiCounts = {
  orders: number | null;
  disputes: number | null;
};

const EMPTY: AdminHomeKpiCounts = { orders: null, disputes: null };

type KpiChannelResult = {
  count: number | null;
  errorKind: import("@/lib/adminFetchDisplay").AdminFetchErrorKind | null;
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
  return { count, errorKind: res.errorKind, permissionDenied: false };
}

export function useAdminHomeKpi() {
  const caps = useAdminCapabilities();
  const [counts, setCounts] = useState<AdminHomeKpiCounts>(EMPTY);
  const [ordersDenied, setOrdersDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    if (!caps.permissionsLoaded) {
      setLoading(true);
      return;
    }

    setLoading(true);
    setError(false);

    const canOrders = caps.hasPermission(ADMIN_PERM.ORDERS_READ);

    void Promise.all([
      fetchKpiChannel(
        "AdminHomeKpi.orders",
        `${routes.admin.orders({ limit: 200 })}`,
        canOrders,
        caps.permissionsLoaded,
      ),
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
        const anyErr =
          (ordersRes.errorKind !== null && !ordersRes.permissionDenied) ||
          (disputesRes.errorKind !== null && !disputesRes.permissionDenied);
        setError(anyErr);
      })
      .finally(() => setLoading(false));
  }, [caps.hasPermission, caps.permissionsLoaded]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    counts,
    loading: loading || !caps.permissionsLoaded,
    error,
    reload: load,
    ordersPermissionDenied: ordersDenied,
  };
}
