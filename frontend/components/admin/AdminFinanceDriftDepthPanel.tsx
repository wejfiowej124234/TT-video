"use client";



import { useTranslation } from "@/components/LocaleProvider";

import { AdminFinanceDepthActionLinks } from "@/components/admin/AdminFinanceDepthActionLinks";

import { adminFinancePartialDepthHref } from "@/lib/admin/adminFinancePartialDepthHref";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";



function driftDepthLinks() {

  return [

    {

      href: adminFinancePartialDepthHref("/admin/cross-check", "cross-check"),

      labelKey: "admin_fin_drift_depth_link_cross_check",

    },

    {

      href: adminFinancePartialDepthHref("/admin/finance-reconciliation", "reconciliation"),

      labelKey: "admin_fin_drift_depth_link_reconciliation",

    },

    { href: "/admin/finance-suite", labelKey: "admin_fin_drift_depth_link_suite" },

  ] as const;

}



type Props = {

  driftDetected: boolean | null;

  status: string | null;

  loading: boolean;

  error: boolean;

};



/** FIN-02 · ① drift-summary 页内深度（② 自动处置另闸）。 */

export function AdminFinanceDriftDepthPanel({ driftDetected, status, loading, error }: Props) {

  const { t } = useTranslation();

  const driftLabel =

    driftDetected === null

      ? "—"

      : driftDetected

        ? t("admin_drift_summary_drift_detected_true")

        : t("admin_drift_summary_drift_detected_false");



  return (

    <AdminWarmL5Surface
      as="section"
      className="mb-4"
      data-tt-admin-fin-depth-panel="1"

      aria-label={t("admin_fin_drift_depth_aria")}

      data-tt-admin-fin-drift-depth="1"

    >

      <h2 className="text-body font-semibold text-ink-900">{t("admin_fin_drift_depth_title")}</h2>

      <p className="mt-1 text-small text-ink-600">{t("admin_fin_drift_depth_lead")}</p>



      {loading ? (

        <p className="mt-3 text-small text-ink-500">{t("admin_loading")}</p>

      ) : error ? (

        <p className="mt-3 text-small text-ink-500">{t("admin_fin_drift_depth_load_failed")}</p>

      ) : (

        <dl className="mt-3 grid gap-2 text-small sm:grid-cols-2" data-tt-admin-fin-drift-depth-snapshot="1">

          <div>

            <dt className="font-medium text-ink-700">{t("admin_fin_drift_depth_detected")}</dt>

            <dd className="mt-0.5 text-ink-800">{driftLabel}</dd>

          </div>

          {status ? (

            <div>

              <dt className="font-medium text-ink-700">{t("admin_fin_drift_depth_status")}</dt>

              <dd className="mt-0.5 text-ink-800">{status}</dd>

            </div>

          ) : null}

        </dl>

      )}



      <AdminFinanceDepthActionLinks links={driftDepthLinks()} />

    </AdminWarmL5Surface>

  );

}

