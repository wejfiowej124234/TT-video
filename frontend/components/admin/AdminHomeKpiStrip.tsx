"use client";

import { AdminShellPrefetchLink } from "@/components/admin/AdminShellPrefetchLink";

import { useTranslation } from "@/components/LocaleProvider";

import {
  adminHomeKpiMetricDisplay,
  adminHomeKpiTileLinkAllowed,
} from "@/lib/admin/adminHomeKpiMetric";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import type { AdminHomeKpiCounts } from "@/lib/admin/useAdminHomeKpi";

import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import {
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_KPI_CARD_IDLE_CLASS,
  ADMIN_KPI_CARD_PENDING_CLASS,
  ADMIN_HERO_METRIC_COUNT_CLASS,
  ADMIN_KPI_SCOPE_NOTE_CLASS,
  ADMIN_INFO_BADGE_CLASS,
  ADMIN_MOTION_CARD_HOVER_CLASS,
  ADMIN_TEXT_BODY_CLASS,
  ADMIN_TEXT_META_CLASS,
  ADMIN_TEXT_MUTED_CLASS,
} from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

type KpiTile = {
  href: string;
  labelKey: string;
  countKey: string;
  loading: boolean;
  count: number | null;
  permissionDenied: boolean;
  emphasize: boolean;
};

function KpiTileSurface({
  tile,
  t,
  compact,
}: {
  tile: KpiTile;
  t: (key: string, vars?: Record<string, string | number>) => string;
  compact?: boolean;
}) {
  const value = adminHomeKpiMetricDisplay(
    { loading: tile.loading, count: tile.count, permissionDenied: tile.permissionDenied },
    t,
    tile.countKey,
  );
  const linkAllowed = adminHomeKpiTileLinkAllowed(tile.permissionDenied);
  const className = `flex flex-col justify-between rounded-[var(--radius-lg)] border ${
    compact ? "min-h-[4rem] p-3" : "min-h-[5.5rem] p-4"
  } ${
    linkAllowed ? ADMIN_MOTION_CARD_HOVER_CLASS : ""
  } ${travelFocusRingOffset2Classes} ${
    tile.emphasize ? ADMIN_KPI_CARD_PENDING_CLASS : ADMIN_KPI_CARD_IDLE_CLASS
  } ${!linkAllowed ? "cursor-not-allowed opacity-80" : ""}`;

  const body = (
    <>
      <span className={`text-small font-medium ${ADMIN_TEXT_BODY_CLASS}`}>{t(tile.labelKey)}</span>
      <span
        className={`mt-auto pt-3 font-semibold tabular-nums ${
          tile.emphasize
            ? ADMIN_HERO_METRIC_COUNT_CLASS
            : `text-h2 ${ADMIN_TEXT_META_CLASS}`
        }`}
        title={tile.permissionDenied ? t("admin_home_kpi_perm_denied_title") : undefined}
      >
        {value}
      </span>
    </>
  );

  if (!linkAllowed) {
    return (
      <div
        className={className}
        role="group"
        aria-disabled="true"
        data-tt-admin-kpi-perm-denied={tile.labelKey}
      >
        {body}
      </div>
    );
  }

  return (
    <AdminShellPrefetchLink href={tile.href} className={className}>
      {body}
    </AdminShellPrefetchLink>
  );
}

export function AdminHomeKpiStrip(props: {
  counts: AdminHomeKpiCounts;
  loading: boolean;
  kpiLoading: boolean;
  permissionsLoaded: boolean;
  hasPermission: (perm: string) => boolean;
  error: boolean;
  onRetry?: () => void;
  embedded?: boolean;
  /** 收件箱聚焦折叠内 · 不重复标题、订单数不抢待办视觉 */
  inboxFocusContext?: boolean;
}) {
  const { t } = useTranslation();
  const {
    counts,
    loading,
    kpiLoading,
    permissionsLoaded,
    hasPermission,
    error,
    onRetry,
    embedded,
    inboxFocusContext,
  } = props;

  const ordersDenied = permissionsLoaded && !hasPermission(ADMIN_PERM.ORDERS_READ);
  const disputesDenied = permissionsLoaded && !hasPermission(ADMIN_PERM.ORDERS_READ);

  const tiles: KpiTile[] = [
    {
      href: "/admin/orders",
      labelKey: "admin_home_kpi_orders_label",
      countKey: "admin_home_kpi_orders",
      loading: kpiLoading,
      count: counts.orders,
      permissionDenied: ordersDenied,
      emphasize:
        !inboxFocusContext && !ordersDenied && (counts.orders ?? 0) > 0,
    },
    {
      href: "/admin/disputes",
      labelKey: "admin_home_kpi_disputes_label",
      countKey: "admin_home_kpi_disputes",
      loading: kpiLoading,
      count: counts.disputes,
      permissionDenied: disputesDenied,
      emphasize: !disputesDenied && (counts.disputes ?? 0) > 0,
    },
  ];

  if (embedded) {
    return (
      <div data-tt-admin-home-kpi="1" data-tt-admin-home-kpi-embedded="1">
        <KpiStripBody
          t={t}
          tiles={tiles}
          error={error}
          onRetry={onRetry}
          loading={loading}
          hideTitle={Boolean(inboxFocusContext)}
          compactTiles={Boolean(inboxFocusContext)}
          hideScopeNote={Boolean(inboxFocusContext)}
        />
      </div>
    );
  }

  return (
    <AdminWarmL5Surface
      as="section"
      aria-label={t("admin_home_kpi_aria")}
      data-tt-admin-home-kpi="1"
    >
      <KpiStripBody t={t} tiles={tiles} error={error} onRetry={onRetry} loading={loading} />
    </AdminWarmL5Surface>
  );
}

function KpiStripBody(props: {
  t: (key: string, vars?: Record<string, string | number>) => string;
  tiles: KpiTile[];
  error: boolean;
  onRetry?: () => void;
  loading: boolean;
  hideTitle?: boolean;
  compactTiles?: boolean;
  hideScopeNote?: boolean;
}) {
  const { t, tiles, error, onRetry, loading, hideTitle, compactTiles, hideScopeNote } = props;
  return (
    <>
      {hideTitle ? null : (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={`text-body-l font-semibold ${ADMIN_TEXT_BODY_CLASS}`}>{t("admin_home_kpi_title")}</h2>
        {error && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className={`${touchTargetLink44Classes} text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_home_inbox_retry")}
          </button>
        ) : null}
      </div>
      )}
      {error && hideTitle && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className={`${touchTargetLink44Classes} text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
        >
          {t("admin_home_inbox_retry")}
        </button>
      ) : null}
      {error ? <p className="mt-2 text-small text-ink-600">{t("admin_home_kpi_error")}</p> : null}
      <ul className={`${compactTiles ? "mt-2" : "mt-4"} grid gap-3 sm:grid-cols-2`}>
        {tiles.map((tile) => (
          <li key={tile.href}>
            <KpiTileSurface tile={tile} t={t} compact={compactTiles} />
          </li>
        ))}
      </ul>
      {hideScopeNote ? null : (
      <div className={ADMIN_KPI_SCOPE_NOTE_CLASS} role="note" data-tt-admin-kpi-scope-honesty="1">
        <span className={`mt-0.5 ${ADMIN_INFO_BADGE_CLASS}`} aria-hidden>
          i
        </span>
        <p className={`text-small leading-snug ${ADMIN_TEXT_META_CLASS}`}>{t("admin_home_kpi_scope_note")}</p>
      </div>
      )}
      {loading ? (
        <p className="sr-only" role="status">
          {t("admin_home_kpi_loading")}
        </p>
      ) : null}
    </>
  );
}
