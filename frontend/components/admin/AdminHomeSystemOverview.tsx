"use client";

import { AdminShellPrefetchLink } from "@/components/admin/AdminShellPrefetchLink";
import { useMemo } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminHomeDomainHealthStrip } from "@/components/admin/AdminHomeDomainHealthStrip";
import { AdminHomeRecentVisits } from "@/components/admin/AdminHomeRecentVisits";
import { AdminHomeSystemOverviewTrends } from "@/components/admin/AdminHomeSystemOverviewTrends";
import {
  adminHomeSystemOverviewChainLagDisplay,
  adminHomeSystemOverviewRoleAssigneeTotal,
  adminHomeSystemOverviewRolesRemainder,
  adminHomeSystemOverviewTopRoles,
  adminHomeSystemOverviewUsersCount,
  isAdminHomeMetricsPostgresSource,
  type AdminHomeMetricsOverview,
  type AdminHomeObservabilityLite,
  type AdminHomeUserSnapshot,
} from "@/lib/admin/adminHomeSystemOverviewMetrics";
import type { AdminHomeSystemOverviewValue } from "@/lib/admin/useAdminHomeSystemOverview";
import type { AdminHomeInboxChannels, AdminHomeInboxCounts } from "@/lib/admin/useAdminHomeInbox";
import type { AdminHomeKpiCounts } from "@/lib/admin/useAdminHomeKpi";
import {
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_KPI_CARD_IDLE_CLASS,
  ADMIN_MOTION_CARD_HOVER_CLASS,
  ADMIN_SYSTEM_OVERVIEW_CHAIN_VALUE_CLASS,
  ADMIN_TEXT_BODY_CLASS,
  ADMIN_TEXT_FOOTNOTE_CLASS,
  ADMIN_TEXT_META_CLASS,
  ADMIN_TEXT_MUTED_CLASS,
} from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

const TOP_ROLES_MAX = 4;

function metricDisplay(loading: boolean, denied: boolean, error: boolean, value: string | number): string {
  if (loading) return "…";
  if (denied) return "—";
  if (error) return "—";
  return String(value);
}

function OverviewMetricTile(props: {
  href?: string;
  label: string;
  value: string;
  emphasize?: boolean;
  valueClassName?: string;
}) {
  const { href, label, value, emphasize, valueClassName } = props;
  const className = `flex min-h-[4.5rem] flex-col justify-between rounded-[var(--radius-lg)] border p-3 ${
    href ? `${ADMIN_MOTION_CARD_HOVER_CLASS} ${travelFocusRingOffset2Classes}` : ""
  } ${ADMIN_KPI_CARD_IDLE_CLASS}`;

  const valueClass =
    valueClassName ??
    `mt-auto pt-2 text-h2 font-semibold tabular-nums ${emphasize ? "text-ref-sun" : ADMIN_TEXT_META_CLASS}`;

  const body = (
    <>
      <span className={`text-small font-medium ${ADMIN_TEXT_BODY_CLASS}`}>{label}</span>
      <span className={valueClass}>{value}</span>
    </>
  );

  if (href) {
    return (
      <AdminShellPrefetchLink href={href} className={className} data-tt-admin-system-overview-metric="1">
        {body}
      </AdminShellPrefetchLink>
    );
  }

  return (
    <div className={className} data-tt-admin-system-overview-metric="1">
      {body}
    </div>
  );
}

export function adminHomeSystemOverviewCollapsedSummaryVars(input: {
  users: AdminHomeUserSnapshot | null;
  metrics: AdminHomeMetricsOverview | null;
  observability: AdminHomeObservabilityLite | null;
  inboxPendingTotal: number | null;
  adminActivity7d?: number | null;
}): Record<string, string | number> {
  return {
    users: adminHomeSystemOverviewUsersCount(input.metrics, input.users) || "—",
    new7d: input.users?.new7d ?? input.metrics?.trends.userSignups.reduce((a, b) => a + b, 0) ?? "—",
    pending: input.inboxPendingTotal ?? "—",
    chain: input.observability?.chainId ?? "—",
    lag: input.observability?.indexerLagBlocks ?? "—",
    activity: input.adminActivity7d ?? "—",
  };
}

/** ① 工作台 · 系统概况（P1 无待办默认展开 · P2 有待办默认收起） */
export function AdminHomeSystemOverview(props: {
  counts: AdminHomeInboxCounts;
  channels: AdminHomeInboxChannels;
  inboxLoading: boolean;
  kpi: AdminHomeKpiCounts;
  kpiLoading: boolean;
  inboxPendingTotal: number | null;
  focusInbox: boolean;
  overview: AdminHomeSystemOverviewValue;
}) {
  const { t } = useTranslation();
  const { focusInbox, inboxPendingTotal, kpi, kpiLoading, inboxLoading, overview } = props;

  const metrics = overview.metrics;
  const usersFromMetrics = Boolean(metrics);
  const postgresSource = isAdminHomeMetricsPostgresSource(metrics?.source);
  const memorySource = metrics?.source === "memory";

  const roleMap = useMemo(() => {
    if (metrics?.byConsoleRole && Object.keys(metrics.byConsoleRole).length > 0) {
      return metrics.byConsoleRole;
    }
    return overview.users?.byRole ?? {};
  }, [metrics?.byConsoleRole, overview.users?.byRole]);

  const topRoles = useMemo(() => adminHomeSystemOverviewTopRoles(roleMap, TOP_ROLES_MAX), [roleMap]);
  const roleAssigneeTotal = useMemo(() => adminHomeSystemOverviewRoleAssigneeTotal(roleMap), [roleMap]);
  const rolesRemainder = useMemo(
    () => adminHomeSystemOverviewRolesRemainder(roleMap, TOP_ROLES_MAX),
    [roleMap],
  );
  const showConsoleRoles = Boolean(metrics?.byConsoleRole && Object.keys(metrics.byConsoleRole).length > 0);

  const usersLoading = overview.metricsLoading || overview.usersLoading;
  const usersDenied = overview.metricsDenied || overview.usersDenied;
  const usersError = overview.metricsError || overview.usersError;
  const usersCount = adminHomeSystemOverviewUsersCount(metrics, overview.users);

  const usersLabel = usersFromMetrics
    ? postgresSource
      ? t("admin_home_system_overview_users_total")
      : memorySource
        ? t("admin_home_system_overview_users_memory")
        : t("admin_home_system_overview_users_sample")
    : t("admin_home_system_overview_users_sample");

  const new7dLabel =
    usersFromMetrics && postgresSource
      ? t("admin_home_system_overview_users_new_7d_store")
      : t("admin_home_system_overview_users_new_7d");

  const obs = overview.observability;
  const chainDisplay = adminHomeSystemOverviewChainLagDisplay(obs?.chainId ?? null, obs?.indexerLagBlocks ?? null);
  const chainValue = (() => {
    if (overview.observabilityLoading) return "…";
    if (overview.observabilityDenied) return "—";
    if (chainDisplay.kind === "empty") return "—";
    if (chainDisplay.kind === "local_dev") {
      return t("admin_home_system_overview_chain_local", {
        lag: chainDisplay.lag ?? 0,
      });
    }
    return t("admin_home_system_overview_chain_lag_value", {
      chain: chainDisplay.chainId,
      lag: chainDisplay.lag ?? "—",
    });
  })();

  const emphasizeInboxPending =
    !focusInbox && inboxPendingTotal !== null && inboxPendingTotal > 0;

  return (
    <div data-tt-admin-home-system-overview="1">
      <p className={`text-small ${ADMIN_TEXT_FOOTNOTE_CLASS}`} role="note">
        {usersFromMetrics
          ? t("admin_home_system_overview_honesty_metrics", { source: metrics?.source ?? "—" })
          : t("admin_home_system_overview_honesty")}
      </p>
      <details className="mt-1">
        <summary className={`cursor-pointer text-small ${ADMIN_TEXT_MUTED_CLASS}`}>
          {t("admin_home_tech_fold_summary")}
        </summary>
        <p className={`mt-1 text-small ${ADMIN_TEXT_MUTED_CLASS}`}>
          {usersFromMetrics
            ? t("admin_home_system_overview_honesty_dev_metrics")
            : t("admin_home_system_overview_honesty_dev_users")}
        </p>
      </details>

      <ul
        className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        data-tt-admin-home-system-overview-metrics="1"
      >
        <li>
          <OverviewMetricTile
            href="/admin/users"
            label={usersLabel}
            value={metricDisplay(usersLoading, usersDenied, usersError, usersCount)}
          />
        </li>
        <li>
          <OverviewMetricTile
            href="/admin/users"
            label={new7dLabel}
            value={metricDisplay(
              usersLoading,
              usersDenied,
              usersError,
              overview.users?.new7d ?? 0,
            )}
            emphasize={Boolean(overview.users && overview.users.new7d > 0 && !focusInbox)}
          />
        </li>
        <li>
          <OverviewMetricTile
            href="/admin/inbox"
            label={t("admin_home_system_overview_inbox_pending")}
            value={metricDisplay(inboxLoading, false, false, inboxPendingTotal ?? 0)}
            emphasize={emphasizeInboxPending}
          />
        </li>
        <li>
          <OverviewMetricTile
            href="/admin/observability"
            label={t("admin_home_system_overview_chain_lag")}
            value={chainValue}
            valueClassName={ADMIN_SYSTEM_OVERVIEW_CHAIN_VALUE_CLASS}
          />
        </li>
      </ul>

      {!focusInbox ? (
        <AdminHomeSystemOverviewTrends
          trends={metrics?.trends ?? null}
          adminActivityAvailable={metrics?.adminActivityAvailable ?? false}
          loading={overview.metricsLoading}
          layout="wide"
        />
      ) : (
        <p className={`mt-3 text-small ${ADMIN_TEXT_META_CLASS}`} data-tt-admin-system-overview-trends-hidden="1">
          {t("admin_home_system_overview_trends_focus_hidden")}
        </p>
      )}

      {topRoles.length > 0 ? (
        <div className="mt-4" data-tt-admin-home-system-overview-roles="1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h3 className={`text-small font-semibold ${ADMIN_TEXT_BODY_CLASS}`}>
              {showConsoleRoles
                ? t("admin_home_system_overview_console_roles_heading")
                : t("admin_home_system_overview_roles_title")}
            </h3>
            {showConsoleRoles ? (
              <span className={`text-small ${ADMIN_TEXT_META_CLASS}`}>
                {t("admin_home_system_overview_console_roles_total", { total: roleAssigneeTotal })}
              </span>
            ) : null}
          </div>
          <ul className="mt-2 flex flex-wrap gap-2">
            {topRoles.map(({ role, count }) => (
              <li key={role}>
                <AdminShellPrefetchLink
                  href={`/admin/users?role=${encodeURIComponent(role)}`}
                  className={`${touchTargetLink44Classes} inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1 text-small ${ADMIN_TEXT_BODY_CLASS} ${travelFocusRingOffset2Classes}`}
                >
                  <span>{role}</span>
                  <span className={`tabular-nums ${ADMIN_TEXT_MUTED_CLASS}`}>{count}</span>
                </AdminShellPrefetchLink>
              </li>
            ))}
          </ul>
          {rolesRemainder > 0 ? (
            <p className={`mt-2 text-small ${ADMIN_TEXT_META_CLASS}`}>
              {t("admin_home_system_overview_roles_more", { count: rolesRemainder })}
            </p>
          ) : null}
        </div>
      ) : null}

      {!focusInbox ? (
        <div className="mt-5 space-y-5">
          <AdminHomeDomainHealthStrip {...props} embedded />
          <AdminHomeRecentVisits />
        </div>
      ) : (
        <p className={`mt-4 text-small ${ADMIN_TEXT_META_CLASS}`}>
          {t("admin_home_system_overview_focus_hint")}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <AdminShellPrefetchLink
          href="/admin/observability"
          className={`${touchTargetLink44Classes} text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
        >
          {t("admin_home_system_overview_link_observability")}
        </AdminShellPrefetchLink>
        <AdminShellPrefetchLink
          href="/admin/users"
          className={`${touchTargetLink44Classes} text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
        >
          {t("admin_home_system_overview_link_users")}
        </AdminShellPrefetchLink>
        {!focusInbox ? (
          <AdminShellPrefetchLink
            href="/admin/orders"
            className={`${touchTargetLink44Classes} text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_home_system_overview_link_orders", {
              orders: kpiLoading ? "…" : kpi.orders ?? "—",
            })}
          </AdminShellPrefetchLink>
        ) : null}
      </div>
    </div>
  );
}
