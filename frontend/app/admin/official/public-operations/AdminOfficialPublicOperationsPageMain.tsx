"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminOpsPlanePermissionBanners } from "@/components/admin/ops/AdminOpsPlanePermissionBanners";
import {
  OfficialOpsDataTable,
  OfficialOpsTableBody,
  OfficialOpsTableHead,
  OfficialOpsTableTh,
} from "@/components/admin/ops/OfficialOpsDataTable";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import {
  publicOperationsDrillDownHref,
  type PublicOperationsStatsTrack,
} from "@/lib/admin/adminPublicOperationsDrillDown";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { ADMIN_INLINE_LINK_CLASS, ADMIN_TABLE_TD_CELL_CLASS, adminTableRowPrimaryActionClass } from "@/lib/adminUi";
import type { AdminPublicOperationsOriginBucket } from "@/lib/apiClient/official/http";

import { AdminOfficialPublicOperationsFeaturedPanel } from "./AdminOfficialPublicOperationsFeaturedPanel";
import { AdminOfficialPublicOperationsPriorityPanel } from "./AdminOfficialPublicOperationsPriorityPanel";
import { AdminOfficialPublicOperationsPublishPanel } from "./AdminOfficialPublicOperationsPublishPanel";
import { AdminOfficialPublicOperationsHistoryPanel } from "./AdminOfficialPublicOperationsHistoryPanel";
import { AdminOfficialPublicOperationsPreviewPanel } from "./AdminOfficialPublicOperationsPreviewPanel";
import { AdminOfficialPublicOperationsSchedulePanel } from "./AdminOfficialPublicOperationsSchedulePanel";
import { AdminOfficialPublicOperationsSurfacePanel } from "./AdminOfficialPublicOperationsSurfacePanel";
import { AdminOfficialPublicOperationsCampaignPanel } from "./AdminOfficialPublicOperationsCampaignPanel";
import { AdminOfficialPublicOperationsTestPolicyPanel } from "./AdminOfficialPublicOperationsTestPolicyPanel";
import { useAdminOfficialPublicOperationsPage } from "./useAdminOfficialPublicOperationsPage";

type TabId = "statistics" | "publish" | "featured" | "priority" | "surface" | "schedule" | "preview" | "history" | "test_policy" | "campaign";

function formatOriginRows(bucket?: AdminPublicOperationsOriginBucket): { origin: string; count: number }[] {
  if (!bucket) return [];
  return Object.entries(bucket)
    .filter(([k]) => k !== "total")
    .map(([origin, count]) => ({ origin, count: Number(count) || 0 }))
    .sort((a, b) => a.origin.localeCompare(b.origin));
}

function StatsBucketTable({
  title,
  bucket,
  totalLabel,
  track,
}: {
  title: string;
  bucket?: AdminPublicOperationsOriginBucket;
  totalLabel: string;
  track: PublicOperationsStatsTrack;
}) {
  const { t } = useTranslation();
  const rows = formatOriginRows(bucket);
  const total = bucket?.total ?? 0;
  return (
    <section className="mt-6" aria-label={title}>
      <h2 className="text-body font-semibold text-ink-900">{title}</h2>
      <p className="mt-1 text-small text-ink-500">
        {totalLabel}: <span className="font-mono tabular-nums">{total}</span>
      </p>
      <OfficialOpsDataTable className="mt-3">
        <OfficialOpsTableHead>
          <tr>
            <OfficialOpsTableTh>{t("admin_public_operations_stats_col_origin")}</OfficialOpsTableTh>
            <OfficialOpsTableTh>{t("admin_public_operations_stats_col_count")}</OfficialOpsTableTh>
            <OfficialOpsTableTh>{t("admin_public_operations_stats_col_drilldown")}</OfficialOpsTableTh>
          </tr>
        </OfficialOpsTableHead>
        <OfficialOpsTableBody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className={ADMIN_TABLE_TD_CELL_CLASS}>
                {t("admin_public_operations_stats_empty")}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const href = publicOperationsDrillDownHref(track, row.origin);
              return (
                <tr key={row.origin}>
                  <td className={`${ADMIN_TABLE_TD_CELL_CLASS} font-mono`}>{row.origin}</td>
                  <td className={`${ADMIN_TABLE_TD_CELL_CLASS} tabular-nums`}>{row.count}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                    {href ? (
                      <Link
                        href={href}
                        className={ADMIN_INLINE_LINK_CLASS}
                        data-tt-admin-public-operations-drilldown="1"
                      >
                        {t("admin_public_operations_stats_open_list")}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </OfficialOpsTableBody>
      </OfficialOpsDataTable>
    </section>
  );
}

export function AdminOfficialPublicOperationsPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const [tab, setTab] = useState<TabId>("statistics");
  const { stats, loading, error, reload, lastFetchedAt } = useAdminOfficialPublicOperationsPage();

  const counts = stats?.data_origin_counts;
  const filterEnabled = stats?.filter_enabled;

  const filterHint = useMemo(() => {
    if (filterEnabled === undefined) return null;
    return filterEnabled
      ? t("admin_public_operations_filter_enabled_on")
      : t("admin_public_operations_filter_enabled_off");
  }, [filterEnabled, t]);

  return (
    <AdminDetailPageChrome
      titleId={titleId}
      title={t("admin_public_operations_title")}
      subtitle={t("admin_public_operations_subtitle")}
      mainDataAttrs={{ "data-tt-admin-public-operations-page": "1" }}
    >
      <AdminOpsPlanePermissionBanners
        read={ADMIN_PERM.OFFICIAL_READ}
        write={ADMIN_PERM.OFFICIAL_WRITE}
        publish={ADMIN_PERM.OFFICIAL_PUBLISH}
      />
      <div
        className="mb-4 flex flex-wrap gap-2 border-b border-ink-200"
        role="tablist"
        aria-label={t("admin_public_operations_tabs_aria")}
        data-tt-admin-public-operations-tabs="1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "statistics"}
          className={
            tab === "statistics"
              ? "border-b-2 border-ink-900 px-3 py-2 text-small font-semibold text-ink-900"
              : "px-3 py-2 text-small text-ink-600"
          }
          onClick={() => setTab("statistics")}
        >
          {t("admin_public_operations_tab_statistics")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "publish"}
          className={
            tab === "publish"
              ? "border-b-2 border-ink-900 px-3 py-2 text-small font-semibold text-ink-900"
              : "px-3 py-2 text-small text-ink-600"
          }
          onClick={() => setTab("publish")}
        >
          {t("admin_public_operations_tab_publish")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "featured"}
          className={
            tab === "featured"
              ? "border-b-2 border-ink-900 px-3 py-2 text-small font-semibold text-ink-900"
              : "px-3 py-2 text-small text-ink-600"
          }
          onClick={() => setTab("featured")}
        >
          {t("admin_public_operations_tab_featured")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "priority"}
          className={
            tab === "priority"
              ? "border-b-2 border-ink-900 px-3 py-2 text-small font-semibold text-ink-900"
              : "px-3 py-2 text-small text-ink-600"
          }
          onClick={() => setTab("priority")}
        >
          {t("admin_public_operations_tab_priority")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "surface"}
          className={
            tab === "surface"
              ? "border-b-2 border-ink-900 px-3 py-2 text-small font-semibold text-ink-900"
              : "px-3 py-2 text-small text-ink-600"
          }
          onClick={() => setTab("surface")}
        >
          {t("admin_public_operations_tab_surface")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "schedule"}
          className={
            tab === "schedule"
              ? "border-b-2 border-ink-900 px-3 py-2 text-small font-semibold text-ink-900"
              : "px-3 py-2 text-small text-ink-600"
          }
          onClick={() => setTab("schedule")}
        >
          {t("admin_public_operations_tab_schedule")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "preview"}
          className={
            tab === "preview"
              ? "border-b-2 border-ink-900 px-3 py-2 text-small font-semibold text-ink-900"
              : "px-3 py-2 text-small text-ink-600"
          }
          onClick={() => setTab("preview")}
        >
          {t("admin_public_operations_tab_preview")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "history"}
          className={
            tab === "history"
              ? "border-b-2 border-ink-900 px-3 py-2 text-small font-semibold text-ink-900"
              : "px-3 py-2 text-small text-ink-600"
          }
          onClick={() => setTab("history")}
        >
          {t("admin_public_operations_tab_history")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "test_policy"}
          className={
            tab === "test_policy"
              ? "border-b-2 border-ink-900 px-3 py-2 text-small font-semibold text-ink-900"
              : "px-3 py-2 text-small text-ink-600"
          }
          onClick={() => setTab("test_policy")}
        >
          {t("admin_public_operations_tab_test_policy")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "campaign"}
          className={
            tab === "campaign"
              ? "border-b-2 border-ink-900 px-3 py-2 text-small font-semibold text-ink-900"
              : "px-3 py-2 text-small text-ink-600"
          }
          onClick={() => setTab("campaign")}
        >
          {t("admin_public_operations_tab_campaign")}
        </button>
      </div>

      {tab === "publish" ? (
        <AdminOfficialPublicOperationsPublishPanel />
      ) : tab === "featured" ? (
        <AdminOfficialPublicOperationsFeaturedPanel />
      ) : tab === "priority" ? (
        <AdminOfficialPublicOperationsPriorityPanel />
      ) : tab === "surface" ? (
        <AdminOfficialPublicOperationsSurfacePanel />
      ) : tab === "schedule" ? (
        <AdminOfficialPublicOperationsSchedulePanel />
      ) : tab === "preview" ? (
        <AdminOfficialPublicOperationsPreviewPanel />
      ) : tab === "history" ? (
        <AdminOfficialPublicOperationsHistoryPanel />
      ) : tab === "test_policy" ? (
        <AdminOfficialPublicOperationsTestPolicyPanel />
      ) : tab === "campaign" ? (
        <AdminOfficialPublicOperationsCampaignPanel />
      ) : (
        <OpsPlaneFetchStates loading={loading} error={error} onRetry={() => void reload()}>
          {stats ? (
            <div data-tt-admin-public-operations-stats="1">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-small text-ink-600" role="note">
                  {t("admin_public_operations_stats_readonly_note")}
                </p>
                <button
                  type="button"
                  className={adminTableRowPrimaryActionClass()}
                  onClick={() => void reload()}
                  data-tt-admin-public-operations-refresh="1"
                >
                  {t("admin_public_operations_stats_refresh")}
                </button>
                {lastFetchedAt ? (
                  <span className="text-meta font-mono text-ink-500">
                    {t("admin_public_operations_stats_last_fetched")}: {lastFetchedAt}
                  </span>
                ) : null}
              </div>
              {filterHint ? (
                <p
                  className="mt-2 text-small font-mono text-ink-700"
                  data-tt-public-catalog-filter-enabled={filterEnabled ? "1" : "0"}
                >
                  {filterHint}
                </p>
              ) : null}
              <StatsBucketTable
                title={t("admin_public_operations_stats_guides")}
                bucket={counts?.guides}
                totalLabel={t("admin_public_operations_stats_total")}
                track="guides"
              />
              <StatsBucketTable
                title={t("admin_public_operations_stats_orders")}
                bucket={counts?.orders}
                totalLabel={t("admin_public_operations_stats_total")}
                track="orders"
              />
              <StatsBucketTable
                title={t("admin_public_operations_stats_market_listings")}
                bucket={counts?.market_listings}
                totalLabel={t("admin_public_operations_stats_total")}
                track="market_listings"
              />
              <StatsBucketTable
                title={t("admin_public_operations_stats_listings_provider")}
                bucket={counts?.market_listings_by_variant?.provider}
                totalLabel={t("admin_public_operations_stats_total")}
                track="market_listings"
              />
              <StatsBucketTable
                title={t("admin_public_operations_stats_listings_acquisition")}
                bucket={counts?.market_listings_by_variant?.acquisition}
                totalLabel={t("admin_public_operations_stats_total")}
                track="market_listings"
              />
              <StatsBucketTable
                title={t("admin_public_operations_stats_community_posts")}
                bucket={counts?.community_posts}
                totalLabel={t("admin_public_operations_stats_total")}
                track="community_posts"
              />
            </div>
          ) : null}
        </OpsPlaneFetchStates>
      )}
    </AdminDetailPageChrome>
  );
}
