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

import { adminInboxQueueListFetchConfig } from "@/lib/admin/adminHomeInboxQueueListCache";
import {
  ADMIN_AUTH_SESSION_RESET_EVENT,
} from "@/lib/admin/adminAuthSessionReset";
import { ADMIN_DATA_MUTATED_EVENT } from "@/lib/admin/adminPostWriteCacheInvalidation";

import { runAdminQueueFetchesInSeries } from "@/lib/admin/runAdminQueueFetchesInSeries";
import { scheduleAdminDeferredShellWork } from "@/lib/admin/adminDeferredShellWork";

import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";



import {

  adminInboxChannelPermission,

  canAccessAdminInboxChannel,

} from "./adminInboxChannelPermission";

import type { AdminHomeInboxKey } from "./adminHomeModel";

import { useAdminCapabilities } from "./useAdminCapabilities";



export type AdminHomeInboxChannelState = {

  count: number | null;

  errorKind: AdminFetchErrorKind | null;

  /** capabilities 已加载且当前角色无本通道权限 */

  permissionDenied?: boolean;

  /** 无权限时不发起 fetch */

  skipped?: boolean;

};



export type AdminHomeInboxCounts = Record<AdminHomeInboxKey, number | null>;



export type AdminHomeInboxChannels = Record<AdminHomeInboxKey, AdminHomeInboxChannelState>;



export type AdminHomeInboxValue = {

  counts: AdminHomeInboxCounts;

  channels: AdminHomeInboxChannels;

  loading: boolean;

  error: boolean;

  reload: () => void;

  inboxChannelPermission: typeof adminInboxChannelPermission;

};



const EMPTY_COUNTS: AdminHomeInboxCounts = {

  provider: null,

  guide: null,

  steward: null,

  approvals: null,

  disputes: null,

  reports: null,

};



const EMPTY_CHANNELS: AdminHomeInboxChannels = {

  provider: { count: null, errorKind: null },

  guide: { count: null, errorKind: null },

  steward: { count: null, errorKind: null },

  approvals: { count: null, errorKind: null },

  disputes: { count: null, errorKind: null },

  reports: { count: null, errorKind: null },

};



/** Fail-closed: never treat page-sized `items.length` as inventory total. */
function countFromItems(total: number | null | undefined, errorKind: AdminFetchErrorKind | null): number | null {
  if (errorKind) return null;
  if (typeof total === "number" && Number.isFinite(total) && total >= 0) return Math.floor(total);
  return null;
}



type QueueFetchResult = {

  total?: number | null;

  errorKind: AdminFetchErrorKind | null;

  rateLimited?: boolean;

  permissionDenied?: boolean;

  skipped?: boolean;

};



async function fetchInboxChannel(
  key: AdminHomeInboxKey,
  context: string,
  allowed: boolean,
  permissionsLoaded: boolean,
): Promise<QueueFetchResult> {
  if (!permissionsLoaded) {
    return { errorKind: null, skipped: true };
  }
  if (!allowed) {
    return { errorKind: null, permissionDenied: true, skipped: true };
  }

  const { scope, listUrl } = adminInboxQueueListFetchConfig(key);
  const res = await fetchAdminQueueList<{ items?: unknown[] }>(context, listUrl, { scope });
  return { total: res.total, errorKind: res.errorKind, rateLimited: res.rateLimited };
}



const AdminHomeInboxContext = createContext<AdminHomeInboxValue | null>(null);



export function useAdminHomeInboxInternal(options?: { fetchEnabled?: boolean }): AdminHomeInboxValue {

  const fetchEnabled = options?.fetchEnabled ?? true;

  const caps = useAdminCapabilities();

  const [counts, setCounts] = useState<AdminHomeInboxCounts>(EMPTY_COUNTS);

  const [channels, setChannels] = useState<AdminHomeInboxChannels>(EMPTY_CHANNELS);

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



    const can = (key: AdminHomeInboxKey) =>

      canAccessAdminInboxChannel(key, caps.hasPermission, caps.permissionsLoaded);



    void runAdminQueueFetchesInSeries([

      () => fetchInboxChannel("provider", "AdminHomeInbox.provider", can("provider"), caps.permissionsLoaded),

      () => fetchInboxChannel("guide", "AdminHomeInbox.guide", can("guide"), caps.permissionsLoaded),

      () => fetchInboxChannel("steward", "AdminHomeInbox.steward", can("steward"), caps.permissionsLoaded),

      () => fetchInboxChannel("approvals", "AdminHomeInbox.approvals", can("approvals"), caps.permissionsLoaded),

      () => fetchInboxChannel("disputes", "AdminHomeInbox.disputes", can("disputes"), caps.permissionsLoaded),

      () => fetchInboxChannel("reports", "AdminHomeInbox.reports", can("reports"), caps.permissionsLoaded),

    ])

      .then(([providerRes, guideRes, stewardRes, approvalsRes, disputesRes, reportsRes]) => {

        const provider = providerRes.permissionDenied

          ? null

          : countFromItems(providerRes.total, providerRes.errorKind);

        const guide = guideRes.permissionDenied

          ? null

          : countFromItems(guideRes.total, guideRes.errorKind);

        const steward = stewardRes.permissionDenied

          ? null

          : countFromItems(stewardRes.total, stewardRes.errorKind);

        const approvals = approvalsRes.permissionDenied

          ? null

          : countFromItems(approvalsRes.total, approvalsRes.errorKind);

        const disputes = disputesRes.permissionDenied

          ? null

          : countFromItems(disputesRes.total, disputesRes.errorKind);

        const reports = reportsRes.permissionDenied

          ? null

          : countFromItems(reportsRes.total, reportsRes.errorKind);



        setCounts({ provider, guide, steward, approvals, disputes, reports });

        setChannels({

          provider: {

            count: provider,

            errorKind: providerRes.errorKind,

            permissionDenied: providerRes.permissionDenied,

            skipped: providerRes.skipped,

          },

          guide: {

            count: guide,

            errorKind: guideRes.errorKind,

            permissionDenied: guideRes.permissionDenied,

            skipped: guideRes.skipped,

          },

          steward: {

            count: steward,

            errorKind: stewardRes.errorKind,

            permissionDenied: stewardRes.permissionDenied,

            skipped: stewardRes.skipped,

          },

          approvals: {

            count: approvals,

            errorKind: approvalsRes.errorKind,

            permissionDenied: approvalsRes.permissionDenied,

            skipped: approvalsRes.skipped,

          },

          disputes: {

            count: disputes,

            errorKind: disputesRes.errorKind,

            permissionDenied: disputesRes.permissionDenied,

            skipped: disputesRes.skipped,

          },

          reports: {

            count: reports,

            errorKind: reportsRes.errorKind,

            permissionDenied: reportsRes.permissionDenied,

            skipped: reportsRes.skipped,

          },

        });



        const results = [providerRes, guideRes, stewardRes, approvalsRes, disputesRes, reportsRes];

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



  useEffect(() => {

    if (!fetchEnabled) return;

    const onRefresh = () => {

      setCounts(EMPTY_COUNTS);

      setChannels(EMPTY_CHANNELS);

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

    channels,

    loading: loading || !caps.permissionsLoaded,

    error,

    reload: load,

    inboxChannelPermission: adminInboxChannelPermission,

  };

}



export function AdminHomeInboxProvider({ children }: { children: ReactNode }) {

  const value = useAdminHomeInboxInternal();

  return createElement(AdminHomeInboxContext.Provider, { value }, children);

}



export function useAdminHomeInbox(): AdminHomeInboxValue {

  const ctx = useContext(AdminHomeInboxContext);

  const fallback = useAdminHomeInboxInternal({ fetchEnabled: !ctx });

  return ctx ?? fallback;

}

