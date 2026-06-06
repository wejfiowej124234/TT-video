"use client";



import { useCallback, useEffect, useRef, useState } from "react";



import {

  readAdminHomeOverviewCache,

  writeAdminHomeOverviewCache,

  type AdminHomeOverviewCacheSnapshot,

} from "@/lib/admin/adminHomeOverviewFetchCache";

import {

  ADMIN_HOME_SYSTEM_OVERVIEW_USER_LIMIT,

  computeAdminHomeUserSnapshot,

  parseAdminHomeMetricsOverview,

  parseAdminHomeObservabilityLite,

  userSnapshotFromMetrics,

  type AdminHomeMetricsOverview,

  type AdminHomeObservabilityLite,

  type AdminHomeUserListItem,

  type AdminHomeUserSnapshot,

} from "@/lib/admin/adminHomeSystemOverviewMetrics";

import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { fetchAdminQueueList } from "@/lib/admin/fetchAdminQueueList";

import { adminFetchJson, logAdminFetch } from "@/lib/adminFetchDisplay";

import { apiUrl, routes } from "@/lib/api";

import { getAuthHeaders } from "@/lib/apiClient";

import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";



export type AdminHomeSystemOverviewValue = {

  metrics: AdminHomeMetricsOverview | null;

  metricsLoading: boolean;

  metricsDenied: boolean;

  metricsError: boolean;

  users: AdminHomeUserSnapshot | null;

  usersLoading: boolean;

  usersDenied: boolean;

  usersError: boolean;

  observability: AdminHomeObservabilityLite | null;

  observabilityLoading: boolean;

  observabilityDenied: boolean;

  observabilityError: boolean;

  reload: () => void;

};



const EMPTY_OBS: AdminHomeObservabilityLite = {

  chainId: null,

  indexerLagBlocks: null,

  alertsActive: null,

};



function applyOverviewCache(

  snapshot: AdminHomeOverviewCacheSnapshot,

  setters: {

    setMetrics: (v: AdminHomeMetricsOverview | null) => void;

    setMetricsDenied: (v: boolean) => void;

    setMetricsError: (v: boolean) => void;

    setUsers: (v: AdminHomeUserSnapshot | null) => void;

    setUsersDenied: (v: boolean) => void;

    setUsersError: (v: boolean) => void;

    setObservability: (v: AdminHomeObservabilityLite | null) => void;

    setObservabilityDenied: (v: boolean) => void;

    setObservabilityError: (v: boolean) => void;

  },

): void {

  setters.setMetrics(snapshot.metrics);

  setters.setMetricsDenied(snapshot.metricsDenied);

  setters.setMetricsError(snapshot.metricsError);

  setters.setUsers(snapshot.users);

  setters.setUsersDenied(snapshot.usersDenied);

  setters.setUsersError(snapshot.usersError);

  setters.setObservability(snapshot.observability);

  setters.setObservabilityDenied(snapshot.observabilityDenied);

  setters.setObservabilityError(snapshot.observabilityError);

}



async function fetchMetricsOverview(): Promise<{

  parsed: AdminHomeMetricsOverview | null;

  denied: boolean;

  error: boolean;

}> {

  const headers: Record<string, string> = {

    "x-request-id": `admin-home-metrics-${Date.now()}`,

  };

  try {

    Object.assign(headers, getAuthHeaders());

  } catch {

    return { parsed: null, denied: true, error: false };

  }

  try {

    const { res, body } = await adminFetchJson<unknown>(

      "AdminHomeSystemOverview.metrics",

      apiUrl(routes.admin.metricsHomeOverview),

      { headers },

    );

    if (res.status === 401 || res.status === 403) {

      return { parsed: null, denied: true, error: false };

    }

    if (res.status === 404) {

      return { parsed: null, denied: false, error: false };

    }

    if (!res.ok) {

      return { parsed: null, denied: false, error: true };

    }

    const parsed = parseAdminHomeMetricsOverview(body);

    if (!parsed) {

      return { parsed: null, denied: false, error: true };

    }

    return { parsed, denied: false, error: false };

  } catch (e) {

    logAdminFetch("AdminHomeSystemOverview.metrics", e);

    return { parsed: null, denied: false, error: true };

  }

}



async function fetchUsersFallback(): Promise<{

  snapshot: AdminHomeUserSnapshot | null;

  denied: boolean;

  error: boolean;

}> {

  const res = await fetchAdminQueueList<{ items?: AdminHomeUserListItem[] }>(

    "AdminHomeSystemOverview.users",

    routes.admin.users({ limit: ADMIN_HOME_SYSTEM_OVERVIEW_USER_LIMIT }),

  );

  if (res.errorKind === "forbidden" || res.errorKind === "admin_permission_denied") {

    return { snapshot: null, denied: true, error: false };

  }

  if (res.errorKind !== null) {

    return { snapshot: null, denied: false, error: true };

  }

  const items = Array.isArray(res.items) ? res.items : [];

  return {

    snapshot: computeAdminHomeUserSnapshot(items, ADMIN_HOME_SYSTEM_OVERVIEW_USER_LIMIT),

    denied: false,

    error: false,

  };

}



export function useAdminHomeSystemOverview(): AdminHomeSystemOverviewValue {

  const caps = useAdminCapabilities();

  const warm = readAdminHomeOverviewCache();

  const [metrics, setMetrics] = useState<AdminHomeMetricsOverview | null>(warm?.metrics ?? null);

  const [metricsLoading, setMetricsLoading] = useState(warm == null);

  const [metricsDenied, setMetricsDenied] = useState(warm?.metricsDenied ?? false);

  const [metricsError, setMetricsError] = useState(warm?.metricsError ?? false);

  const [users, setUsers] = useState<AdminHomeUserSnapshot | null>(warm?.users ?? null);

  const [usersLoading, setUsersLoading] = useState(warm == null);

  const [usersDenied, setUsersDenied] = useState(warm?.usersDenied ?? false);

  const [usersError, setUsersError] = useState(warm?.usersError ?? false);

  const [observability, setObservability] = useState<AdminHomeObservabilityLite | null>(

    warm?.observability ?? null,

  );

  const [observabilityLoading, setObservabilityLoading] = useState(warm == null);

  const [observabilityDenied, setObservabilityDenied] = useState(warm?.observabilityDenied ?? false);

  const [observabilityError, setObservabilityError] = useState(warm?.observabilityError ?? false);

  const loadInFlightRef = useRef(false);



  const load = useCallback(() => {

    if (!caps.permissionsLoaded) {

      setMetricsLoading(true);

      setUsersLoading(true);

      setObservabilityLoading(true);

      return;

    }

    if (loadInFlightRef.current) return;

    loadInFlightRef.current = true;



    const cached = readAdminHomeOverviewCache();

    if (cached) {

      applyOverviewCache(cached, {

        setMetrics,

        setMetricsDenied,

        setMetricsError,

        setUsers,

        setUsersDenied,

        setUsersError,

        setObservability,

        setObservabilityDenied,

        setObservabilityError,

      });

      setMetricsLoading(false);

      setUsersLoading(false);

      setObservabilityLoading(false);

    } else {

      setMetricsLoading(true);

      setUsersLoading(true);

      setObservabilityLoading(true);

    }

    setMetricsError(false);

    setUsersError(false);

    setObservabilityError(false);



    const canRead = caps.hasPermission(ADMIN_PERM.READ);

    const canUsers = caps.hasPermission(ADMIN_PERM.USERS_READ);



    const snapshot: AdminHomeOverviewCacheSnapshot = {

      metrics: null,

      metricsDenied: false,

      metricsError: false,

      users: null,

      usersDenied: false,

      usersError: false,

      observability: null,

      observabilityDenied: false,

      observabilityError: false,

    };



    const metricsPromise = canRead

      ? fetchMetricsOverview().then((result) => {

          snapshot.metrics = result.parsed;

          snapshot.metricsDenied = result.denied;

          snapshot.metricsError = result.error;

          setMetricsDenied(result.denied);

          setMetricsError(result.error);

          setMetrics(result.parsed);

          if (result.parsed) {

            snapshot.users = userSnapshotFromMetrics(result.parsed);

            snapshot.usersDenied = false;

            snapshot.usersError = false;

            setUsers(snapshot.users);

            setUsersDenied(false);

            setUsersError(false);

          }

          return result.parsed;

        })

      : Promise.resolve(null).then(() => {

          snapshot.metricsDenied = true;

          setMetricsDenied(true);

          setMetrics(null);

          return null;

        });



    const usersPromise = metricsPromise.then((parsed) => {

      if (parsed || !canUsers) {

        if (!parsed && !canUsers) {

          snapshot.usersDenied = true;

          setUsersDenied(true);

          setUsers(null);

        }

        return;

      }

      return fetchUsersFallback().then((result) => {

        snapshot.users = result.snapshot;

        snapshot.usersDenied = result.denied;

        snapshot.usersError = result.error;

        setUsersDenied(result.denied);

        setUsersError(result.error);

        setUsers(result.snapshot);

      });

    });



    const obsPromise = canRead

      ? (async () => {

          const headers: Record<string, string> = {

            "x-request-id": `admin-home-obs-${Date.now()}`,

          };

          try {

            Object.assign(headers, getAuthHeaders());

          } catch {

            snapshot.observabilityDenied = true;

            setObservabilityDenied(true);

            setObservability(null);

            return;

          }

          try {

            const { res, body } = await adminFetchJson<unknown>(

              "AdminHomeSystemOverview.observability",

              apiUrl(routes.admin.observabilityOverview),

              { headers },

            );

            if (res.status === 401 || res.status === 403) {

              snapshot.observabilityDenied = true;

              setObservabilityDenied(true);

              setObservability(null);

              return;

            }

            if (!res.ok) {

              snapshot.observabilityError = true;

              setObservabilityError(true);

              setObservability(null);

              return;

            }

            snapshot.observabilityDenied = false;

            snapshot.observabilityError = false;

            snapshot.observability = parseAdminHomeObservabilityLite(body);

            setObservabilityDenied(false);

            setObservability(snapshot.observability);

          } catch (e) {

            logAdminFetch("AdminHomeSystemOverview.observability", e);

            snapshot.observabilityError = true;

            setObservabilityError(true);

            setObservability(null);

          }

        })()

      : Promise.resolve().then(() => {

          snapshot.observabilityDenied = true;

          setObservabilityDenied(true);

          setObservability(null);

        });



    void Promise.all([usersPromise, obsPromise]).finally(() => {

      loadInFlightRef.current = false;

      setMetricsLoading(false);

      setUsersLoading(false);

      setObservabilityLoading(false);

      writeAdminHomeOverviewCache(snapshot);

    });

  }, [caps.hasPermission, caps.permissionsLoaded]);



  useEffect(() => {

    load();

  }, [load]);



  return {

    metrics,

    metricsLoading: metricsLoading || !caps.permissionsLoaded,

    metricsDenied,

    metricsError,

    users,

    usersLoading: usersLoading || !caps.permissionsLoaded,

    usersDenied,

    usersError,

    observability: observability ?? EMPTY_OBS,

    observabilityLoading: observabilityLoading || !caps.permissionsLoaded,

    observabilityDenied,

    observabilityError,

    reload: load,

  };

}

