"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchAdminQueueList } from "@/lib/admin/fetchAdminQueueList";
import { routes } from "@/lib/api";
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

const EMPTY_COUNTS: AdminHomeInboxCounts = {
  provider: null,
  steward: null,
  approvals: null,
  reports: null,
};

const EMPTY_CHANNELS: AdminHomeInboxChannels = {
  provider: { count: null, errorKind: null },
  steward: { count: null, errorKind: null },
  approvals: { count: null, errorKind: null },
  reports: { count: null, errorKind: null },
};

function countFromItems(items: unknown[] | undefined, errorKind: AdminFetchErrorKind | null): number | null {
  if (errorKind) return null;
  return Array.isArray(items) ? items.length : 0;
}

type QueueFetchResult = {
  items?: unknown[];
  errorKind: AdminFetchErrorKind | null;
  permissionDenied?: boolean;
  skipped?: boolean;
};

async function fetchInboxChannel(
  context: string,
  url: string,
  allowed: boolean,
  permissionsLoaded: boolean,
): Promise<QueueFetchResult> {
  if (!permissionsLoaded) {
    return { errorKind: null, skipped: true };
  }
  if (!allowed) {
    return { errorKind: null, permissionDenied: true, skipped: true };
  }
  const res = await fetchAdminQueueList<{ items?: unknown[] }>(context, url);
  return { items: res.items, errorKind: res.errorKind };
}

export function useAdminHomeInbox() {
  const caps = useAdminCapabilities();
  const [counts, setCounts] = useState<AdminHomeInboxCounts>(EMPTY_COUNTS);
  const [channels, setChannels] = useState<AdminHomeInboxChannels>(EMPTY_CHANNELS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    if (!caps.permissionsLoaded) {
      setLoading(true);
      return;
    }

    setLoading(true);
    setError(false);

    const can = (key: AdminHomeInboxKey) =>
      canAccessAdminInboxChannel(key, caps.hasPermission, caps.permissionsLoaded);

    void Promise.all([
      fetchInboxChannel(
        "AdminHomeInbox.provider",
        `${routes.adminProviderApplications}?status=${encodeURIComponent("submitted")}`,
        can("provider"),
        caps.permissionsLoaded,
      ),
      fetchInboxChannel(
        "AdminHomeInbox.steward",
        `${routes.adminStewardApplications}?status=${encodeURIComponent("stake_pending")}`,
        can("steward"),
        caps.permissionsLoaded,
      ),
      fetchInboxChannel(
        "AdminHomeInbox.approvals",
        routes.admin.approvals({ limit: 200, status: "pending" }),
        can("approvals"),
        caps.permissionsLoaded,
      ),
      fetchInboxChannel(
        "AdminHomeInbox.reports",
        routes.admin.communityReports({ limit: 200, status: "open" }),
        can("reports"),
        caps.permissionsLoaded,
      ),
    ])
      .then(([providerRes, stewardRes, approvalsRes, reportsRes]) => {
        const provider = providerRes.permissionDenied
          ? null
          : countFromItems(providerRes.items, providerRes.errorKind);
        const steward = stewardRes.permissionDenied
          ? null
          : countFromItems(stewardRes.items, stewardRes.errorKind);
        const approvals = approvalsRes.permissionDenied
          ? null
          : countFromItems(approvalsRes.items, approvalsRes.errorKind);
        const reports = reportsRes.permissionDenied
          ? null
          : countFromItems(reportsRes.items, reportsRes.errorKind);

        setCounts({ provider, steward, approvals, reports });
        setChannels({
          provider: {
            count: provider,
            errorKind: providerRes.errorKind,
            permissionDenied: providerRes.permissionDenied,
            skipped: providerRes.skipped,
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
          reports: {
            count: reports,
            errorKind: reportsRes.errorKind,
            permissionDenied: reportsRes.permissionDenied,
            skipped: reportsRes.skipped,
          },
        });

        const anyErr =
          (providerRes.errorKind !== null && !providerRes.permissionDenied) ||
          (stewardRes.errorKind !== null && !stewardRes.permissionDenied) ||
          (approvalsRes.errorKind !== null && !approvalsRes.permissionDenied) ||
          (reportsRes.errorKind !== null && !reportsRes.permissionDenied);
        setError(anyErr);
      })
      .finally(() => setLoading(false));
  }, [caps.hasPermission, caps.permissionsLoaded]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    counts,
    channels,
    loading: loading || !caps.permissionsLoaded,
    error,
    reload: load,
    inboxChannelPermission: adminInboxChannelPermission,
  };
}
