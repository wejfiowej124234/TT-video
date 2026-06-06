"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminFinanceDepthActionLinks } from "@/components/admin/AdminFinanceDepthActionLinks";
import { adminFinancePartialDepthHref } from "@/lib/admin/adminFinancePartialDepthHref";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";

function trustGrowthDepthLinks() {
  return [
    {
      href: adminFinancePartialDepthHref("/admin/observability", "observability"),
      labelKey: "admin_fin_trust_growth_depth_link_observability",
    },
    {
      href: adminFinancePartialDepthHref("/admin/alerts/incidents", "alert-incidents"),
      labelKey: "admin_fin_trust_growth_depth_link_alerts",
    },
    { href: "/admin/finance-suite", labelKey: "admin_fin_cross_check_depth_link_suite" },
  ] as const;
}

type Props = {
  environment: string | null;
  autopilotGeneration: number | null;
  alertsCount: number;
  weightsFrozen: boolean | null;
  loading: boolean;
  error: boolean;
};

/** FIN-02 · ① 信任增长 partial 深度（② 主网权重闭环另闸）。 */
export function AdminFinanceTrustGrowthDepthPanel({
  environment,
  autopilotGeneration,
  alertsCount,
  weightsFrozen,
  loading,
  error,
}: Props) {
  const { t } = useTranslation();

  return (
    <AdminWarmL5Surface
      as="section"
      className="mb-4"
      aria-label={t("admin_fin_trust_growth_depth_aria")}
      data-tt-admin-fin-trust-growth-depth="1"
      data-tt-admin-fin-depth-panel="1"
    >
      <h2 className="text-body font-semibold text-ink-900">{t("admin_fin_trust_growth_depth_title")}</h2>
      <p className="mt-1 text-small text-ink-600">{t("admin_fin_trust_growth_depth_lead")}</p>

      {loading ? (
        <p className="mt-3 text-small text-ink-500">{t("admin_loading")}</p>
      ) : error ? (
        <p className="mt-3 text-small text-ink-500">{t("admin_fin_trust_growth_depth_load_failed")}</p>
      ) : (
        <dl className="mt-3 grid gap-2 text-small sm:grid-cols-2" data-tt-admin-fin-trust-growth-depth-snapshot="1">
          {environment ? (
            <div>
              <dt className="font-medium text-ink-700">{t("admin_fin_trust_growth_depth_env")}</dt>
              <dd className="mt-0.5 font-mono text-meta text-ink-800">{environment}</dd>
            </div>
          ) : null}
          {autopilotGeneration !== null ? (
            <div>
              <dt className="font-medium text-ink-700">{t("admin_fin_trust_growth_depth_generation")}</dt>
              <dd className="mt-0.5 text-ink-900">{autopilotGeneration}</dd>
            </div>
          ) : null}
          <div>
            <dt className="font-medium text-ink-700">{t("admin_fin_trust_growth_depth_alerts")}</dt>
            <dd className="mt-0.5 text-ink-900">{alertsCount}</dd>
          </div>
          {weightsFrozen !== null ? (
            <div>
              <dt className="font-medium text-ink-700">{t("admin_fin_trust_growth_depth_frozen")}</dt>
              <dd className="mt-0.5 text-ink-900">
                {weightsFrozen
                  ? t("admin_fin_trust_growth_depth_frozen_yes")
                  : t("admin_fin_trust_growth_depth_frozen_no")}
              </dd>
            </div>
          ) : null}
        </dl>
      )}

      <AdminFinanceDepthActionLinks links={trustGrowthDepthLinks()} />
    </AdminWarmL5Surface>
  );
}
