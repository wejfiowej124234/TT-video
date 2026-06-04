import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";

import { onboardingSectionPending } from "@/lib/admin/adminHomeSectionPending";

import type { AdminHomeInboxChannels, AdminHomeInboxCounts } from "@/lib/admin/useAdminHomeInbox";

import type { AdminHomeKpiCounts } from "@/lib/admin/useAdminHomeKpi";



export type AdminDomainHealthTone = "ok" | "attention" | "neutral" | "unknown";



export type AdminDomainHealthItem = {

  id: string;

  labelKey: string;

  href: string;

  tone: AdminDomainHealthTone;

  countLabel: string | null;

};



export function buildAdminHomeDomainHealth(input: {

  counts: AdminHomeInboxCounts;

  channels: AdminHomeInboxChannels;

  kpi: AdminHomeKpiCounts;

  inboxLoading: boolean;

  kpiLoading: boolean;

  hasPermission: (perm: string) => boolean;

  permissionsLoaded: boolean;

  t: (key: string, vars?: Record<string, string | number>) => string;

}): AdminDomainHealthItem[] {

  const { counts, channels, kpi, inboxLoading, kpiLoading, hasPermission, permissionsLoaded, t } = input;



  const onboardingPending = onboardingSectionPending(

    counts,

    channels,

    inboxLoading,

    hasPermission,

    permissionsLoaded,

  );



  const reports = inboxLoading ? null : channels.reports.permissionDenied ? null : counts.reports;

  const disputes = kpiLoading ? null : kpi.disputes;



  return [

    {

      id: "onboarding",

      labelKey: "admin_shell_nav_group_onboarding",

      href: "/admin/onboarding",

      tone:

        onboardingPending === null

          ? "unknown"

          : onboardingPending > 0

            ? "attention"

            : "ok",

      countLabel:
        onboardingPending === null
          ? null
          : onboardingPending > 0
            ? t("admin_home_domain_health_status_attention")
            : t("admin_home_domain_health_status_ok"),

    },

    {

      id: "operations",

      labelKey: "admin_shell_nav_group_operations",

      href: "/admin/orders",

      tone:

        disputes === null

          ? "unknown"

          : disputes > 0

            ? "attention"

            : "ok",

      countLabel:
        disputes === null
          ? null
          : disputes > 0
            ? t("admin_home_domain_health_status_attention")
            : t("admin_home_domain_health_status_ok"),

    },

    {

      id: "community",

      labelKey: "admin_shell_nav_group_community",

      href: ADMIN_INBOX_QUEUE_HREFS.reports,

      tone: reports === null ? "unknown" : reports > 0 ? "attention" : "ok",

      countLabel:
        reports === null
          ? null
          : reports > 0
            ? t("admin_home_domain_health_status_attention")
            : t("admin_home_domain_health_status_ok"),

    },

    {

      id: "finance",

      labelKey: "admin_shell_nav_group_finance",

      href: "/admin/finance-suite",

      tone: "neutral",

      countLabel: t("admin_home_domain_health_finance_hub"),

    },

    {

      id: "governance",

      labelKey: "admin_shell_nav_group_governance",

      href: "/admin/cross-check",

      tone: "neutral",

      countLabel: t("admin_home_domain_health_governance"),

    },

    {

      id: "more",

      labelKey: "admin_shell_nav_group_more",

      href: "/admin/audit",

      tone: "neutral",

      countLabel: t("admin_home_domain_health_more"),

    },

  ];

}


