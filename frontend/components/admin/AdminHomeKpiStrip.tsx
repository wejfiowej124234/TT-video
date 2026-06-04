"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";

import {
  adminHomeKpiMetricDisplay,
  adminHomeKpiTileLinkAllowed,
} from "@/lib/admin/adminHomeKpiMetric";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import type { AdminHomeKpiCounts } from "@/lib/admin/useAdminHomeKpi";

import {
  ADMIN_HOME_WIDGET_CARD_CLASS,
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_KPI_CARD_IDLE_CLASS,
  ADMIN_KPI_CARD_PENDING_CLASS,
  ADMIN_MOTION_CARD_HOVER_CLASS,
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
}: {
  tile: KpiTile;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const value = adminHomeKpiMetricDisplay(
    { loading: tile.loading, count: tile.count, permissionDenied: tile.permissionDenied },
    t,
    tile.countKey,
  );
  const linkAllowed = adminHomeKpiTileLinkAllowed(tile.permissionDenied);
  const className = `flex min-h-[5.5rem] flex-col justify-between rounded-[var(--radius-lg)] border p-4 ${
    linkAllowed ? ADMIN_MOTION_CARD_HOVER_CLASS : ""
  } ${travelFocusRingOffset2Classes} ${
    tile.emphasize ? ADMIN_KPI_CARD_PENDING_CLASS : ADMIN_KPI_CARD_IDLE_CLASS
  } ${!linkAllowed ? "cursor-not-allowed opacity-80" : ""}`;

  const body = (
    <>
      <span className="text-small font-medium text-ink-800">{t(tile.labelKey)}</span>
      <span
        className={`mt-2 text-h3 font-semibold tabular-nums ${
          tile.emphasize ? "text-ink-900" : "text-ink-700"
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
    <Link href={tile.href} className={className}>
      {body}
    </Link>
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
}) {
  const { t } = useTranslation();
  const { counts, loading, kpiLoading, permissionsLoaded, hasPermission, error, onRetry } = props;

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
      emphasize: !ordersDenied && (counts.orders ?? 0) > 0,
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

  return (
    <section
      className={ADMIN_HOME_WIDGET_CARD_CLASS}
      aria-label={t("admin_home_kpi_aria")}
      data-tt-admin-home-kpi="1"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-body-l font-semibold text-ink-900">{t("admin_home_kpi_title")}</h2>
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
      {error ? <p className="mt-2 text-small text-ink-600">{t("admin_home_kpi_error")}</p> : null}
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {tiles.map((tile) => (
          <li key={tile.href}>
            <KpiTileSurface tile={tile} t={t} />
          </li>
        ))}
      </ul>
      <div
        className="mt-3 flex items-start gap-2 rounded-[var(--radius-md)] border border-ink-100 bg-ink-50/90 px-3 py-2.5"
        role="note"
        data-tt-admin-kpi-scope-honesty="1"
      >
        <span
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-200 text-meta font-bold text-ink-700"
          aria-hidden
        >
          i
        </span>
        <p className="text-small leading-snug text-ink-600">{t("admin_home_kpi_scope_note")}</p>
      </div>
      {loading ? (
        <p className="sr-only" role="status">
          {t("admin_home_kpi_loading")}
        </p>
      ) : null}
    </section>
  );
}
