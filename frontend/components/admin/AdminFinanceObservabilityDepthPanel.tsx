"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminFinanceDepthActionLinks } from "@/components/admin/AdminFinanceDepthActionLinks";
import { adminFinancePartialDepthHref } from "@/lib/admin/adminFinancePartialDepthHref";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";

function observabilityDepthLinks() {
  return [
    {
      href: adminFinancePartialDepthHref("/admin/indexer", "indexer"),
      labelKey: "admin_fin_observability_depth_link_indexer",
    },
    {
      href: adminFinancePartialDepthHref("/admin/indexer/reconcile-reports", "reconcile-reports"),
      labelKey: "admin_fin_observability_depth_link_reconcile_reports",
    },
    { href: "/admin/alerts/incidents", labelKey: "admin_fin_observability_depth_link_incidents" },
    { href: "/admin/finance-suite", labelKey: "admin_fin_cross_check_depth_link_suite" },
  ] as const;
}

type Props = {
  chainId: string | null;
  indexerLag: number | null;
  status: string | null;
  loading: boolean;
  error: boolean;
};

/** FIN-02 · ① 可观测 partial 深度（② 全站监控另闸）。 */
export function AdminFinanceObservabilityDepthPanel({
  chainId,
  indexerLag,
  status,
  loading,
  error,
}: Props) {
  const { t } = useTranslation();

  return (
    <AdminWarmL5Surface
      as="section"
      className="mb-4"
      data-tt-admin-fin-depth-panel="1"
      aria-label={t("admin_fin_observability_depth_aria")}
      data-tt-admin-fin-observability-depth="1"
    >
      <h2 className="text-body font-semibold text-ink-900">{t("admin_fin_observability_depth_title")}</h2>
      <p className="mt-1 text-small text-ink-600">{t("admin_fin_observability_depth_lead")}</p>

      {loading ? (
        <p className="mt-3 text-small text-ink-500">{t("admin_loading")}</p>
      ) : error ? (
        <p className="mt-3 text-small text-ink-500">{t("admin_fin_observability_depth_load_failed")}</p>
      ) : (
        <dl className="mt-3 grid gap-2 text-small sm:grid-cols-2" data-tt-admin-fin-observability-depth-snapshot="1">
          {chainId ? (
            <div>
              <dt className="font-medium text-ink-700">{t("admin_fin_observability_depth_chain")}</dt>
              <dd className="mt-0.5 font-mono text-meta text-ink-800">{chainId}</dd>
            </div>
          ) : null}
          {indexerLag !== null ? (
            <div>
              <dt className="font-medium text-ink-700">{t("admin_fin_observability_depth_indexer_lag")}</dt>
              <dd className="mt-0.5 text-ink-900">{indexerLag}</dd>
            </div>
          ) : null}
          {status ? (
            <div className="sm:col-span-2">
              <dt className="font-medium text-ink-700">{t("admin_fin_observability_depth_status")}</dt>
              <dd className="mt-0.5 text-ink-900">{status}</dd>
            </div>
          ) : null}
        </dl>
      )}

      <AdminFinanceDepthActionLinks links={observabilityDepthLinks()} />
    </AdminWarmL5Surface>
  );
}
