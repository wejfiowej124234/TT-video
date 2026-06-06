"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminFinanceDepthActionLinks } from "@/components/admin/AdminFinanceDepthActionLinks";
import { adminFinancePartialDepthHref } from "@/lib/admin/adminFinancePartialDepthHref";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";

function reconcileReportsDepthLinks() {
  return [
    {
      href: adminFinancePartialDepthHref("/admin/indexer", "indexer"),
      labelKey: "admin_fin_reconcile_reports_depth_link_indexer",
    },
    {
      href: adminFinancePartialDepthHref("/admin/finance-reconciliation", "reconciliation"),
      labelKey: "admin_fin_reconcile_reports_depth_link_reconciliation",
    },
    { href: "/admin/finance-suite", labelKey: "admin_fin_cross_check_depth_link_suite" },
  ] as const;
}

type Props = {
  total: number;
  page: number;
  limit: number;
  reportType: string | null;
  hasActiveFilters: boolean;
  loading: boolean;
  error: boolean;
};

/** FIN-02 · ① 对账报告列表 partial 深度（② 全量导出另闸）。 */
export function AdminFinanceReconcileReportsDepthPanel({
  total,
  page,
  limit,
  reportType,
  hasActiveFilters,
  loading,
  error,
}: Props) {
  const { t } = useTranslation();

  return (
    <AdminWarmL5Surface
      as="section"
      className="mb-4"
      data-tt-admin-fin-depth-panel="1"
      aria-label={t("admin_fin_reconcile_reports_depth_aria")}
      data-tt-admin-fin-reconcile-reports-depth="1"
    >
      <h2 className="text-body font-semibold text-ink-900">
        {t("admin_fin_reconcile_reports_depth_title")}
      </h2>
      <p className="mt-1 text-small text-ink-600">{t("admin_fin_reconcile_reports_depth_lead")}</p>

      {loading ? (
        <p className="mt-3 text-small text-ink-500">{t("admin_loading")}</p>
      ) : error ? (
        <p className="mt-3 text-small text-ink-500">{t("admin_fin_reconcile_reports_depth_load_failed")}</p>
      ) : (
        <dl className="mt-3 grid gap-2 text-small sm:grid-cols-2" data-tt-admin-fin-reconcile-reports-depth-snapshot="1">
          <div>
            <dt className="font-medium text-ink-700">{t("admin_fin_reconcile_reports_depth_total")}</dt>
            <dd className="mt-0.5 text-ink-900">{total}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink-700">{t("admin_fin_reconcile_reports_depth_page")}</dt>
            <dd className="mt-0.5 text-ink-900">
              {t("admin_fin_reconcile_reports_depth_page_value", { page, limit })}
            </dd>
          </div>
          {reportType ? (
            <div>
              <dt className="font-medium text-ink-700">{t("admin_fin_reconcile_reports_depth_report_type")}</dt>
              <dd className="mt-0.5 font-mono text-meta text-ink-800">{reportType}</dd>
            </div>
          ) : null}
          <div>
            <dt className="font-medium text-ink-700">{t("admin_fin_reconcile_reports_depth_filters")}</dt>
            <dd className="mt-0.5 text-ink-900">
              {hasActiveFilters
                ? t("admin_fin_reconcile_reports_depth_filters_active")
                : t("admin_fin_reconcile_reports_depth_filters_none")}
            </dd>
          </div>
        </dl>
      )}

      <AdminFinanceDepthActionLinks links={reconcileReportsDepthLinks()} />
    </AdminWarmL5Surface>
  );
}
