"use client";

import { usePathname } from "next/navigation";

import { adminHomeInboxPendingTotal } from "@/lib/admin/adminHomeInboxPendingTotal";
import {
  adminHomeInboxFocusLayoutActive,
  adminHomeSecondaryWidgetsCollapsed,
} from "@/lib/admin/adminShellUxPolicy";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { useAdminHomeInbox } from "@/lib/admin/useAdminHomeInbox";

/** ① `/admin` 工作台 · Inbox Focus Product Baseline（恒开；与 `AdminHomeClient` 同源）。 */
export function adminHomeInboxFocusOnPath(
  pathname: string,
  pendingTotal: number | null,
): boolean {
  const onWorkspace = pathname === "/admin" || pathname === "/admin/";
  return onWorkspace && adminHomeSecondaryWidgetsCollapsed(pendingTotal);
}

export function useAdminHomeInboxFocusMode(): boolean {
  const pathname = usePathname() ?? "";
  const inbox = useAdminHomeInbox();
  const caps = useAdminCapabilities();

  const onWorkspace = pathname === "/admin" || pathname === "/admin/";
  if (!onWorkspace) return false;

  const pendingTotal = adminHomeInboxPendingTotal(
    inbox.counts,
    inbox.channels,
    inbox.loading,
    inbox.error,
    caps.hasPermission,
    caps.permissionsLoaded,
  );
  return adminHomeInboxFocusLayoutActive({
    pendingTotal,
    inboxLoading: inbox.loading,
    permissionsLoaded: caps.permissionsLoaded,
    inboxError: inbox.error,
  });
}
