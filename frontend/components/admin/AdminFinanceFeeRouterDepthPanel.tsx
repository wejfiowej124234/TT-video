"use client";



import { useTranslation } from "@/components/LocaleProvider";

import { AdminFinanceDepthActionLinks } from "@/components/admin/AdminFinanceDepthActionLinks";

import { adminFinancePartialDepthHref } from "@/lib/admin/adminFinancePartialDepthHref";
import { ADMIN_FIN_DEPTH_PANEL_CLASS } from "@/lib/adminUi";



function feeRouterDepthLinks() {

  return [

    {

      href: adminFinancePartialDepthHref("/admin/finance-reconciliation", "reconciliation"),

      labelKey: "admin_fin_fee_router_depth_link_reconciliation",

    },

    {

      href: adminFinancePartialDepthHref("/admin/region-vault", "region-vault"),

      labelKey: "admin_fin_fee_router_depth_link_vault",

    },

    { href: "/admin/finance-suite", labelKey: "admin_fin_cross_check_depth_link_suite" },

  ] as const;

}



type Props = {

  total: number | null;

  minBlock: number | null;

  maxBlock: number | null;

  latestInserted: string | null;

  loading: boolean;

  error: boolean;

};



/** FIN-02 · ① 抽成路由 partial 深度工作台（② 链上结算闭环另闸）。 */

export function AdminFinanceFeeRouterDepthPanel({

  total,

  minBlock,

  maxBlock,

  latestInserted,

  loading,

  error,

}: Props) {

  const { t } = useTranslation();



  return (

    <section

      className={ADMIN_FIN_DEPTH_PANEL_CLASS}

      aria-label={t("admin_fin_fee_router_depth_aria")}

      data-tt-admin-fin-fee-router-depth="1"

    >

      <h2 className="text-body font-semibold text-ink-900">{t("admin_fin_fee_router_depth_title")}</h2>

      <p className="mt-1 text-small text-ink-600">{t("admin_fin_fee_router_depth_lead")}</p>



      {loading ? (

        <p className="mt-3 text-small text-ink-500">{t("admin_loading")}</p>

      ) : error ? (

        <p className="mt-3 text-small text-ink-500">{t("admin_fin_fee_router_depth_load_failed")}</p>

      ) : (

        <dl className="mt-3 grid gap-2 text-small sm:grid-cols-2" data-tt-admin-fin-fee-router-depth-snapshot="1">

          {total !== null ? (

            <div>

              <dt className="font-medium text-ink-700">{t("admin_fin_fee_router_depth_total")}</dt>

              <dd className="mt-0.5 text-ink-900">{total}</dd>

            </div>

          ) : null}

          {minBlock !== null || maxBlock !== null ? (

            <div>

              <dt className="font-medium text-ink-700">{t("admin_fin_fee_router_depth_blocks")}</dt>

              <dd className="mt-0.5 text-meta text-ink-800">

                {minBlock ?? "—"} → {maxBlock ?? "—"}

              </dd>

            </div>

          ) : null}

          {latestInserted ? (

            <div className="sm:col-span-2">

              <dt className="font-medium text-ink-700">{t("admin_fin_fee_router_depth_latest")}</dt>

              <dd className="mt-0.5 text-meta text-ink-800">{latestInserted}</dd>

            </div>

          ) : null}

        </dl>

      )}



      <AdminFinanceDepthActionLinks links={feeRouterDepthLinks()} />

    </section>

  );

}

