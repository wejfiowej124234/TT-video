import type { AdminHomeInboxChannels, AdminHomeInboxCounts } from "@/lib/admin/useAdminHomeInbox";
import type { AdminHomeKpiCounts } from "@/lib/admin/useAdminHomeKpi";
import { onboardingSectionPending } from "@/lib/admin/adminHomeSectionPending";
import { resolveOperationsDomainLamp } from "@/lib/admin/opsWorkbenchL5";

export type AdminDomainHealthTone = "ok" | "attention" | "neutral" | "unknown";

export type AdminDomainHealthItem = {
  id: string;
  labelKey: string;
  href: string;
  tone: AdminDomainHealthTone;
  countLabel: string | null;
  /** HU-422 · 经营灯旁数据源徽章文案 key */
  sourceBadgeKey?: string | null;
};

/**
 * Batch-10 HU-288 + W9 HU-294 · 超管指挥台域灯：
 * 入驻 / 经营 / 社区 / 内容 / 官方 / 增长 / 财务 / 治理。
 *
 * Green means that domain's own queue/snapshot is healthy — not "the hub page exists".
 * Operations still forbids fake green unless KPI `meta.source` is REAL_DB (HU-422).
 * Other domains use their own APIs and are not clamped by the ops KPI source.
 */
export function buildAdminHomeDomainHealth(input: {
  counts: AdminHomeInboxCounts;
  channels: AdminHomeInboxChannels;
  kpi: AdminHomeKpiCounts;
  inboxLoading: boolean;
  kpiLoading: boolean;
  kpiSource?: string | null;
  hasPermission: (perm: string) => boolean;
  permissionsLoaded: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
  contentQueueCount?: number | null;
  contentQueueLoading?: boolean;
  officialQueueCount?: number | null;
  officialQueueLoading?: boolean;
  communityReportsCount?: number | null;
  communityReportsLoading?: boolean;
  treasurySource?: "not_deployed" | "chain" | "projection";
  treasuryLoading?: boolean;
  treasuryEventTotal?: number | null;
  growthRegistrations?: number | null;
  growthReferrals?: number | null;
  growthFrozen?: number | null;
  growthLoading?: boolean;
  governorAddress?: string | null;
  governanceLive?: boolean;
  governanceLoading?: boolean;
}): AdminDomainHealthItem[] {
  const {
    counts,
    channels,
    kpi,
    inboxLoading,
    kpiLoading,
    kpiSource = null,
    hasPermission,
    permissionsLoaded,
    t,
    contentQueueCount,
    contentQueueLoading = false,
    officialQueueCount,
    officialQueueLoading = false,
    communityReportsCount,
    communityReportsLoading = false,
    treasurySource,
    treasuryLoading = false,
    treasuryEventTotal = null,
    growthRegistrations,
    growthReferrals,
    growthFrozen,
    growthLoading = false,
    governorAddress,
    governanceLive,
    governanceLoading = false,
  } = input;

  const onboardingPending = onboardingSectionPending(
    counts,
    channels,
    inboxLoading,
    hasPermission,
    permissionsLoaded,
  );

  const orders = kpiLoading ? null : kpi.orders;
  const disputes = kpiLoading ? null : kpi.disputes;
  const extrasCommunityWired = communityReportsCount !== undefined;
  const inboxReports =
    inboxLoading || !permissionsLoaded
      ? null
      : typeof counts.reports === "number"
        ? counts.reports
        : channels.reports?.permissionDenied
          ? null
          : counts.reports;
  const reports = extrasCommunityWired
    ? communityReportsLoading
      ? inboxReports
      : communityReportsCount == null
        ? inboxReports
        : inboxReports == null
          ? communityReportsCount
          : Math.max(communityReportsCount, inboxReports)
    : inboxReports;
  const communityLoading =
    reports == null &&
    (extrasCommunityWired
      ? communityReportsLoading || inboxLoading || !permissionsLoaded
      : inboxLoading || !permissionsLoaded);

  const statusOk = t("admin_home_domain_health_status_ok");

  return [
    {
      id: "onboarding",
      labelKey: "admin_home_domain_health_label_onboarding",
      href: "/admin/onboarding",
      tone:
        onboardingPending === null ? "unknown" : onboardingPending > 0 ? "attention" : "ok",
      countLabel:
        onboardingPending === null
          ? inboxLoading || !permissionsLoaded
            ? t("admin_home_empty_state_loading")
            : t("admin_home_empty_state_empty")
          : onboardingPending > 0
            ? t("admin_home_domain_health_status_attention")
            : statusOk,
    },
    (() => {
      const opsLamp = resolveOperationsDomainLamp({
        orders,
        disputes,
        kpiLoading,
        kpiSource,
      });
      return {
        id: "operations",
        labelKey: "admin_home_domain_health_label_operations",
        href: "/admin/orders",
        tone: opsLamp.tone,
        sourceBadgeKey: opsLamp.sourceBadgeKey,
        countLabel:
          orders === null || disputes === null
            ? kpiLoading
              ? t("admin_home_empty_state_loading")
              : t("admin_home_empty_state_empty")
            : t("admin_home_domain_health_ops_snapshot", {
                orders: String(orders),
                disputes: String(disputes),
              }),
      };
    })(),
    {
      id: "community",
      labelKey: "admin_home_domain_health_label_community",
      href: "/admin/community/reports",
      tone: reports === null ? "unknown" : reports > 0 ? "attention" : "ok",
      countLabel: communityLoading
        ? t("admin_home_empty_state_loading")
        : reports === null
          ? t("admin_home_domain_health_community_empty")
          : reports > 0
            ? t("admin_home_domain_health_reports", { count: reports })
            : statusOk,
    },
    (() => {
      const wired = contentQueueCount !== undefined;
      if (!wired) {
        return {
          id: "content",
          labelKey: "admin_home_domain_health_label_content",
          href: "/admin/content",
          tone: "neutral" as const,
          countLabel: t("admin_home_domain_health_cta_content"),
        };
      }
      return {
        id: "content",
        labelKey: "admin_home_domain_health_label_content",
        href: "/admin/content",
        tone: contentQueueLoading
          ? "unknown"
          : contentQueueCount == null
            ? "unknown"
            : contentQueueCount > 0
              ? "attention"
              : "ok",
        countLabel: contentQueueLoading
          ? t("admin_home_empty_state_loading")
          : contentQueueCount == null
            ? t("admin_home_domain_health_cta_content")
            : contentQueueCount > 0
              ? t("admin_home_domain_health_content_queue", { count: contentQueueCount })
              : t("admin_home_domain_health_content_clear"),
      };
    })(),
    (() => {
      const wired = officialQueueCount !== undefined;
      if (!wired) {
        return {
          id: "official",
          labelKey: "admin_home_domain_health_label_official",
          href: "/admin/official",
          tone: "neutral" as const,
          countLabel: t("admin_home_domain_health_cta_official"),
        };
      }
      return {
        id: "official",
        labelKey: "admin_home_domain_health_label_official",
        href: "/admin/official",
        tone: officialQueueLoading
          ? "unknown"
          : officialQueueCount == null
            ? "unknown"
            : officialQueueCount > 0
              ? "attention"
              : "ok",
        countLabel: officialQueueLoading
          ? t("admin_home_empty_state_loading")
          : officialQueueCount == null
            ? t("admin_home_domain_health_cta_official")
            : officialQueueCount > 0
              ? t("admin_home_domain_health_official_queue", { count: officialQueueCount })
              : statusOk,
      };
    })(),
    (() => {
      const wired = growthRegistrations !== undefined;
      if (!wired) {
        return {
          id: "growth",
          labelKey: "admin_home_domain_health_label_growth",
          href: "/admin/growth",
          tone: "neutral" as const,
          countLabel: t("admin_home_domain_health_cta_growth"),
        };
      }
      const frozen = growthFrozen ?? 0;
      return {
        id: "growth",
        labelKey: "admin_home_domain_health_label_growth",
        href: "/admin/growth",
        tone: growthLoading
          ? "unknown"
          : growthRegistrations == null
            ? "unknown"
            : frozen > 0
              ? "attention"
              : "ok",
        countLabel: growthLoading
          ? t("admin_home_empty_state_loading")
          : growthRegistrations == null
            ? t("admin_home_domain_health_cta_growth")
            : t("admin_home_domain_health_growth_snapshot", {
                registrations: String(growthRegistrations),
                referrals: String(growthReferrals ?? 0),
              }),
      };
    })(),
    (() => {
      if (treasuryLoading) {
        return {
          id: "finance",
          labelKey: "admin_home_domain_health_label_finance",
          href: "/admin/finance-suite",
          tone: "unknown" as const,
          countLabel: t("admin_home_empty_state_loading"),
        };
      }
      if (treasurySource === "not_deployed") {
        return {
          id: "finance",
          labelKey: "admin_home_domain_health_label_finance",
          href: "/admin/finance-suite",
          tone: "unknown" as const,
          countLabel: t("admin_home_domain_health_finance_not_deployed"),
        };
      }
      if (treasurySource === "chain" || treasurySource === "projection") {
        return {
          id: "finance",
          labelKey: "admin_home_domain_health_label_finance",
          href: "/admin/finance-suite",
          tone: "ok" as const,
          countLabel:
            treasuryEventTotal == null
              ? t("admin_home_domain_health_finance_chain")
              : t("admin_home_domain_health_finance_events", { count: treasuryEventTotal }),
        };
      }
      return {
        id: "finance",
        labelKey: "admin_home_domain_health_label_finance",
        href: "/admin/finance-suite",
        tone: "neutral" as const,
        countLabel: t("admin_home_domain_health_finance_pool"),
      };
    })(),
    (() => {
      if (governanceLoading) {
        return {
          id: "governance",
          labelKey: "admin_home_domain_health_label_governance",
          href: "/admin/cross-check",
          tone: "unknown" as const,
          countLabel: t("admin_home_empty_state_loading"),
        };
      }
      const live = governanceLive === true || Boolean(governorAddress);
      return {
        id: "governance",
        labelKey: "admin_home_domain_health_label_governance",
        href: "/admin/cross-check",
        tone: live ? ("ok" as const) : ("neutral" as const),
        countLabel: live
          ? t("admin_home_domain_health_governance_live")
          : t("admin_home_domain_health_governance"),
      };
    })(),
  ];
}
