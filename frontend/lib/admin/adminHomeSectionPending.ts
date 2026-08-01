import type { AdminHomeInboxChannels, AdminHomeInboxCounts } from "@/lib/admin/useAdminHomeInbox";

import type { AdminHomeKpiCounts } from "@/lib/admin/useAdminHomeKpi";

import type { AdminHomeSectionId } from "@/lib/admin/adminHomeModel";

import { canAccessAdminInboxChannel } from "@/lib/admin/adminInboxChannelPermission";



export function onboardingSectionPending(

  counts: AdminHomeInboxCounts,

  channels: AdminHomeInboxChannels,

  loading: boolean,

  hasPermission: (perm: string) => boolean,

  permissionsLoaded: boolean,

): number | null {

  if (loading || !permissionsLoaded) return null;

  return (["provider", "guide", "steward", "approvals"] as const).reduce((sum, key) => {

    if (!canAccessAdminInboxChannel(key, hasPermission, permissionsLoaded)) return sum;

    if (channels[key]?.permissionDenied) return sum;

    return sum + (counts[key] ?? 0);

  }, 0);

}



export function communitySectionPending(

  counts: AdminHomeInboxCounts,

  channels: AdminHomeInboxChannels,

  loading: boolean,

  hasPermission: (perm: string) => boolean,

  permissionsLoaded: boolean,

): number | null {

  if (loading || !permissionsLoaded) return null;

  if (!canAccessAdminInboxChannel("reports", hasPermission, permissionsLoaded)) return 0;

  if (channels.reports?.permissionDenied) return 0;

  return counts.reports ?? 0;

}



export function sectionPendingCount(

  sectionId: AdminHomeSectionId,

  counts: AdminHomeInboxCounts,

  channels: AdminHomeInboxChannels,

  _kpi: AdminHomeKpiCounts,

  _kpiLoading: boolean,

  inboxLoading: boolean,

  hasPermission: (perm: string) => boolean,

  permissionsLoaded: boolean,

): number | null {

  if (sectionId === "onboarding") {

    return onboardingSectionPending(counts, channels, inboxLoading, hasPermission, permissionsLoaded);

  }

  if (sectionId === "community") {

    return communitySectionPending(counts, channels, inboxLoading, hasPermission, permissionsLoaded);

  }

  return 0;

}



export function sectionDefaultOpenByPending(pending: number | null): boolean {

  return pending !== null && pending > 0;

}


