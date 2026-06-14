"use client";

import { useCallback, useEffect, useId, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import {
  OfficialOpsDataTable,
  OfficialOpsTableBody,
  OfficialOpsTableHead,
  OfficialOpsTableTh,
} from "@/components/admin/ops/OfficialOpsDataTable";
import { adminTableRowPrimaryActionClass } from "@/components/admin/ops/OfficialOpsFilterBar";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { ADMIN_TABLE_TD_CELL_CLASS } from "@/lib/adminUi";
import { apiUrl } from "@/lib/api";
import { routes } from "@/lib/api/routes";
import { requestId, writeRequestHeaders } from "@/lib/apiClient/core";

type ReconcileLatest = {
  report_id?: string;
  created_at?: string;
  summary?: {
    stats?: {
      projection_closure_clean?: boolean;
      amount_triangle_marker?: string;
      epoch_reconcile_marker?: string;
    };
    amount_triangle?: { marker?: string; legs?: Record<string, unknown> };
    epoch_reconcile?: { marker?: string; epochs?: unknown[] };
  };
  observation_note?: string;
};

type ReportBrief = {
  report_id: string;
  created_at: string;
  projection_closure_clean?: boolean;
  amount_triangle_marker?: string;
  epoch_reconcile_marker?: string;
};

function adminHeaders() {
  return { ...writeRequestHeaders(), "x-request-id": requestId() };
}

export function AdminRegionShareReconcilePageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latest, setLatest] = useState<ReconcileLatest | null>(null);
  const [reports, setReports] = useState<ReportBrief[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [latestRes, listRes] = await Promise.all([
        fetch(apiUrl(routes.adminRegionShareReconcileLatest), { headers: adminHeaders() }),
        fetch(apiUrl(`${routes.adminRegionShareReconcileReports}?limit=20`), {
          headers: adminHeaders(),
        }),
      ]);
      if (!latestRes.ok) throw new Error(`latest HTTP ${latestRes.status}`);
      if (!listRes.ok) throw new Error(`list HTTP ${listRes.status}`);
      const latestJson = (await latestRes.json()) as ReconcileLatest;
      const listJson = (await listRes.json()) as { items?: ReportBrief[] };
      setLatest(latestJson);
      setReports(listJson.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "fetch_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const stats = latest?.summary?.stats;

  return (
    <AdminDetailPageChrome
      titleId={titleId}
      title={t("admin_region_share_reconcile_title")}
      subtitle={t("admin_region_share_reconcile_subtitle")}
    >
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.FINANCE_READ}
        messageKey="admin_perm_denied_finance_read"
      />
      <div className="mb-4">
        <button
          type="button"
          className={adminTableRowPrimaryActionClass()}
          disabled={loading}
          onClick={() => void reload()}
          data-tt-admin-region-share-reconcile-reload="1"
        >
          {t("admin_region_share_reconcile_reload")}
        </button>
      </div>

      <OpsPlaneFetchStates
        loading={loading}
        error={error}
        onRetry={() => void reload()}
        loadingMessageKey="ops_plane_loading"
        empty={!loading && !error && !latest?.report_id && !!latest?.observation_note}
        emptyMessageKey="admin_region_share_reconcile_empty"
      >
        <AdminWarmL5Surface className="mb-6 p-4" data-tt-admin-region-share-reconcile-latest="1">
          <h2 className="text-body-m font-medium">{t("admin_region_share_reconcile_latest_title")}</h2>
          {latest?.observation_note ? (
            <p className="mt-2 text-body-s text-ink-600">{latest.observation_note}</p>
          ) : (
            <dl className="mt-3 grid gap-2 text-body-s sm:grid-cols-2">
              <div>
                <dt className="text-ink-600">{t("admin_region_share_reconcile_report_id")}</dt>
                <dd>{latest?.report_id ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-ink-600">{t("admin_region_share_reconcile_created_at")}</dt>
                <dd>{latest?.created_at ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-ink-600">{t("admin_region_share_reconcile_closure_clean")}</dt>
                <dd>{String(stats?.projection_closure_clean ?? "—")}</dd>
              </div>
              <div>
                <dt className="text-ink-600">{t("admin_region_share_reconcile_triangle_marker")}</dt>
                <dd>{stats?.amount_triangle_marker ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-ink-600">{t("admin_region_share_reconcile_epoch_marker")}</dt>
                <dd>{stats?.epoch_reconcile_marker ?? "—"}</dd>
              </div>
            </dl>
          )}
        </AdminWarmL5Surface>

        <section data-tt-admin-region-share-reconcile-reports="1">
          <h2 className="text-body-m font-medium">{t("admin_region_share_reconcile_reports_title")}</h2>
          {reports.length === 0 ? (
            <p className="mt-2 text-body-s text-ink-600">{t("admin_region_share_reconcile_reports_empty")}</p>
          ) : (
            <OfficialOpsDataTable dataAttr="region-share-reconcile-reports" className="mt-3">
              <OfficialOpsTableHead>
                <tr>
                  <OfficialOpsTableTh>{t("admin_region_share_reconcile_created_at")}</OfficialOpsTableTh>
                  <OfficialOpsTableTh>{t("admin_region_share_reconcile_triangle_marker")}</OfficialOpsTableTh>
                  <OfficialOpsTableTh>{t("admin_region_share_reconcile_epoch_marker")}</OfficialOpsTableTh>
                  <OfficialOpsTableTh>{t("admin_region_share_reconcile_closure_clean")}</OfficialOpsTableTh>
                </tr>
              </OfficialOpsTableHead>
              <OfficialOpsTableBody>
                {reports.map((r) => (
                  <tr key={r.report_id}>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>{r.created_at}</td>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>{r.amount_triangle_marker ?? "—"}</td>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>{r.epoch_reconcile_marker ?? "—"}</td>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>{String(r.projection_closure_clean ?? "—")}</td>
                  </tr>
                ))}
              </OfficialOpsTableBody>
            </OfficialOpsDataTable>
          )}
        </section>
      </OpsPlaneFetchStates>
    </AdminDetailPageChrome>
  );
}
