"use client";

import { AdminShellPrefetchLink } from "@/components/admin/AdminShellPrefetchLink";
import { useMemo } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminHomeDomainHealthStrip } from "@/components/admin/AdminHomeDomainHealthStrip";
import { AdminHomeFourLeafMemoryRiskStrip } from "@/components/admin/AdminHomeFourLeafMemoryRiskStrip";
import { AdminHomeRecentVisits } from "@/components/admin/AdminHomeRecentVisits";
import { AdminHomeSystemOverviewTrends } from "@/components/admin/AdminHomeSystemOverviewTrends";
import { consoleRole70DisplayLabel } from "@/lib/admin/adminRole70Matrix";
import {
  ADMIN_HOME_OVERVIEW_TOP_ROLES_MAX,
  TT_ADMIN_HOME_OVERVIEW_DENSITY_MARK,
  adminHomeSystemOverviewChainLagDisplay,
  adminHomeSystemOverviewRoleAssigneeTotal,
  adminHomeSystemOverviewRolesBeyondTop,
  adminHomeSystemOverviewRolesRemainder,
  adminHomeSystemOverviewTopRoles,
  adminHomeSystemOverviewUsersCount,
  adminHomeMetricsSourceLabelKey,
  isAdminHomeMetricsPostgresSource,
  type AdminHomeMetricsOverview,
  type AdminHomeObservabilityLite,
  type AdminHomeUserSnapshot,
} from "@/lib/admin/adminHomeSystemOverviewMetrics";
import { adminHomeHonestMetricDisplay } from "@/lib/admin/adminHomeHonestMetricDisplay";
import {
  TT_ADMIN_HOME_EMPTY_STATE_DICT_MARK,
  adminHomeEmptyStateDisplay,
} from "@/lib/admin/adminHomeEmptyStateDict";
import {
  adminHomeKpiMetricDisplay,
  adminHomeKpiTileLinkAllowed,
} from "@/lib/admin/adminHomeKpiMetric";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { adminOperatorEnumDisplay } from "@/lib/admin/adminOperatorEnumDisplay";
import {
  ADMIN_SUPERADMIN_PRIVILEGE_SOP_HREF,
  TT_ADMIN_HOME_SUPERADMIN_SOP_MARK,
  adminHomeSuperAdminAlertExpandedByDefault,
  resolveAdminSuperAdminPrivilegeAlert,
} from "@/lib/admin/adminSuperAdminPrivilegeAlert";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
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

function OverviewMetricTile(props: {
  href?: string;
  label: string;
  value: string;
  emphasize?: boolean;
  valueClassName?: string;
  /** HU-457 · 与 KpiStrip 同门：无权限时去链 + perm-denied 标记 */
  permissionDenied?: boolean;
  permDeniedLabelKey?: string;
}) {
  const { href, label, value, emphasize, valueClassName, permissionDenied, permDeniedLabelKey } =
    props;
  const linkAllowed = href ? adminHomeKpiTileLinkAllowed(Boolean(permissionDenied)) : false;
  const className = `flex min-h-[4.5rem] flex-col justify-between rounded-[var(--radius-lg)] border p-3 ${
    linkAllowed ? `${ADMIN_MOTION_CARD_HOVER_CLASS} ${travelFocusRingOffset2Classes}` : ""
  } ${ADMIN_KPI_CARD_IDLE_CLASS}`;

  const valueClass =
    valueClassName ??
    `mt-auto pt-2 text-h2 font-semibold tabular-nums ${emphasize && linkAllowed ? "text-ref-sun" : ADMIN_TEXT_META_CLASS}`;

  const body = (
    <>
      <span className={`text-small font-medium ${ADMIN_TEXT_BODY_CLASS}`}>{label}</span>
      <span className={valueClass}>{value}</span>
    </>
  );

  if (linkAllowed && href) {
    return (
      <AdminShellPrefetchLink href={href} className={className} data-tt-admin-system-overview-metric="1">
        {body}
      </AdminShellPrefetchLink>
    );
  }

  return (
    <div
      className={className}
      data-tt-admin-system-overview-metric="1"
      data-tt-admin-kpi-perm-denied={permissionDenied ? permDeniedLabelKey : undefined}
      aria-disabled={permissionDenied ? "true" : undefined}
      role={permissionDenied ? "group" : undefined}
    >
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
  // Batch-13 HU-484 · 空值统一用 0（非 em-dash）；链缺失用「—」仅占位由 i18n 折叠句消化
  const empty = "0";
  return {
    users: adminHomeSystemOverviewUsersCount(input.metrics, input.users) || empty,
    new7d: input.users?.new7d ?? input.metrics?.trends.userSignups.reduce((a, b) => a + b, 0) ?? empty,
    pending: input.inboxPendingTotal ?? empty,
    chain: input.observability?.chainId ?? empty,
    lag: input.observability?.indexerLagBlocks ?? empty,
    activity: input.adminActivity7d ?? empty,
  };
}

/** ① 工作台 · 系统概况（P1 无待办默认展开 · P2 有待办默认收起） */
export function AdminHomeSystemOverview(props: {
  counts: AdminHomeInboxCounts;
  channels: AdminHomeInboxChannels;
  inboxLoading: boolean;
  kpi: AdminHomeKpiCounts;
  kpiLoading: boolean;
  /** HU-422 */
  kpiSource?: string | null;
  inboxPendingTotal: number | null;
  focusInbox: boolean;
  overview: AdminHomeSystemOverviewValue;
}) {
  const { t } = useTranslation();
  const caps = useAdminCapabilities();
  const { focusInbox, inboxPendingTotal, kpi, kpiLoading, inboxLoading, overview } = props;

  /** HU-457 · 晋升 ops KPI 与 AdminHomeKpiStrip 同 capability 门 */
  const ordersDenied =
    caps.permissionsLoaded && !caps.hasPermission(ADMIN_PERM.ORDERS_READ);
  const disputesDenied =
    caps.permissionsLoaded && !caps.hasPermission(ADMIN_PERM.ORDERS_READ);
  const guidesDenied =
    caps.permissionsLoaded && !caps.hasPermission(ADMIN_PERM.USERS_READ);

  const metrics = overview.metrics;
  const usersFromMetrics = Boolean(metrics);
  const postgresSource = isAdminHomeMetricsPostgresSource(metrics?.source);
  const memorySource = metrics?.source === "memory";
  const kpiSource = props.kpiSource ?? null;

  const roleMap = useMemo(() => {
    if (metrics?.byConsoleRole && Object.keys(metrics.byConsoleRole).length > 0) {
      return metrics.byConsoleRole;
    }
    return overview.users?.byRole ?? {};
  }, [metrics?.byConsoleRole, overview.users?.byRole]);

  const topRoles = useMemo(
    () => adminHomeSystemOverviewTopRoles(roleMap, ADMIN_HOME_OVERVIEW_TOP_ROLES_MAX),
    [roleMap],
  );
  const beyondRoles = useMemo(
    () => adminHomeSystemOverviewRolesBeyondTop(roleMap, ADMIN_HOME_OVERVIEW_TOP_ROLES_MAX),
    [roleMap],
  );
  const roleAssigneeTotal = useMemo(() => adminHomeSystemOverviewRoleAssigneeTotal(roleMap), [roleMap]);
  const rolesRemainder = useMemo(
    () => adminHomeSystemOverviewRolesRemainder(roleMap, ADMIN_HOME_OVERVIEW_TOP_ROLES_MAX),
    [roleMap],
  );
  const showConsoleRoles = Boolean(metrics?.byConsoleRole && Object.keys(metrics.byConsoleRole).length > 0);
  const superAdminAlert = useMemo(() => resolveAdminSuperAdminPrivilegeAlert(roleMap), [roleMap]);
  const superAdminAlertExpanded = adminHomeSuperAdminAlertExpandedByDefault(superAdminAlert.level);

  const rolePillLabel = (role: string) =>
    showConsoleRoles ? consoleRole70DisplayLabel(role, t) : adminOperatorEnumDisplay(role, t, "role");

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
    if (overview.observabilityLoading) return t("admin_home_system_overview_chain_loading");
    if (overview.observabilityDenied) return t("admin_home_metric_denied");
    if (chainDisplay.kind === "empty") return t("admin_home_system_overview_chain_empty");
    if (chainDisplay.kind === "local_dev") {
      return t("admin_home_system_overview_chain_local", {
        lag: chainDisplay.lag ?? 0,
      });
    }
    if (chainDisplay.kind === "sepolia") {
      return t("admin_home_system_overview_chain_sepolia", {
        lag: chainDisplay.lag ?? t("admin_home_metric_empty"),
      });
    }
    return t("admin_home_system_overview_chain_lag_value", {
      chain: chainDisplay.chainId,
      lag: chainDisplay.lag ?? t("admin_home_metric_empty"),
    });
  })();

  const metricDisplay = (
    loading: boolean,
    denied: boolean,
    error: boolean,
    value: string | number | null | undefined,
  ) =>
    adminHomeHonestMetricDisplay(t, {
      loading,
      denied,
      error,
      value,
    });

  const emphasizeInboxPending =
    !focusInbox && inboxPendingTotal !== null && inboxPendingTotal > 0;

  const sourceLabel = t(adminHomeMetricsSourceLabelKey(metrics?.source));

  return (
    <div
      data-tt-admin-home-system-overview="1"
      data-tt-admin-home-overview-density="hu439"
      data-tt-admin-home-overview-density-mark={TT_ADMIN_HOME_OVERVIEW_DENSITY_MARK}
      data-tt-admin-home-empty-state-dict="hu440"
      data-tt-admin-home-empty-state-dict-mark={TT_ADMIN_HOME_EMPTY_STATE_DICT_MARK}
    >
      {/* HU-439 · Staging needle (literal survives minify) */}
      <span className="sr-only" data-tt-admin-home-overview-density-needle="hu439">
        {TT_ADMIN_HOME_OVERVIEW_DENSITY_MARK}
      </span>
      {/* HU-440 · empty-state three-state dict needle */}
      <span className="sr-only" data-tt-admin-home-empty-state-dict-needle="hu440">
        {TT_ADMIN_HOME_EMPTY_STATE_DICT_MARK}
      </span>
      <p className={`text-small ${ADMIN_TEXT_FOOTNOTE_CLASS}`} role="note">
        {usersFromMetrics
          ? t("admin_home_system_overview_honesty_metrics", { source: sourceLabel })
          : t("admin_home_system_overview_honesty")}
      </p>

      {/* Batch-13 HU-493 · Q6-D · 本页数值源折叠（运营可审计） */}
      <details
        className="mt-2 rounded-[var(--radius-md)] border border-ink-200/50 bg-bg-console/20 px-3 py-2"
        data-tt-admin-home-overview-source-fold="1"
      >
        <summary
          className={`cursor-pointer list-none text-small font-medium ${ADMIN_TEXT_META_CLASS} marker:content-none [&::-webkit-details-marker]:hidden`}
        >
          {t("admin_home_system_overview_source_fold_summary")}
        </summary>
        <ul className={`mt-2 space-y-1 text-small ${ADMIN_TEXT_FOOTNOTE_CLASS}`}>
          <li>
            {t("admin_home_system_overview_source_fold_users", {
              source: sourceLabel,
            })}
          </li>
          <li>
            {kpiSource
              ? t("admin_home_system_overview_source_fold_kpi", {
                  source: t(adminHomeMetricsSourceLabelKey(kpiSource)),
                })
              : t("admin_home_system_overview_source_fold_kpi_unknown")}
          </li>
        </ul>
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
              overview.users?.new7d,
            )}
            emphasize={Boolean(overview.users && overview.users.new7d > 0 && !focusInbox)}
          />
        </li>
        <li>
          <OverviewMetricTile
            href="/admin/inbox"
            label={t("admin_home_system_overview_inbox_pending")}
            value={metricDisplay(inboxLoading, false, false, inboxPendingTotal)}
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
        <div
          className="mt-4"
          data-tt-admin-home-system-overview-roles="1"
          data-tt-admin-home-overview-roles-top-max={String(ADMIN_HOME_OVERVIEW_TOP_ROLES_MAX)}
        >
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
          <ul className="mt-2 flex flex-wrap gap-2" data-tt-admin-home-overview-roles-top="hu439">
            {topRoles.map(({ role, count }) => (
              <li key={role}>
                <AdminShellPrefetchLink
                  href={`/admin/users?role=${encodeURIComponent(role)}`}
                  className={`${touchTargetLink44Classes} inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1 text-small ${ADMIN_TEXT_BODY_CLASS} ${travelFocusRingOffset2Classes}`}
                >
                  <span>{rolePillLabel(role)}</span>
                  <span className={`tabular-nums ${ADMIN_TEXT_MUTED_CLASS}`}>{count}</span>
                </AdminShellPrefetchLink>
              </li>
            ))}
          </ul>
          {rolesRemainder > 0 ? (
            <details
              className="mt-2 rounded-[var(--radius-sm)] border border-white/10 bg-slate-950/30 px-2.5 py-1.5"
              data-tt-admin-home-roles-more="1"
              data-tt-admin-home-roles-more-fold="hu439"
            >
              <summary
                className={`cursor-pointer text-small font-medium ${ADMIN_TEXT_META_CLASS} marker:content-none [&::-webkit-details-marker]:hidden`}
              >
                {t("admin_home_system_overview_roles_more", { count: rolesRemainder })}
              </summary>
              <ul className="mt-2 flex flex-wrap gap-2" data-tt-admin-home-overview-roles-beyond="hu439">
                {beyondRoles.map(({ role, count }) => (
                  <li key={role}>
                    <AdminShellPrefetchLink
                      href={`/admin/users?role=${encodeURIComponent(role)}`}
                      className={`${touchTargetLink44Classes} inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1 text-small ${ADMIN_TEXT_BODY_CLASS} ${travelFocusRingOffset2Classes}`}
                    >
                      <span>{rolePillLabel(role)}</span>
                      <span className={`tabular-nums ${ADMIN_TEXT_MUTED_CLASS}`}>{count}</span>
                    </AdminShellPrefetchLink>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          {!usersLoading &&
          !usersDenied &&
          !usersError &&
          (superAdminAlert.level === "warn" || superAdminAlert.level === "critical") ? (
            superAdminAlertExpanded ? (
              <div
                className="mt-3 rounded-[var(--radius-md)] border border-red-400/40 bg-red-500/10 px-3 py-2 text-small text-red-100"
                role="status"
                data-tt-admin-home-superadmin-alert={superAdminAlert.level}
                data-tt-admin-home-superadmin-alert-expanded="hu439"
                data-tt-admin-home-superadmin-pct={
                  superAdminAlert.pct != null ? String(Math.round(superAdminAlert.pct * 10) / 10) : ""
                }
              >
                <p>
                  {t("admin_home_superadmin_alert_critical", {
                    pct:
                      superAdminAlert.pct != null
                        ? String(Math.round(superAdminAlert.pct * 10) / 10)
                        : "—",
                    count: superAdminAlert.superAdminCount,
                    total: superAdminAlert.total,
                  })}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <AdminShellPrefetchLink
                    href={superAdminAlert.href}
                    className={`inline-flex text-small font-semibold underline-offset-2 hover:underline ${travelFocusRingOffset2Classes}`}
                    data-tt-admin-home-superadmin-cta="1"
                  >
                    {t("admin_home_superadmin_alert_cta")}
                  </AdminShellPrefetchLink>
                  <AdminShellPrefetchLink
                    href={ADMIN_SUPERADMIN_PRIVILEGE_SOP_HREF}
                    className={`inline-flex text-small font-medium underline-offset-2 hover:underline ${travelFocusRingOffset2Classes}`}
                    data-tt-admin-home-superadmin-sop="hu447"
                    data-tt-admin-home-superadmin-sop-mark={TT_ADMIN_HOME_SUPERADMIN_SOP_MARK}
                  >
                    {t("admin_home_superadmin_sop_link")}
                  </AdminShellPrefetchLink>
                </div>
              </div>
            ) : (
              <details
                className="mt-3 rounded-[var(--radius-md)] border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-small text-amber-50"
                data-tt-admin-home-superadmin-alert={superAdminAlert.level}
                data-tt-admin-home-superadmin-alert-fold="hu439"
                data-tt-admin-home-superadmin-pct={
                  superAdminAlert.pct != null ? String(Math.round(superAdminAlert.pct * 10) / 10) : ""
                }
              >
                <summary
                  className="cursor-pointer font-medium marker:content-none [&::-webkit-details-marker]:hidden"
                  role="status"
                >
                  {t("admin_home_superadmin_alert_warn_summary", {
                    pct:
                      superAdminAlert.pct != null
                        ? String(Math.round(superAdminAlert.pct * 10) / 10)
                        : "—",
                  })}
                </summary>
                <p className="mt-2">
                  {t("admin_home_superadmin_alert_warn", {
                    pct:
                      superAdminAlert.pct != null
                        ? String(Math.round(superAdminAlert.pct * 10) / 10)
                        : "—",
                    count: superAdminAlert.superAdminCount,
                    total: superAdminAlert.total,
                  })}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <AdminShellPrefetchLink
                    href={superAdminAlert.href}
                    className={`inline-flex text-small font-semibold underline-offset-2 hover:underline ${travelFocusRingOffset2Classes}`}
                    data-tt-admin-home-superadmin-cta="1"
                  >
                    {t("admin_home_superadmin_alert_cta")}
                  </AdminShellPrefetchLink>
                  <AdminShellPrefetchLink
                    href={ADMIN_SUPERADMIN_PRIVILEGE_SOP_HREF}
                    className={`inline-flex text-small font-medium underline-offset-2 hover:underline ${travelFocusRingOffset2Classes}`}
                    data-tt-admin-home-superadmin-sop="hu447"
                    data-tt-admin-home-superadmin-sop-mark={TT_ADMIN_HOME_SUPERADMIN_SOP_MARK}
                  >
                    {t("admin_home_superadmin_sop_link")}
                  </AdminShellPrefetchLink>
                </div>
              </details>
            )
          ) : null}
        </div>
      ) : null}

      {/* W9 HU-301 · 经营数字首屏可见 · HU-457 capability 同门 */}
      <div
        className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3"
        data-tt-admin-home-ops-kpi-promoted="1"
        data-tt-admin-home-ops-kpi-capability-gated="1"
        data-tt-admin-home-guides-inventory-kpi="1"
        data-tt-admin-home-empty-state-kpi="hu440"
        title={`${adminHomeEmptyStateDisplay(t, "loading")} · ${adminHomeEmptyStateDisplay(t, "empty")} · ${adminHomeEmptyStateDisplay(t, "not_deployed")}`}
      >
        <OverviewMetricTile
          href="/admin/orders"
          label={t("admin_home_kpi_orders_label")}
          value={adminHomeKpiMetricDisplay(
            { loading: kpiLoading, count: kpi.orders, permissionDenied: ordersDenied },
            t,
            "admin_home_kpi_orders",
          )}
          permissionDenied={ordersDenied}
          permDeniedLabelKey="admin_home_kpi_orders_label"
        />
        <OverviewMetricTile
          href="/admin/disputes"
          label={t("admin_home_kpi_disputes_label")}
          value={adminHomeKpiMetricDisplay(
            { loading: kpiLoading, count: kpi.disputes, permissionDenied: disputesDenied },
            t,
            "admin_home_kpi_disputes",
          )}
          emphasize={!disputesDenied && (kpi.disputes ?? 0) > 0}
          permissionDenied={disputesDenied}
          permDeniedLabelKey="admin_home_kpi_disputes_label"
        />
        <OverviewMetricTile
          href="/admin/guides"
          label={t("admin_home_kpi_guides_label")}
          value={adminHomeKpiMetricDisplay(
            {
              loading: kpiLoading,
              count: kpi.guides,
              permissionDenied: guidesDenied,
              zeroLabelKey: "admin_home_kpi_guides_design_empty",
            },
            t,
            "admin_home_kpi_guides",
          )}
          permissionDenied={guidesDenied}
          permDeniedLabelKey="admin_home_kpi_guides_label"
        />
      </div>

      {/* W9 HU-293/294 · 域健康始终在概况内（聚焦态亦不藏） · W09 HU-412 / W03 HU-456 四叶 MEMORY 条件风险 */}
      <div className="mt-5 space-y-5" data-tt-admin-home-command-health="1">
        <AdminHomeFourLeafMemoryRiskStrip
          metricsSource={metrics?.source ?? null}
          kpiSource={kpiSource}
        />
        <AdminHomeDomainHealthStrip {...props} embedded />
        {!focusInbox ? <AdminHomeRecentVisits /> : null}
        {focusInbox ? (
          <p className={`text-small ${ADMIN_TEXT_META_CLASS}`}>
            {t("admin_home_system_overview_focus_hint")}
          </p>
        ) : null}
      </div>

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
        {adminHomeKpiTileLinkAllowed(ordersDenied) ? (
          <AdminShellPrefetchLink
            href="/admin/orders"
            className={`${touchTargetLink44Classes} text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_home_system_overview_link_orders", {
              orders: adminHomeKpiMetricDisplay(
                { loading: kpiLoading, count: kpi.orders, permissionDenied: false },
                t,
                "admin_home_kpi_orders",
              ),
            })}
          </AdminShellPrefetchLink>
        ) : (
          <span
            className={`text-small ${ADMIN_TEXT_MUTED_CLASS}`}
            data-tt-admin-kpi-perm-denied="admin_home_kpi_orders_label"
          >
            {t("admin_home_kpi_orders_label")}
          </span>
        )}
      </div>
    </div>
  );
}
