import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";
import { sortAdminUnifiedInboxTasks } from "@/lib/admin/adminInboxWorkflowOrder";

import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";

import type { AdminHomeInboxChannels, AdminHomeInboxCounts } from "@/lib/admin/useAdminHomeInbox";



export type AdminUnifiedInboxTask = {

  id: string;

  labelKey: string;

  descKey: string;

  href: string;

  count: number | null;

  permissionDenied?: boolean;

  errorKind?: AdminFetchErrorKind | null;

  priority: number;

};



export function buildAdminUnifiedInboxTasks(input: {

  counts: AdminHomeInboxCounts;

  channels: AdminHomeInboxChannels;

}): AdminUnifiedInboxTask[] {

  const { counts, channels } = input;



  const tasks: AdminUnifiedInboxTask[] = [

    {

      id: "provider",

      labelKey: "admin_home_inbox_provider",

      descKey: "admin_home_inbox_provider_desc",

      href: ADMIN_INBOX_QUEUE_HREFS.provider,

      count: channels.provider?.permissionDenied ? null : counts.provider,

      permissionDenied: Boolean(channels.provider?.permissionDenied),

      errorKind: channels.provider?.errorKind ?? null,

      priority: counts.provider ?? 0,

    },

    {

      id: "guide",

      labelKey: "admin_home_inbox_guide",

      descKey: "admin_home_inbox_guide_desc",

      href: ADMIN_INBOX_QUEUE_HREFS.guide,

      count: channels.guide?.permissionDenied ? null : counts.guide,

      permissionDenied: Boolean(channels.guide?.permissionDenied),

      errorKind: channels.guide?.errorKind ?? null,

      priority: counts.guide ?? 0,

    },

    {

      id: "steward",

      labelKey: "admin_home_inbox_steward",

      descKey: "admin_home_inbox_steward_desc",

      href: ADMIN_INBOX_QUEUE_HREFS.steward,

      count: channels.steward?.permissionDenied ? null : counts.steward,

      permissionDenied: Boolean(channels.steward?.permissionDenied),

      errorKind: channels.steward?.errorKind ?? null,

      priority: counts.steward ?? 0,

    },

    {

      id: "approvals",

      labelKey: "admin_home_inbox_approvals",

      descKey: "admin_home_inbox_approvals_desc",

      href: ADMIN_INBOX_QUEUE_HREFS.approvals,

      count: channels.approvals?.permissionDenied ? null : counts.approvals,

      permissionDenied: Boolean(channels.approvals?.permissionDenied),

      errorKind: channels.approvals?.errorKind ?? null,

      priority: counts.approvals ?? 0,

    },

    {

      id: "disputes",

      labelKey: "admin_home_inbox_disputes",

      descKey: "admin_home_inbox_disputes_desc",

      href: ADMIN_INBOX_QUEUE_HREFS.disputes,

      count: channels.disputes?.permissionDenied ? null : counts.disputes,

      permissionDenied: Boolean(channels.disputes?.permissionDenied),

      errorKind: channels.disputes?.errorKind ?? null,

      priority: counts.disputes ?? 0,

    },

    {

      id: "reports",

      labelKey: "admin_home_inbox_reports_queue",

      descKey: "admin_home_inbox_reports_queue_desc",

      href: ADMIN_INBOX_QUEUE_HREFS.reports,

      count: channels.reports?.permissionDenied ? null : counts.reports,

      permissionDenied: Boolean(channels.reports?.permissionDenied),

      errorKind: channels.reports?.errorKind ?? null,

      priority: counts.reports ?? 0,

    },

  ];



  return sortAdminUnifiedInboxTasks(tasks);

}


