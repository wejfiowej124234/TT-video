"use client";



import { useTranslation } from "@/components/LocaleProvider";

import { AdminFinanceDepthActionLinks } from "@/components/admin/AdminFinanceDepthActionLinks";

import { adminFinancePartialDepthHref } from "@/lib/admin/adminFinancePartialDepthHref";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";



function crossCheckDepthLinks() {

  return [

    {

      href: adminFinancePartialDepthHref("/admin/finance-reconciliation", "reconciliation"),

      labelKey: "admin_fin_cross_check_depth_link_reconciliation",

    },

    {

      href: adminFinancePartialDepthHref("/admin/drift-summary", "drift"),

      labelKey: "admin_fin_cross_check_depth_link_drift",

    },

    { href: "/admin/finance-suite", labelKey: "admin_fin_cross_check_depth_link_suite" },

  ] as const;

}



type Props = {

  status: string | null;

  slotCount: number;

  loading: boolean;

  error: boolean;

};



/** FIN-02 · ① 异常复核 partial 深度工作台（② 自动处置另闸）。 */

export function AdminFinanceCrossCheckDepthPanel({ status, slotCount, loading, error }: Props) {

  const { t } = useTranslation();



  return (

    <AdminWarmL5Surface
      as="section"
      className="mb-4"
      data-tt-admin-fin-depth-panel="1"

      aria-label={t("admin_fin_cross_check_depth_aria")}

      data-tt-admin-fin-cross-check-depth="1"

    >

      <h2 className="text-body font-semibold text-ink-900">{t("admin_fin_cross_check_depth_title")}</h2>

      <p className="mt-1 text-small text-ink-600">{t("admin_fin_cross_check_depth_lead")}</p>



      {loading ? (

        <p className="mt-3 text-small text-ink-500">{t("admin_loading")}</p>

      ) : error ? (

        <p className="mt-3 text-small text-ink-500">{t("admin_fin_cross_check_depth_load_failed")}</p>

      ) : (

        <dl className="mt-3 space-y-2 text-small" data-tt-admin-fin-cross-check-depth-snapshot="1">

          {status ? (

            <div>

              <dt className="font-medium text-ink-700">{t("admin_fin_cross_check_depth_status")}</dt>

              <dd className="mt-0.5 text-ink-800">{status}</dd>

            </div>

          ) : null}

          <div>

            <dt className="font-medium text-ink-700">{t("admin_fin_cross_check_depth_slots")}</dt>

            <dd className="mt-0.5 text-ink-900">{t("admin_fin_cross_check_depth_slot_count", { count: slotCount })}</dd>

          </div>

        </dl>

      )}



      <AdminFinanceDepthActionLinks links={crossCheckDepthLinks()} />

    </AdminWarmL5Surface>

  );

}

