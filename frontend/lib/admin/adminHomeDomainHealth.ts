import type { AdminHomeInboxChannels, AdminHomeInboxCounts } from "@/lib/admin/useAdminHomeInbox";
import type { AdminHomeKpiCounts } from "@/lib/admin/useAdminHomeKpi";
import { onboardingSectionPending } from "@/lib/admin/adminHomeSectionPending";
import {
  classifyOpsKpiSource,
  clampDomainHealthToneNoFakeGreen,
  resolveOperationsDomainLamp,
} from "@/lib/admin/opsWorkbenchL5";

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
 * Batch-11 HU-325 · 内容/官方/增长：CTA 深链文案（honest `neutral` 设计空 · 无假绿）。
 * Batch-11 HU-422 · 经营域灯 memory≠假绿 · 旁标数据源。
 * Batch-12 HU-449 · 全域绿点仅 REAL_DB；memory/unknown 禁假绿。
 * Batch-14 HU-495/Q6 · 内容/官方/增长改 `neutral` 设计空（禁整墙 `unknown` 死灰）。
 */
export function buildAdminHomeDomainHealth(input: {
  counts: AdminHomeInboxCounts;
  channels: AdminHomeInboxChannels;
  kpi: AdminHomeKpiCounts;
  inboxLoading: boolean;
  kpiLoading: boolean;
  /** KPI list meta.source（缺省 = unknown · 禁假绿） */
  kpiSource?: string | null;
  hasPermission: (perm: string) => boolean;
  permissionsLoaded: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
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
  const reports =
    inboxLoading || !permissionsLoaded
      ? null
      : typeof counts.reports === "number"
        ? counts.reports
        : channels.reports?.permissionDenied
          ? null
          : counts.reports;

  /** HU-449 · 绿=健康 仅正式库；memory/unknown 禁假绿 */
  const kpiSourceKind = classifyOpsKpiSource(kpiSource);
  const statusOk = t("admin_home_domain_health_status_ok");
  const statusNoFakeGreen = t("admin_home_domain_health_status_no_fake_green");

  const finalize = (item: AdminDomainHealthItem): AdminDomainHealthItem => {
    const tone = clampDomainHealthToneNoFakeGreen(item.tone, kpiSourceKind);
    if (tone === item.tone) return item;
    return {
      ...item,
      tone,
      countLabel: item.countLabel === statusOk ? statusNoFakeGreen : item.countLabel,
    };
  };

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
      countLabel:
        inboxLoading || !permissionsLoaded
          ? t("admin_home_empty_state_loading")
          : reports === null
            ? t("admin_home_domain_health_community_empty")
            : reports > 0
              ? t("admin_home_domain_health_reports", { count: reports })
              : statusOk,
    },
    {
      id: "content",
      labelKey: "admin_home_domain_health_label_content",
      href: "/admin/content",
      tone: "neutral",
      countLabel: t("admin_home_domain_health_cta_content"),
    },
    {
      id: "official",
      labelKey: "admin_home_domain_health_label_official",
      href: "/admin/official",
      tone: "neutral",
      countLabel: t("admin_home_domain_health_cta_official"),
    },
    {
      id: "growth",
      labelKey: "admin_home_domain_health_label_growth",
      href: "/admin/growth",
      tone: "neutral",
      countLabel: t("admin_home_domain_health_cta_growth"),
    },
    {
      id: "finance",
      labelKey: "admin_home_domain_health_label_finance",
      href: "/admin/finance-suite",
      tone: "neutral",
      countLabel: t("admin_home_domain_health_finance_pool"),
    },
    {
      id: "governance",
      labelKey: "admin_home_domain_health_label_governance",
      href: "/admin/cross-check",
      tone: "neutral",
      countLabel: t("admin_home_domain_health_governance"),
    },
  ].map(finalize);
}
